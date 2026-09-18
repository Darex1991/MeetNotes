import { DiarizationInput, DiarizationResult } from "../ai.types";

export abstract class DiarizationProvider {
  abstract readonly name: string;
  abstract diarize(input: DiarizationInput): Promise<DiarizationResult>;
}

export function defaultSpeakerName(index: number): string {
  return `Speaker ${index + 1}`;
}

export function speakerId(index: number): string {
  return `SPEAKER_${String(index).padStart(2, "0")}`;
}
