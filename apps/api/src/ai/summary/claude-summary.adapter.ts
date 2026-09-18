import { Injectable } from "@nestjs/common";
import { Type } from "@sinclair/typebox";
import { SummaryInput, SummaryResult, renderTranscript } from "../ai.types";
import { ClaudeClient } from "../claude/claude.client";
import { SummaryProvider } from "./summary.provider";

export const summaryOutputSchema = Type.Object(
  {
    summary: Type.String({
      description:
        "Concise meeting summary in Markdown (3-6 short paragraphs or bullet groups), written in the transcript language.",
    }),
    keyTopics: Type.Array(Type.String(), { maxItems: 10 }),
    actionItems: Type.Array(
      Type.Object(
        {
          title: Type.String(),
          owner: Type.Union([Type.String(), Type.Null()]),
          dueDate: Type.Union([Type.String(), Type.Null()], {
            description:
              "ISO date if a date was stated, otherwise the phrase used (e.g. 'Friday'), or null.",
          }),
          priority: Type.Union([
            Type.Literal("low"),
            Type.Literal("medium"),
            Type.Literal("high"),
          ]),
          sourceSegmentIds: Type.Array(Type.Integer()),
        },
        { additionalProperties: false },
      ),
    ),
    decisions: Type.Array(
      Type.Object(
        {
          title: Type.String(),
          rationale: Type.Union([Type.String(), Type.Null()]),
          sourceSegmentIds: Type.Array(Type.Integer()),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

const SYSTEM_PROMPT = `You write meeting notes for busy teams.
Given a diarized transcript, produce:
- summary: what the meeting was about and what happened, in the same language as the transcript.
- keyTopics: short noun phrases.
- actionItems: concrete follow-ups that someone committed to or was asked to do. Only set owner
  when the transcript names or clearly identifies the person; otherwise use null. Never invent
  owners or dates. Use priority "high" only for items with explicit urgency or a stated deadline.
- decisions: things the group agreed on or explicitly settled, with the reasoning if it was given.
Every action item and decision must reference the segment ids (the #N markers) it came from.
Be faithful to the transcript; if it is unclear or off-topic, say so in the summary rather than guessing.`;

@Injectable()
export class ClaudeSummaryAdapter extends SummaryProvider {
  readonly name = "claude";

  constructor(private readonly claude: ClaudeClient) {
    super();
  }

  async summarize(input: SummaryInput): Promise<SummaryResult> {
    const transcript = renderTranscript(input.segments, input.speakers);

    return this.claude.generateStructured({
      system: SYSTEM_PROMPT,
      prompt: `Meeting title: ${input.title}\nTranscript language: ${input.language ?? "unknown"}\nParticipants: ${Object.values(input.speakers).join(", ") || "unknown"}\n\nTranscript:\n${transcript}`,
      schema: summaryOutputSchema,
      maxTokens: 16000,
    });
  }
}
