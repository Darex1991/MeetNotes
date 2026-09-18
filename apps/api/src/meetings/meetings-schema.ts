import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "src/storage/schema/utils";
import { user } from "src/auth/auth-schema";
import { file } from "src/file-storage/files-schema";
import type {
  ActionItem,
  Decision,
  SpeakerMap,
  TranscriptSegment,
} from "src/ai/ai.types";

export const MEETING_STATUSES = [
  "uploaded",
  "transcribing",
  "diarizing",
  "summarizing",
  "completed",
  "failed",
] as const;

export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const PROCESSING_STAGES = [
  "transcribe",
  "diarize",
  "summarize",
] as const;
export type ProcessingStage = (typeof PROCESSING_STAGES)[number];

export const meetingStatusEnum = pgEnum("meeting_status", MEETING_STATUSES);
export const processingStageEnum = pgEnum(
  "processing_stage",
  PROCESSING_STAGES,
);

export const meeting = pgTable("meeting", {
  ...id,
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  fileId: uuid("file_id")
    .notNull()
    .references(() => file.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  status: meetingStatusEnum("status").notNull().default("uploaded"),
  progress: integer("progress").notNull().default(0),
  failedStage: processingStageEnum("failed_stage"),
  errorMessage: text("error_message"),
  language: text("language"),
  durationSeconds: real("duration_seconds"),
  transcript: jsonb("transcript").$type<TranscriptSegment[]>(),
  speakers: jsonb("speakers").$type<SpeakerMap>(),
  summary: text("summary"),
  keyTopics: jsonb("key_topics").$type<string[]>(),
  actionItems: jsonb("action_items").$type<ActionItem[]>(),
  decisions: jsonb("decisions").$type<Decision[]>(),
  processingStartedAt: timestamp("processing_started_at", {
    mode: "string",
    withTimezone: true,
    precision: 3,
  }),
  completedAt: timestamp("completed_at", {
    mode: "string",
    withTimezone: true,
    precision: 3,
  }),
  ...timestamps,
});
