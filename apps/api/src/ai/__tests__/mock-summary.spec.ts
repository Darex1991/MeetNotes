import { describe, expect, it } from "vitest";
import { MockSummaryAdapter } from "../summary/mock-summary.adapter";
import { MockTranscriptionAdapter } from "../transcription/mock-transcription.adapter";
import {
  assignSpeakersHeuristically,
  buildSpeakerMap,
} from "../diarization/heuristic-diarization.adapter";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

describe("mock pipeline adapters", () => {
  it("produce a coherent transcript, speakers, action items and decisions", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "mock-audio-"));
    const filePath = path.join(dir, "standup.mp3");
    await fs.writeFile(filePath, Buffer.alloc(16));

    try {
      const transcription = await new MockTranscriptionAdapter(0).transcribe({
        filePath,
        mimeType: "audio/mpeg",
        originalName: "standup.mp3",
      });
      expect(transcription.segments.length).toBeGreaterThan(5);
      expect(transcription.durationSeconds).toBeGreaterThan(0);

      const segments = assignSpeakersHeuristically(transcription.segments);
      const speakers = buildSpeakerMap(segments);

      const summary = await new MockSummaryAdapter().summarize({
        title: "Sprint review",
        language: "en",
        segments,
        speakers,
      });

      expect(summary.summary).toContain("Sprint review");
      expect(summary.actionItems.length).toBeGreaterThan(0);
      expect(summary.decisions.length).toBeGreaterThan(0);
      expect(summary.keyTopics.length).toBeGreaterThan(0);
      for (const item of summary.actionItems) {
        expect(item.sourceSegmentIds.length).toBe(1);
      }
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
