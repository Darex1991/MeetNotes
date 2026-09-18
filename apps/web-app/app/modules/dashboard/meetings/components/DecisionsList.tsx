import { Crosshair, Gavel } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Decision } from "~/api/meetings.types";
import { Button } from "~/components/ui/button";

export function DecisionsList({
  decisions,
  onShowSource
}: {
  decisions: Decision[];
  onShowSource?: (segmentId: number) => void;
}) {
  const { t } = useTranslation();

  if (!decisions.length) {
    return (
      <p className="text-sm text-muted-foreground">{t("meetings.decisions.empty")}</p>
    );
  }

  return (
    <ul className="grid gap-3">
      {decisions.map((decision, index) => (
        <li
          key={`${decision.title}-${index}`}
          className="flex flex-wrap items-start gap-3 rounded-xl border bg-card px-4 py-3"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Gavel className="size-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium">{decision.title}</p>
            {decision.rationale && (
              <p className="text-sm text-muted-foreground">{decision.rationale}</p>
            )}
          </div>
          {onShowSource && decision.sourceSegmentIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => onShowSource(decision.sourceSegmentIds[0])}
            >
              <Crosshair className="size-3.5" />
              {t("meetings.decisions.source")}
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
