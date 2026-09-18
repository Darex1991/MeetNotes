import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { openAsBlob, promises as fs } from "fs";
import { TranscriptionInput, TranscriptionResult } from "../ai.types";
import { TranscriptionProvider } from "./transcription.provider";

/**
 * Whisper via the OpenAI Audio API (`/v1/audio/transcriptions`).
 * The hosted endpoint accepts files up to 25 MB; larger uploads should be
 * transcribed with the `local` adapter or pre-compressed to a low-bitrate audio track.
 */
const OPENAI_MAX_FILE_BYTES = 25 * 1024 * 1024;

type VerboseJsonResponse = {
  language?: string;
  duration?: number;
  text?: string;
  segments?: Array<{ id: number; start: number; end: number; text: string }>;
};

@Injectable()
export class OpenAiWhisperAdapter extends TranscriptionProvider {
  readonly name = "openai";
  private readonly logger = new Logger(OpenAiWhisperAdapter.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(configService: ConfigService) {
    super();
    const apiKey = configService.get<string>("ai.OPENAI_API_KEY");

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is required when TRANSCRIPTION_ADAPTER=openai",
      );
    }

    this.apiKey = apiKey;
    this.model = configService.get<string>("ai.OPENAI_WHISPER_MODEL")!;
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    const stats = await fs.stat(input.filePath);

    if (stats.size > OPENAI_MAX_FILE_BYTES) {
      throw new Error(
        `File is ${Math.round(stats.size / 1024 / 1024)} MB; OpenAI Whisper accepts at most 25 MB. Use TRANSCRIPTION_ADAPTER=local for large recordings.`,
      );
    }

    const form = new FormData();
    form.append("model", this.model);
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "segment");

    if (input.language) {
      form.append("language", input.language);
    }

    const blob = await openAsBlob(input.filePath, { type: input.mimeType });
    form.append("file", blob, input.originalName);

    this.logger.log(`Transcribing ${input.originalName} with ${this.model}`);

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}` },
        body: form,
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `OpenAI transcription failed (${response.status}): ${body.slice(0, 500)}`,
      );
    }

    const payload = (await response.json()) as VerboseJsonResponse;
    const segments = (payload.segments ?? []).map((segment, index) => ({
      id: index,
      start: segment.start,
      end: segment.end,
      text: segment.text.trim(),
      speaker: null,
    }));

    if (segments.length === 0 && payload.text) {
      segments.push({
        id: 0,
        start: 0,
        end: payload.duration ?? 0,
        text: payload.text.trim(),
        speaker: null,
      });
    }

    return {
      segments,
      language: payload.language ?? input.language ?? null,
      durationSeconds: payload.duration ?? null,
    };
  }
}
