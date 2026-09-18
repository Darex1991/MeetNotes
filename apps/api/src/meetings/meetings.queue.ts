import type { ProcessingStage } from "./meetings-schema";

export const MEETING_PROCESSING_QUEUE = {
  name: "meeting-processing-queue",
  actions: {
    TRANSCRIBE: "TRANSCRIBE" as const,
    DIARIZE: "DIARIZE" as const,
    SUMMARIZE: "SUMMARIZE" as const,
  },
};

export type MeetingProcessingAction =
  (typeof MEETING_PROCESSING_QUEUE.actions)[keyof typeof MEETING_PROCESSING_QUEUE.actions];

export type MeetingProcessingJobPayload = {
  meetingId: string;
};

export const STAGE_TO_ACTION: Record<ProcessingStage, MeetingProcessingAction> =
  {
    transcribe: MEETING_PROCESSING_QUEUE.actions.TRANSCRIBE,
    diarize: MEETING_PROCESSING_QUEUE.actions.DIARIZE,
    summarize: MEETING_PROCESSING_QUEUE.actions.SUMMARIZE,
  };

export const ACTION_TO_STAGE: Record<MeetingProcessingAction, ProcessingStage> =
  {
    TRANSCRIBE: "transcribe",
    DIARIZE: "diarize",
    SUMMARIZE: "summarize",
  };
