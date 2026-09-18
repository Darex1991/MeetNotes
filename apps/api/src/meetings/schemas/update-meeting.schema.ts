import { Static, Type } from "@sinclair/typebox";
import { speakerMapSchema } from "./meeting.schema";

export const updateMeetingSchema = Type.Object({
  title: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
  speakers: Type.Optional(speakerMapSchema),
});

export type UpdateMeetingBody = Static<typeof updateMeetingSchema>;
