import {
  ActionItem,
  Decision,
  SpeakerMap,
  TranscriptSegment,
  formatTimestamp,
  speakerLabel,
} from "src/ai/ai.types";

export type ExportableMeeting = {
  title: string;
  createdAt: string;
  durationSeconds: number | null;
  summary: string | null;
  keyTopics: string[];
  actionItems: ActionItem[];
  decisions: Decision[];
  transcript: TranscriptSegment[] | null;
  speakers: SpeakerMap;
};

export function meetingToMarkdown(meeting: ExportableMeeting): string {
  const lines: string[] = [];
  const participants = Object.values(meeting.speakers);

  lines.push(`# ${meeting.title}`, "");
  lines.push(`- Date: ${meeting.createdAt.slice(0, 10)}`);
  if (meeting.durationSeconds != null) {
    lines.push(`- Duration: ${formatTimestamp(meeting.durationSeconds)}`);
  }
  if (participants.length) {
    lines.push(`- Participants: ${participants.join(", ")}`);
  }
  lines.push("");

  if (meeting.summary) {
    lines.push("## Summary", "", meeting.summary.trim(), "");
  }

  if (meeting.keyTopics.length) {
    lines.push("## Key topics", "");
    for (const topic of meeting.keyTopics) lines.push(`- ${topic}`);
    lines.push("");
  }

  if (meeting.decisions.length) {
    lines.push("## Decisions", "");
    for (const decision of meeting.decisions) {
      lines.push(
        `- **${decision.title}**${decision.rationale ? ` — ${decision.rationale}` : ""}`,
      );
    }
    lines.push("");
  }

  if (meeting.actionItems.length) {
    lines.push("## Action items", "");
    for (const item of meeting.actionItems) {
      const meta = [
        item.owner ? `@${item.owner}` : null,
        item.dueDate ? `due ${item.dueDate}` : null,
        item.priority !== "medium" ? item.priority : null,
      ]
        .filter(Boolean)
        .join(", ");
      lines.push(`- [ ] ${item.title}${meta ? ` (${meta})` : ""}`);
    }
    lines.push("");
  }

  if (meeting.transcript?.length) {
    lines.push("## Transcript", "");
    for (const segment of meeting.transcript) {
      const speaker = segment.speaker
        ? `**${speakerLabel(segment.speaker, meeting.speakers)}:** `
        : "";
      lines.push(
        `\`${formatTimestamp(segment.start)}\` ${speaker}${segment.text.trim()}`,
      );
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}
