import { Static, Type } from "@sinclair/typebox";

export const createMeetingSchema = Type.Object({
  // Multer takes the file off the body before validation; declared here only so the
  // OpenAPI document (and the generated client) know the multipart field.
  file: Type.Optional(
    Type.String({
      format: "binary",
      description:
        "Audio or video recording (multipart/form-data field `file`).",
    }),
  ),
  title: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
  language: Type.Optional(
    Type.String({
      minLength: 2,
      maxLength: 5,
      description:
        "ISO-639-1 hint for Whisper, e.g. 'pl' or 'en'. Auto-detected when omitted.",
    }),
  ),
});

export type CreateMeetingBody = Static<typeof createMeetingSchema>;
