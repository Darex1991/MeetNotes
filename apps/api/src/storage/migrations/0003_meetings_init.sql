CREATE TYPE "public"."meeting_status" AS ENUM('uploaded', 'transcribing', 'diarizing', 'summarizing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."processing_stage" AS ENUM('transcribe', 'diarize', 'summarize');--> statement-breakpoint
CREATE TABLE "meeting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"file_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "meeting_status" DEFAULT 'uploaded' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"failed_stage" "processing_stage",
	"error_message" text,
	"language" text,
	"duration_seconds" real,
	"transcript" jsonb,
	"speakers" jsonb,
	"summary" text,
	"key_topics" jsonb,
	"action_items" jsonb,
	"decisions" jsonb,
	"processing_started_at" timestamp(3) with time zone,
	"completed_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE restrict ON UPDATE no action;