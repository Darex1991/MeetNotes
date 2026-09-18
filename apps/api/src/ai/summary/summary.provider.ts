import { SummaryInput, SummaryResult } from "../ai.types";

export abstract class SummaryProvider {
  abstract readonly name: string;
  abstract summarize(input: SummaryInput): Promise<SummaryResult>;
}
