import { Static, TUnsafe, Type } from "@sinclair/typebox";
import { UUIDSchema } from "src/common";
import { MEETING_STATUSES, PROCESSING_STAGES } from "../meetings-schema";

const nullable = <T extends Parameters<typeof Type.Union>[0][number]>(
  schema: T,
) => Type.Union([schema, Type.Null()]);

export const meetingStatusSchema = Type.Union(
  MEETING_STATUSES.map((status) => Type.Literal(status)),
);

export const processingStageSchema = Type.Union(
  PROCESSING_STAGES.map((stage) => Type.Literal(stage)),
);

export const transcriptSegmentSchema = Type.Object({
  id: Type.Integer(),
  start: Type.Number(),
  end: Type.Number(),
  text: Type.String(),
  speaker: nullable(Type.String()),
});

export const actionItemSchema = Type.Object({
  title: Type.String(),
  owner: nullable(Type.String()),
  dueDate: nullable(Type.String()),
  priority: Type.Union([
    Type.Literal("low"),
    Type.Literal("medium"),
    Type.Literal("high"),
  ]),
  sourceSegmentIds: Type.Array(Type.Integer()),
});

export const decisionSchema = Type.Object({
  title: Type.String(),
  rationale: nullable(Type.String()),
  sourceSegmentIds: Type.Array(Type.Integer()),
});

// `additionalProperties` (instead of Type.Record's patternProperties) keeps the OpenAPI
// output as a proper Record<string, string> for the generated client.
export const speakerMapSchema = Type.Object(
  {},
  { additionalProperties: Type.String() },
) as unknown as TUnsafe<Record<string, string>>;

export const meetingListItemSchema = Type.Object({
  id: UUIDSchema,
  title: Type.String(),
  status: meetingStatusSchema,
  progress: Type.Integer(),
  failedStage: nullable(processingStageSchema),
  errorMessage: nullable(Type.String()),
  language: nullable(Type.String()),
  durationSeconds: nullable(Type.Number()),
  fileName: Type.String(),
  mimeType: Type.String(),
  byteSize: Type.Number(),
  actionItemsCount: Type.Integer(),
  decisionsCount: Type.Integer(),
  speakersCount: Type.Integer(),
  processingStartedAt: nullable(Type.String()),
  completedAt: nullable(Type.String()),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const meetingSchema = Type.Composite([
  meetingListItemSchema,
  Type.Object({
    transcript: nullable(Type.Array(transcriptSegmentSchema)),
    speakers: speakerMapSchema,
    summary: nullable(Type.String()),
    keyTopics: Type.Array(Type.String()),
    actionItems: Type.Array(actionItemSchema),
    decisions: Type.Array(decisionSchema),
  }),
]);

export const meetingListSchema = Type.Array(meetingListItemSchema);

export const mediaUrlSchema = Type.Object({
  url: Type.String(),
  expiresAt: Type.String(),
});

export type MeetingListItem = Static<typeof meetingListItemSchema>;
export type MeetingResponse = Static<typeof meetingSchema>;
export type MediaUrlResponse = Static<typeof mediaUrlSchema>;
