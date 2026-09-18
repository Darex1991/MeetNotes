import { Inject, Injectable, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { createWriteStream, promises as fs } from "fs";
import os from "os";
import path from "path";
import { pipeline } from "stream/promises";
import { DatabasePg } from "src/common";
import { FileStorageService } from "src/file-storage";
import {
  DiarizationProvider,
  SummaryProvider,
  TranscriptionProvider,
} from "src/ai";
import { meeting, MeetingStatus, ProcessingStage } from "./meetings-schema";
import { MeetingsProcessingService } from "./meetings-processing.service";

type MeetingRow = typeof meeting.$inferSelect;

/**
 * Worker-side implementation of the three pipeline stages. Each stage loads the meeting,
 * updates status/progress, does the heavy lifting through the configured AI adapter,
 * persists the result and enqueues the next stage.
 */
@Injectable()
export class MeetingsPipelineService {
  private readonly logger = new Logger(MeetingsPipelineService.name);

  constructor(
    @Inject("DB") private readonly db: DatabasePg,
    private readonly fileStorage: FileStorageService,
    private readonly transcription: TranscriptionProvider,
    private readonly diarization: DiarizationProvider,
    private readonly summary: SummaryProvider,
    private readonly processing: MeetingsProcessingService,
  ) {}

  async transcribe(
    meetingId: string,
    onProgress?: (p: number) => Promise<void>,
  ) {
    const row = await this.loadMeeting(meetingId);
    if (!row) return;

    await this.setStatus(meetingId, "transcribing", 5, {
      processingStartedAt: new Date().toISOString(),
      failedStage: null,
      errorMessage: null,
    });

    await this.withLocalFile(row, async (filePath, mimeType, originalName) => {
      await this.setProgress(meetingId, 15, onProgress);
      this.logger.log(
        `Transcribing meeting ${meetingId} using ${this.transcription.name}`,
      );

      const result = await this.transcription.transcribe({
        filePath,
        mimeType,
        originalName,
        language: row.language,
      });

      await this.db
        .update(meeting)
        .set({
          transcript: result.segments,
          language: result.language ?? row.language,
          durationSeconds: result.durationSeconds ?? row.durationSeconds,
          progress: 50,
        })
        .where(eq(meeting.id, meetingId));
    });

    await this.processing.enqueueStage("diarize", meetingId);
  }

  async diarize(meetingId: string, onProgress?: (p: number) => Promise<void>) {
    const row = await this.loadMeeting(meetingId);
    if (!row) return;

    if (!row.transcript) {
      throw new Error("Cannot diarize a meeting without a transcript");
    }

    await this.setStatus(meetingId, "diarizing", 55, {
      failedStage: null,
      errorMessage: null,
    });

    const transcript = row.transcript;
    await this.withLocalFile(row, async (filePath, mimeType) => {
      await this.setProgress(meetingId, 60, onProgress);
      this.logger.log(
        `Diarizing meeting ${meetingId} using ${this.diarization.name}`,
      );

      const result = await this.diarization.diarize({
        filePath,
        mimeType,
        segments: transcript,
        language: row.language,
      });

      // Keep any names the user already assigned to the same speaker ids.
      const speakers = { ...result.speakers, ...(row.speakers ?? {}) };

      await this.db
        .update(meeting)
        .set({ transcript: result.segments, speakers, progress: 75 })
        .where(eq(meeting.id, meetingId));
    });

    await this.processing.enqueueStage("summarize", meetingId);
  }

  async summarize(
    meetingId: string,
    onProgress?: (p: number) => Promise<void>,
  ) {
    const row = await this.loadMeeting(meetingId);
    if (!row) return;

    if (!row.transcript) {
      throw new Error("Cannot summarize a meeting without a transcript");
    }

    await this.setStatus(meetingId, "summarizing", 80, {
      failedStage: null,
      errorMessage: null,
    });
    await this.setProgress(meetingId, 85, onProgress);
    this.logger.log(
      `Summarizing meeting ${meetingId} using ${this.summary.name}`,
    );

    const result = await this.summary.summarize({
      title: row.title,
      language: row.language,
      segments: row.transcript,
      speakers: row.speakers ?? {},
    });

    await this.db
      .update(meeting)
      .set({
        summary: result.summary,
        keyTopics: result.keyTopics,
        actionItems: result.actionItems,
        decisions: result.decisions,
        status: "completed",
        progress: 100,
        completedAt: new Date().toISOString(),
      })
      .where(eq(meeting.id, meetingId));
  }

  async markFailed(meetingId: string, stage: ProcessingStage, message: string) {
    this.logger.error(`Meeting ${meetingId} failed at ${stage}: ${message}`);

    await this.db
      .update(meeting)
      .set({
        status: "failed",
        failedStage: stage,
        errorMessage: message.slice(0, 2000),
      })
      .where(eq(meeting.id, meetingId));
  }

  private async loadMeeting(meetingId: string): Promise<MeetingRow | null> {
    const [row] = await this.db
      .select()
      .from(meeting)
      .where(eq(meeting.id, meetingId));

    if (!row) {
      this.logger.warn(`Meeting ${meetingId} no longer exists; skipping job`);
      return null;
    }

    return row;
  }

  private async setStatus(
    meetingId: string,
    status: MeetingStatus,
    progress: number,
    extra: Partial<typeof meeting.$inferInsert> = {},
  ) {
    await this.db
      .update(meeting)
      .set({ status, progress, ...extra })
      .where(eq(meeting.id, meetingId));
  }

  private async setProgress(
    meetingId: string,
    progress: number,
    onProgress?: (p: number) => Promise<void>,
  ) {
    await this.db
      .update(meeting)
      .set({ progress })
      .where(eq(meeting.id, meetingId));
    await onProgress?.(progress);
  }

  /** Streams the recording from object storage to a temp file for the duration of `fn`. */
  private async withLocalFile<T>(
    row: MeetingRow,
    fn: (
      filePath: string,
      mimeType: string,
      originalName: string,
    ) => Promise<T>,
  ): Promise<T> {
    const file = await this.fileStorage.getFileById(row.fileId);
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "meeting-"));
    const ext = path.extname(file.originalName) || "";
    const filePath = path.join(dir, `${row.id}${ext}`);

    try {
      const stream = await this.fileStorage.getFileStream(file.storageKey);
      await pipeline(stream, createWriteStream(filePath));

      return await fn(filePath, file.mimeType, file.originalName);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }
}
