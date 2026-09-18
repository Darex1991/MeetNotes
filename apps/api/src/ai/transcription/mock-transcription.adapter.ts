import { Injectable } from "@nestjs/common";
import { promises as fs } from "fs";
import { TranscriptionInput, TranscriptionResult } from "../ai.types";
import { TranscriptionProvider } from "./transcription.provider";

const SCRIPT = [
  "Okay, I think everyone is here, so let's get started with the sprint review.",
  "Sure. Last week we finished the upload flow and the background worker for transcription.",
  "Nice. What about the diarization step? Is that still blocked on the model download?",
  "It was, but I switched to a pause-based heuristic for the demo. We can plug pyannote in later.",
  "Good call. Let's make that decision official: we ship with the heuristic and revisit in Q4.",
  "Agreed. I'll write it down. Anything else on the pipeline?",
  "Yes, the summary prompt still hallucinates owners when nobody is named. I'll fix that by Friday.",
  "Please also add retries to the queue. Marta, can you take the frontend polling piece?",
  "Yes, I can have the status timeline done by Wednesday.",
  "Great. Then the last thing is the export. We decided on Markdown, not PDF, right?",
  "Correct, Markdown only for the first release.",
  "Perfect, that's all. Thanks everyone.",
];

/**
 * Deterministic fake transcript so the whole pipeline can run locally and in CI
 * without any external model or API key. Simulates a bit of latency per segment.
 */
@Injectable()
export class MockTranscriptionAdapter extends TranscriptionProvider {
  readonly name = "mock";

  constructor(private readonly delayMs = 150) {
    super();
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    await fs.access(input.filePath);

    const segments = SCRIPT.map((text, index) => ({
      id: index,
      start: index * 6,
      end: index * 6 + 5.2,
      text,
      speaker: null,
    }));

    await new Promise((resolve) =>
      setTimeout(resolve, this.delayMs * Math.min(segments.length, 10)),
    );

    return {
      segments,
      language: input.language ?? "en",
      durationSeconds: segments[segments.length - 1]?.end ?? 0,
    };
  }
}
