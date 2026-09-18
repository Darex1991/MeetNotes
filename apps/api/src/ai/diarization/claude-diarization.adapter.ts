import { Injectable } from "@nestjs/common";
import { Type } from "@sinclair/typebox";
import {
  DiarizationInput,
  DiarizationResult,
  renderTranscript,
} from "../ai.types";
import { ClaudeClient } from "../claude/claude.client";
import { DiarizationProvider, speakerId } from "./diarization.provider";
import { buildSpeakerMap } from "./heuristic-diarization.adapter";

const diarizationOutputSchema = Type.Object(
  {
    turns: Type.Array(
      Type.Object(
        {
          segmentId: Type.Integer(),
          speaker: Type.Integer({ minimum: 0 }),
        },
        { additionalProperties: false },
      ),
    ),
    speakerNames: Type.Array(
      Type.Object(
        {
          speaker: Type.Integer({ minimum: 0 }),
          name: Type.String(),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

const SYSTEM_PROMPT = `You segment meeting transcripts into speaker turns.
You receive numbered transcript segments without speaker labels. Infer who is speaking from
conversational cues: questions and answers, names used to address people, self-references,
topic ownership and consistent vocabulary. Assign a zero-based speaker index to every segment.
Keep the number of speakers as small as the evidence supports. If a participant's name is
clearly stated in the transcript (for example "Thanks, Marta" followed by Marta answering),
report it in speakerNames; otherwise leave that speaker out of speakerNames.`;

/**
 * Text-only diarization performed by Claude. Cheaper to set up than an acoustic model and
 * surprisingly accurate for structured meetings, but it cannot separate two people who never
 * address each other; use `pyannote` when audio-level accuracy matters.
 */
@Injectable()
export class ClaudeDiarizationAdapter extends DiarizationProvider {
  readonly name = "claude";

  constructor(private readonly claude: ClaudeClient) {
    super();
  }

  async diarize(input: DiarizationInput): Promise<DiarizationResult> {
    if (input.segments.length === 0) {
      return { segments: [], speakers: {} };
    }

    const result = await this.claude.generateStructured({
      system: SYSTEM_PROMPT,
      prompt: `Transcript language: ${input.language ?? "unknown"}.\n\nSegments:\n${renderTranscript(input.segments, {})}\n\nReturn a speaker index for every segment id listed above.`,
      schema: diarizationOutputSchema,
      effort: "medium",
    });

    const bySegment = new Map(
      result.turns.map((t) => [t.segmentId, t.speaker]),
    );
    let lastSpeaker = 0;
    const segments = input.segments.map((segment) => {
      const index = bySegment.get(segment.id) ?? lastSpeaker;
      lastSpeaker = index;

      return { ...segment, speaker: speakerId(index) };
    });

    const speakers = buildSpeakerMap(segments);
    for (const named of result.speakerNames) {
      const id = speakerId(named.speaker);
      if (speakers[id] && named.name.trim()) {
        speakers[id] = named.name.trim();
      }
    }

    return { segments, speakers };
  }
}
