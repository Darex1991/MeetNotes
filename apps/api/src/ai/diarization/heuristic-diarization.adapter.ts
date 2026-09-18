import { Injectable } from "@nestjs/common";
import {
  DiarizationInput,
  DiarizationResult,
  SpeakerMap,
  TranscriptSegment,
} from "../ai.types";
import {
  DiarizationProvider,
  defaultSpeakerName,
  speakerId,
} from "./diarization.provider";

export type HeuristicOptions = {
  /** Silence between two segments (seconds) that suggests a speaker change. */
  pauseThreshold: number;
  /** Maximum number of distinct speakers the heuristic will invent. */
  maxSpeakers: number;
};

const DEFAULT_OPTIONS: HeuristicOptions = {
  pauseThreshold: 1.0,
  maxSpeakers: 2,
};

/**
 * Zero-dependency fallback: alternates speakers on long pauses and on question/answer
 * boundaries. Good enough for demos and tests; swap for `claude` or `pyannote` for
 * real recordings.
 */
export function assignSpeakersHeuristically(
  segments: TranscriptSegment[],
  options: Partial<HeuristicOptions> = {},
): TranscriptSegment[] {
  const { pauseThreshold, maxSpeakers } = { ...DEFAULT_OPTIONS, ...options };
  let current = 0;
  let previous: TranscriptSegment | null = null;

  return segments.map((segment) => {
    if (previous) {
      const gap = segment.start - previous.end;
      const previousWasQuestion = previous.text.trim().endsWith("?");

      if (gap > pauseThreshold || previousWasQuestion) {
        current = (current + 1) % Math.max(1, maxSpeakers);
      }
    }

    previous = segment;

    return { ...segment, speaker: speakerId(current) };
  });
}

export function buildSpeakerMap(segments: TranscriptSegment[]): SpeakerMap {
  const ids = [
    ...new Set(segments.map((s) => s.speaker).filter(Boolean)),
  ] as string[];

  return Object.fromEntries(
    ids.sort().map((id, index) => [id, defaultSpeakerName(index)]),
  );
}

@Injectable()
export class HeuristicDiarizationAdapter extends DiarizationProvider {
  readonly name = "heuristic";

  constructor(private readonly options: Partial<HeuristicOptions> = {}) {
    super();
  }

  async diarize(input: DiarizationInput): Promise<DiarizationResult> {
    const segments = assignSpeakersHeuristically(input.segments, this.options);

    return { segments, speakers: buildSpeakerMap(segments) };
  }
}
