import { registerAs } from "@nestjs/config";
import { Static, Type } from "@sinclair/typebox";
import { configValidator } from "src/utils/configValidator";

const schema = Type.Object({
  TRANSCRIPTION_ADAPTER: Type.Union([
    Type.Literal("openai"),
    Type.Literal("local"),
    Type.Literal("mock"),
  ]),
  DIARIZATION_ADAPTER: Type.Union([
    Type.Literal("heuristic"),
    Type.Literal("claude"),
    Type.Literal("pyannote"),
  ]),
  SUMMARY_ADAPTER: Type.Union([Type.Literal("claude"), Type.Literal("mock")]),
  OPENAI_API_KEY: Type.Optional(Type.String()),
  OPENAI_WHISPER_MODEL: Type.String(),
  LOCAL_WHISPER_BINARY: Type.String(),
  LOCAL_WHISPER_MODEL: Type.String(),
  ANTHROPIC_API_KEY: Type.Optional(Type.String()),
  ANTHROPIC_MODEL: Type.String(),
  DIARIZATION_SERVICE_URL: Type.Optional(Type.String()),
  MAX_UPLOAD_MB: Type.Number(),
});

export type AiConfigSchema = Static<typeof schema>;

const validateAiConfig = configValidator(schema);

export const DEFAULT_ANTHROPIC_MODEL = "claude-opus-5";
export const DEFAULT_MAX_UPLOAD_MB = 500;

export default registerAs("ai", (): AiConfigSchema => {
  const values = {
    TRANSCRIPTION_ADAPTER: process.env.TRANSCRIPTION_ADAPTER ?? "mock",
    DIARIZATION_ADAPTER: process.env.DIARIZATION_ADAPTER ?? "heuristic",
    SUMMARY_ADAPTER: process.env.SUMMARY_ADAPTER ?? "mock",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || undefined,
    OPENAI_WHISPER_MODEL: process.env.OPENAI_WHISPER_MODEL ?? "whisper-1",
    LOCAL_WHISPER_BINARY: process.env.LOCAL_WHISPER_BINARY ?? "whisper",
    LOCAL_WHISPER_MODEL: process.env.LOCAL_WHISPER_MODEL ?? "base",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || undefined,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL,
    DIARIZATION_SERVICE_URL: process.env.DIARIZATION_SERVICE_URL || undefined,
    MAX_UPLOAD_MB: Number(process.env.MAX_UPLOAD_MB ?? DEFAULT_MAX_UPLOAD_MB),
  };

  return validateAiConfig(values);
});
