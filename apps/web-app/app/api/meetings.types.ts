import type { GetMeetingResponse, ListMeetingsResponse } from "./generated-api";

export type Meeting = GetMeetingResponse["data"];
export type MeetingListItem = ListMeetingsResponse["data"][number];
export type MeetingStatus = Meeting["status"];
export type ProcessingStage = NonNullable<Meeting["failedStage"]>;
export type TranscriptSegment = NonNullable<Meeting["transcript"]>[number];
export type ActionItem = Meeting["actionItems"][number];
export type Decision = Meeting["decisions"][number];

export const PROCESSING_STATUSES: MeetingStatus[] = [
  "uploaded",
  "transcribing",
  "diarizing",
  "summarizing"
];

export const isProcessing = (status: MeetingStatus) =>
  PROCESSING_STATUSES.includes(status);

export const meetingKeys = {
  all: ["meetings"] as const,
  list: () => [...meetingKeys.all, "list"] as const,
  detail: (id: string) => [...meetingKeys.all, "detail", id] as const,
  mediaUrl: (id: string) => [...meetingKeys.all, "media-url", id] as const
};
