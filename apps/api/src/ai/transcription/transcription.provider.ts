import { TranscriptionInput, TranscriptionResult } from "../ai.types";

export abstract class TranscriptionProvider {
  abstract readonly name: string;
  abstract transcribe(input: TranscriptionInput): Promise<TranscriptionResult>;
}
