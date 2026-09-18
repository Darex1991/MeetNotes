import { describe, expect, it } from "vitest";
import { meetingToMarkdown } from "../meetings-export";

describe("meetingToMarkdown", () => {
  it("renders every section that has content", () => {
    const markdown = meetingToMarkdown({
      title: "Weekly sync",
      createdAt: "2026-09-18T10:00:00.000Z",
      durationSeconds: 3725,
      summary: "We reviewed the release plan.",
      keyTopics: ["release", "hiring"],
      actionItems: [
        {
          title: "Prepare changelog",
          owner: "Marta",
          dueDate: "Friday",
          priority: "high",
          sourceSegmentIds: [3],
        },
      ],
      decisions: [
        {
          title: "Ship on Monday",
          rationale: "QA is done",
          sourceSegmentIds: [4],
        },
      ],
      transcript: [
        {
          id: 0,
          start: 0,
          end: 4,
          text: "Hello everyone",
          speaker: "SPEAKER_00",
        },
        { id: 1, start: 61, end: 65, text: "Hi", speaker: "SPEAKER_01" },
      ],
      speakers: { SPEAKER_00: "Ola", SPEAKER_01: "Marta" },
    });

    expect(markdown).toContain("# Weekly sync");
    expect(markdown).toContain("- Duration: 1:02:05");
    expect(markdown).toContain("- Participants: Ola, Marta");
    expect(markdown).toContain("## Summary");
    expect(markdown).toContain("- **Ship on Monday** — QA is done");
    expect(markdown).toContain(
      "- [ ] Prepare changelog (@Marta, due Friday, high)",
    );
    expect(markdown).toContain("`00:00` **Ola:** Hello everyone");
    expect(markdown).toContain("`01:01` **Marta:** Hi");
  });

  it("omits empty sections", () => {
    const markdown = meetingToMarkdown({
      title: "Empty",
      createdAt: "2026-09-18T10:00:00.000Z",
      durationSeconds: null,
      summary: null,
      keyTopics: [],
      actionItems: [],
      decisions: [],
      transcript: null,
      speakers: {},
    });

    expect(markdown).toBe("# Empty\n\n- Date: 2026-09-18\n");
  });
});
