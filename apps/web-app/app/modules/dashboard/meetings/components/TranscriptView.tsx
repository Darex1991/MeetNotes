import { Pencil } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TranscriptSegment } from "~/api/meetings.types";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { formatDuration, initials, speakerColor } from "../meetings.utils";
import { SpeakerRenameDialog } from "./SpeakerRenameDialog";

type Turn = { speaker: string | null; segments: TranscriptSegment[] };

export function TranscriptView({
  meetingId,
  segments,
  speakers,
  highlightedSegmentId,
  onSeek
}: {
  meetingId: string;
  segments: TranscriptSegment[];
  speakers: Record<string, string>;
  highlightedSegmentId: number | null;
  onSeek?: (seconds: number) => void;
}) {
  const { t } = useTranslation();
  const [renaming, setRenaming] = useState<string | null>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);

  const speakerIds = useMemo(() => Object.keys(speakers).sort(), [speakers]);

  const turns = useMemo(() => {
    const result: Turn[] = [];
    for (const segment of segments) {
      const last = result[result.length - 1];
      if (last && last.speaker === segment.speaker) last.segments.push(segment);
      else result.push({ speaker: segment.speaker, segments: [segment] });
    }
    return result;
  }, [segments]);

  useEffect(() => {
    highlightedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedSegmentId]);

  if (!segments.length) {
    return (
      <p className="text-sm text-muted-foreground">{t("meetings.transcript.empty")}</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {speakerIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setRenaming(id)}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition hover:opacity-80",
              speakerColor(id, speakerIds)
            )}
          >
            <span className="flex size-4 items-center justify-center rounded-full bg-background/70 text-[10px]">
              {initials(speakers[id] ?? id)}
            </span>
            {speakers[id] ?? id}
            <Pencil className="size-3 opacity-0 transition group-hover:opacity-100" />
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {t("meetings.transcript.segments", { count: segments.length })}
        </span>
      </div>

      <div className="space-y-5">
        {turns.map((turn, index) => {
          const name = turn.speaker ? (speakers[turn.speaker] ?? turn.speaker) : "—";
          const color = turn.speaker
            ? speakerColor(turn.speaker, speakerIds)
            : "bg-muted text-muted-foreground";
          return (
            <div key={index} className="flex gap-3">
              <div
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  color
                )}
                title={name}
              >
                {initials(name)}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-baseline gap-2">
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm font-semibold text-foreground"
                    onClick={() => turn.speaker && setRenaming(turn.speaker)}
                  >
                    {name}
                  </Button>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground tabular-nums hover:underline"
                    onClick={() => onSeek?.(turn.segments[0].start)}
                  >
                    {formatDuration(turn.segments[0].start)}
                  </button>
                </div>
                <p className="text-sm leading-relaxed">
                  {turn.segments.map((segment) => (
                    <span
                      key={segment.id}
                      ref={
                        segment.id === highlightedSegmentId ? highlightedRef : undefined
                      }
                      role="button"
                      tabIndex={0}
                      title={formatDuration(segment.start)}
                      onClick={() => onSeek?.(segment.start)}
                      onKeyDown={(event) =>
                        event.key === "Enter" && onSeek?.(segment.start)
                      }
                      className={cn(
                        "cursor-pointer rounded px-0.5 transition-colors hover:bg-muted",
                        segment.id === highlightedSegmentId &&
                          "bg-amber-300/40 dark:bg-amber-400/25"
                      )}
                    >
                      {segment.text}{" "}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <SpeakerRenameDialog
        meetingId={meetingId}
        speaker={renaming}
        currentName={renaming ? (speakers[renaming] ?? renaming) : ""}
        onClose={() => setRenaming(null)}
      />
    </div>
  );
}
