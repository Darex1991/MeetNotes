export type TranscriptSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker: string | null;
};

export type SpeakerMap = Record<string, string>;

export type ActionItemPriority = "low" | "medium" | "high";

export type ActionItem = {
  title: string;
  owner: string | null;
  dueDate: string | null;
  priority: ActionItemPriority;
  sourceSegmentIds: number[];
};

export type Decision = {
  title: string;
  rationale: string | null;
  sourceSegmentIds: number[];
};

export type TranscriptionInput = {
  filePath: string;
  mimeType: string;
  originalName: string;
  language?: string | null;
};

export type TranscriptionResult = {
  segments: TranscriptSegment[];
  language: string | null;
  durationSeconds: number | null;
};

export type DiarizationInput = {
  filePath: string;
  mimeType: string;
  segments: TranscriptSegment[];
  language: string | null;
};

export type DiarizationResult = {
  segments: TranscriptSegment[];
  speakers: SpeakerMap;
};

export type SummaryInput = {
  title: string;
  language: string | null;
  segments: TranscriptSegment[];
  speakers: SpeakerMap;
};

export type SummaryResult = {
  summary: string;
  keyTopics: string[];
  actionItems: ActionItem[];
  decisions: Decision[];
};

export function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");

  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function speakerLabel(id: string, speakers: SpeakerMap): string {
  return speakers[id] ?? id;
}

/**
 * Renders a transcript as plain text with timestamps and speaker names.
 * Used as LLM input and for markdown export.
 */
export function renderTranscript(
  segments: TranscriptSegment[],
  speakers: SpeakerMap,
): string {
  return segments
    .map((segment) => {
      const speaker = segment.speaker
        ? `${speakerLabel(segment.speaker, speakers)}: `
        : "";

      return `[#${segment.id} ${formatTimestamp(segment.start)}] ${speaker}${segment.text.trim()}`;
    })
    .join("\n");
}
