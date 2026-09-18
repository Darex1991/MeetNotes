import { describe, expect, it } from "vitest";
import {
  assignSpeakersHeuristically,
  buildSpeakerMap,
} from "../diarization/heuristic-diarization.adapter";
import { alignSpeakerTurns } from "../diarization/pyannote-http.adapter";
import { TranscriptSegment } from "../ai.types";

const segment = (
  id: number,
  start: number,
  end: number,
  text: string,
): TranscriptSegment => ({ id, start, end, text, speaker: null });

describe("assignSpeakersHeuristically", () => {
  it("keeps the same speaker across a tight, continuous run", () => {
    const result = assignSpeakersHeuristically([
      segment(0, 0, 2, "Let's start."),
      segment(1, 2.1, 4, "First topic is the roadmap."),
      segment(2, 4.2, 6, "We are on track."),
    ]);

    expect(result.map((s) => s.speaker)).toEqual([
      "SPEAKER_00",
      "SPEAKER_00",
      "SPEAKER_00",
    ]);
  });

  it("switches speaker after a long pause and after a question", () => {
    const result = assignSpeakersHeuristically([
      segment(0, 0, 2, "Is the build green?"),
      segment(1, 2.1, 4, "Yes, since this morning."),
      segment(2, 8, 10, "Great, moving on."),
    ]);

    expect(result.map((s) => s.speaker)).toEqual([
      "SPEAKER_00",
      "SPEAKER_01",
      "SPEAKER_00",
    ]);
  });

  it("never exceeds maxSpeakers", () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      segment(i, i * 5, i * 5 + 1, `Question number ${i}?`),
    );
    const result = assignSpeakersHeuristically(many, { maxSpeakers: 3 });
    const distinct = new Set(result.map((s) => s.speaker));

    expect(distinct.size).toBeLessThanOrEqual(3);
  });
});

describe("buildSpeakerMap", () => {
  it("creates readable default names in speaker order", () => {
    const map = buildSpeakerMap([
      { ...segment(0, 0, 1, "a"), speaker: "SPEAKER_01" },
      { ...segment(1, 1, 2, "b"), speaker: "SPEAKER_00" },
      { ...segment(2, 2, 3, "c"), speaker: null },
    ]);

    expect(map).toEqual({ SPEAKER_00: "Speaker 1", SPEAKER_01: "Speaker 2" });
  });
});

describe("alignSpeakerTurns", () => {
  it("assigns each segment the speaker with the largest time overlap", () => {
    const result = alignSpeakerTurns(
      [
        segment(0, 0, 4, "hello"),
        segment(1, 4, 8, "hi there"),
        segment(2, 20, 22, "late"),
      ],
      [
        { start: 0, end: 3.5, speaker: "A" },
        { start: 3.5, end: 9, speaker: "B" },
      ],
    );

    expect(result.map((s) => s.speaker)).toEqual(["A", "B", "B"]);
  });
});
