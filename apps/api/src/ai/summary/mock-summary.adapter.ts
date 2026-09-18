import { Injectable } from "@nestjs/common";
import { SummaryInput, SummaryResult } from "../ai.types";
import { SummaryProvider } from "./summary.provider";

/**
 * Deterministic summary built from the transcript itself; lets the full pipeline run
 * with no API key. Picks sentences containing commitment/decision cues.
 */
@Injectable()
export class MockSummaryAdapter extends SummaryProvider {
  readonly name = "mock";

  async summarize(input: SummaryInput): Promise<SummaryResult> {
    const { segments } = input;
    const actionCues =
      /\b(i'?ll|i will|can you|please|by (monday|tuesday|wednesday|thursday|friday|next week))\b/i;
    const decisionCues =
      /\b(decided|agreed|let'?s make that|we ship|official|correct,)\b/i;

    const actionItems = segments
      .filter((s) => actionCues.test(s.text))
      .slice(0, 6)
      .map((s) => ({
        title: s.text.replace(/\s+/g, " ").trim(),
        owner: s.speaker ? (input.speakers[s.speaker] ?? s.speaker) : null,
        dueDate: extractDue(s.text),
        priority: /\bby\b/i.test(s.text)
          ? ("high" as const)
          : ("medium" as const),
        sourceSegmentIds: [s.id],
      }));

    const decisions = segments
      .filter((s) => decisionCues.test(s.text))
      .slice(0, 5)
      .map((s) => ({
        title: s.text.replace(/\s+/g, " ").trim(),
        rationale: null,
        sourceSegmentIds: [s.id],
      }));

    const firstLine = segments[0]?.text ?? "";
    const participants = Object.values(input.speakers);
    const summary = [
      `**${input.title}** — ${participants.length} participant(s), ${segments.length} transcript segments.`,
      firstLine ? `The meeting opened with: "${firstLine}"` : "",
      `${actionItems.length} action item(s) and ${decisions.length} decision(s) were detected. This summary was produced by the mock adapter; set SUMMARY_ADAPTER=claude for real notes.`,
    ]
      .filter(Boolean)
      .join("\n\n");

    return {
      summary,
      keyTopics: topWords(segments.map((s) => s.text).join(" ")),
      actionItems,
      decisions,
    };
  }
}

function extractDue(text: string): string | null {
  const match = text.match(
    /\bby (monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|tomorrow)\b/i,
  );
  return match ? match[1] : null;
}

const STOP_WORDS = new Set(
  "the a an and or but so to of in on for with that this it is are was were be we i you they he she our your can let's lets okay yes no not what about still then last week also".split(
    " ",
  ),
);

function topWords(text: string, limit = 5): string[] {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-ząćęłńóśźż']+/g) ?? []) {
    if (raw.length < 4 || STOP_WORDS.has(raw)) continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}
