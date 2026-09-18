import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { createReadStream, promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { DatabasePg } from "src/common";
import { FileStorageService } from "src/file-storage";
import { file } from "src/file-storage/files-schema";
import { meeting, ProcessingStage } from "./meetings-schema";
import { MeetingsProcessingService } from "./meetings-processing.service";
import { meetingToMarkdown } from "./meetings-export";
import type { CreateMeetingBody } from "./schemas/create-meeting.schema";
import type { UpdateMeetingBody } from "./schemas/update-meeting.schema";
import type {
  MediaUrlResponse,
  MeetingListItem,
  MeetingResponse,
} from "./schemas/meeting.schema";

const ACCEPTED_MIME_PREFIXES = ["audio/", "video/"];
const ACCEPTED_EXTENSIONS = new Set([
  ".mp3",
  ".m4a",
  ".wav",
  ".flac",
  ".ogg",
  ".oga",
  ".opus",
  ".aac",
  ".wma",
  ".webm",
  ".mp4",
  ".mov",
  ".mkv",
  ".avi",
  ".mpeg",
  ".mpga",
]);
const MEDIA_URL_TTL_SECONDS = 3600;

type MeetingRow = typeof meeting.$inferSelect;
type FileRow = typeof file.$inferSelect;

@Injectable()
export class MeetingsService {
  constructor(
    @Inject("DB") private readonly db: DatabasePg,
    private readonly fileStorage: FileStorageService,
    private readonly processing: MeetingsProcessingService,
  ) {}

  async createFromUpload(
    userId: string,
    upload: Express.Multer.File | undefined,
    body: CreateMeetingBody,
  ): Promise<MeetingResponse> {
    if (!upload?.path) {
      throw new BadRequestException("A media file is required");
    }

    try {
      this.assertMediaFile(upload);

      const meetingId = randomUUID();
      const extension = path.extname(upload.originalname).toLowerCase();
      const key = `meetings/${userId}/${meetingId}${extension}`;

      const uploadResult = await this.fileStorage.uploadFile({
        key,
        body: createReadStream(upload.path),
        byteSize: upload.size,
        contentType: upload.mimetype,
        originalName: upload.originalname,
        entityRef: this.fileStorage.generateEntityRef("meeting", meetingId),
      });

      const [created] = await this.db
        .insert(meeting)
        .values({
          id: meetingId,
          userId,
          fileId: uploadResult.file.id,
          title:
            body.title?.trim() || this.titleFromFilename(upload.originalname),
          language: body.language ?? null,
          speakers: {},
        })
        .returning();

      await this.processing.enqueueStage("transcribe", created.id);

      return this.toDetail(created, uploadResult.file);
    } finally {
      await fs.rm(upload.path, { force: true });
    }
  }

  async listForUser(userId: string): Promise<MeetingListItem[]> {
    const rows = await this.db
      .select({ meeting, file })
      .from(meeting)
      .innerJoin(file, eq(file.id, meeting.fileId))
      .where(eq(meeting.userId, userId))
      .orderBy(desc(meeting.createdAt));

    return rows.map((row) => this.toListItem(row.meeting, row.file));
  }

  async getForUser(
    userId: string,
    meetingId: string,
  ): Promise<MeetingResponse> {
    const { meeting: row, file: fileRow } = await this.findOwned(
      userId,
      meetingId,
    );

    return this.toDetail(row, fileRow);
  }

  async update(
    userId: string,
    meetingId: string,
    data: UpdateMeetingBody,
  ): Promise<MeetingResponse> {
    const { meeting: row, file: fileRow } = await this.findOwned(
      userId,
      meetingId,
    );

    const speakers = data.speakers
      ? { ...(row.speakers ?? {}), ...this.cleanSpeakers(data.speakers) }
      : undefined;

    const [updated] = await this.db
      .update(meeting)
      .set({
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(speakers ? { speakers } : {}),
      })
      .where(eq(meeting.id, meetingId))
      .returning();

    return this.toDetail(updated, fileRow);
  }

  async delete(userId: string, meetingId: string): Promise<void> {
    const { meeting: row, file: fileRow } = await this.findOwned(
      userId,
      meetingId,
    );

    await this.db.delete(meeting).where(eq(meeting.id, row.id));
    await this.fileStorage.deleteFile(fileRow.storageKey);
  }

  async retry(userId: string, meetingId: string): Promise<MeetingResponse> {
    const { meeting: row, file: fileRow } = await this.findOwned(
      userId,
      meetingId,
    );

    if (row.status !== "failed") {
      throw new ConflictException("Only failed meetings can be retried");
    }

    const stage: ProcessingStage =
      row.failedStage ?? (row.transcript ? "diarize" : "transcribe");

    const [updated] = await this.db
      .update(meeting)
      .set({ status: "uploaded", progress: 0, errorMessage: null })
      .where(eq(meeting.id, row.id))
      .returning();

    await this.processing.enqueueStage(stage, row.id);

    return this.toDetail(updated, fileRow);
  }

  async getMediaUrl(
    userId: string,
    meetingId: string,
  ): Promise<MediaUrlResponse> {
    const { file: fileRow } = await this.findOwned(userId, meetingId);
    const url = await this.fileStorage.getSignedDownloadUrl(
      fileRow.storageKey,
      MEDIA_URL_TTL_SECONDS,
    );

    return {
      url,
      expiresAt: new Date(
        Date.now() + MEDIA_URL_TTL_SECONDS * 1000,
      ).toISOString(),
    };
  }

  async exportMarkdown(
    userId: string,
    meetingId: string,
  ): Promise<{ filename: string; content: string }> {
    const { meeting: row } = await this.findOwned(userId, meetingId);

    const content = meetingToMarkdown({
      title: row.title,
      createdAt: row.createdAt,
      durationSeconds: row.durationSeconds,
      summary: row.summary,
      keyTopics: row.keyTopics ?? [],
      actionItems: row.actionItems ?? [],
      decisions: row.decisions ?? [],
      transcript: row.transcript,
      speakers: row.speakers ?? {},
    });

    const slug =
      row.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 60) || "meeting";

    return { filename: `${slug}.md`, content };
  }

  private async findOwned(userId: string, meetingId: string) {
    const [row] = await this.db
      .select({ meeting, file })
      .from(meeting)
      .innerJoin(file, eq(file.id, meeting.fileId))
      .where(and(eq(meeting.id, meetingId), eq(meeting.userId, userId)));

    if (!row) {
      throw new NotFoundException("Meeting not found");
    }

    return row;
  }

  private assertMediaFile(upload: Express.Multer.File) {
    const extension = path.extname(upload.originalname).toLowerCase();
    const mimeOk = ACCEPTED_MIME_PREFIXES.some((prefix) =>
      upload.mimetype.startsWith(prefix),
    );

    if (!mimeOk && !ACCEPTED_EXTENSIONS.has(extension)) {
      throw new BadRequestException(
        `Unsupported file type ${upload.mimetype || extension}. Upload an audio or video recording.`,
      );
    }
  }

  private titleFromFilename(filename: string) {
    const base = path.parse(filename).name.replace(/[_-]+/g, " ").trim();

    return base || `Meeting ${new Date().toISOString().slice(0, 10)}`;
  }

  private cleanSpeakers(speakers: Record<string, string>) {
    return Object.fromEntries(
      Object.entries(speakers)
        .map(([id, name]) => [id, name.trim()])
        .filter(([, name]) => name.length > 0),
    );
  }

  private toListItem(row: MeetingRow, fileRow: FileRow): MeetingListItem {
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      progress: row.progress,
      failedStage: row.failedStage,
      errorMessage: row.errorMessage,
      language: row.language,
      durationSeconds: row.durationSeconds,
      fileName: fileRow.originalName,
      mimeType: fileRow.mimeType,
      byteSize: fileRow.byteSize,
      actionItemsCount: row.actionItems?.length ?? 0,
      decisionsCount: row.decisions?.length ?? 0,
      speakersCount: Object.keys(row.speakers ?? {}).length,
      processingStartedAt: row.processingStartedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toDetail(row: MeetingRow, fileRow: FileRow): MeetingResponse {
    return {
      ...this.toListItem(row, fileRow),
      transcript: row.transcript,
      speakers: row.speakers ?? {},
      summary: row.summary,
      keyTopics: row.keyTopics ?? [],
      actionItems: row.actionItems ?? [],
      decisions: row.decisions ?? [],
    };
  }
}
