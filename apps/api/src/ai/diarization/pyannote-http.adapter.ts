import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { openAsBlob } from "fs";
import {
  DiarizationInput,
  DiarizationResult,
  TranscriptSegment,
} from "../ai.types";
import { DiarizationProvider } from "./diarization.provider";
import { buildSpeakerMap } from "./heuristic-diarization.adapter";

type DiarizationServiceResponse = {
  segments: Array<{ start: number; end: number; speaker: string }>;
};

/**
 * Acoustic diarization through a self-hosted HTTP service wrapping pyannote.audio
 * (or any compatible model). Contract:
 *   POST {DIARIZATION_SERVICE_URL}  multipart/form-data  file=<audio>
 *   200 -> { "segments": [{ "start": 0.0, "end": 4.2, "speaker": "SPEAKER_00" }, ...] }
 * Speaker turns are then aligned to Whisper segments by maximum time overlap.
 */
@Injectable()
export class PyannoteHttpDiarizationAdapter extends DiarizationProvider {
  readonly name = "pyannote";
  private readonly logger = new Logger(PyannoteHttpDiarizationAdapter.name);
  private readonly serviceUrl: string;

  constructor(configService: ConfigService) {
    super();
    const url = configService.get<string>("ai.DIARIZATION_SERVICE_URL");

    if (!url) {
      throw new Error(
        "DIARIZATION_SERVICE_URL is required when DIARIZATION_ADAPTER=pyannote",
      );
    }

    this.serviceUrl = url;
  }

  async diarize(input: DiarizationInput): Promise<DiarizationResult> {
    const form = new FormData();
    form.append(
      "file",
      await openAsBlob(input.filePath, { type: input.mimeType }),
      "recording",
    );

    this.logger.log(`Requesting diarization from ${this.serviceUrl}`);
    const response = await fetch(this.serviceUrl, {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
      throw new Error(
        `Diarization service failed (${response.status}): ${(await response.text()).slice(0, 500)}`,
      );
    }

    const payload = (await response.json()) as DiarizationServiceResponse;
    const segments = alignSpeakerTurns(input.segments, payload.segments);

    return { segments, speakers: buildSpeakerMap(segments) };
  }
}

export function alignSpeakerTurns(
  segments: TranscriptSegment[],
  turns: DiarizationServiceResponse["segments"],
): TranscriptSegment[] {
  let fallback: string | null = null;

  return segments.map((segment) => {
    let best: { speaker: string; overlap: number } | null = null;

    for (const turn of turns) {
      const overlap =
        Math.min(segment.end, turn.end) - Math.max(segment.start, turn.start);

      if (overlap > 0 && (!best || overlap > best.overlap)) {
        best = { speaker: turn.speaker, overlap };
      }
    }

    const speaker = best?.speaker ?? fallback ?? turns[0]?.speaker ?? null;
    fallback = speaker;

    return { ...segment, speaker };
  });
}
