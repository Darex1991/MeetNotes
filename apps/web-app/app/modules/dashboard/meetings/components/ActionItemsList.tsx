import { CalendarClock, Crosshair, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ActionItem } from "~/api/meetings.types";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const PRIORITY_CLASS: Record<ActionItem["priority"], string> = {
  high: "border-destructive/40 bg-destructive/10 text-destructive",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  low: "border-border bg-muted text-muted-foreground"
};

export function ActionItemsList({
  items,
  onShowSource
}: {
  items: ActionItem[];
  onShowSource?: (segmentId: number) => void;
}) {
  const { t } = useTranslation();

  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground">{t("meetings.actionItems.empty")}</p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border">
      {items.map((item, index) => (
        <li
          key={`${item.title}-${index}`}
          className="flex flex-wrap items-start gap-3 px-4 py-3"
        >
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-border text-xs text-muted-foreground">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-sm font-medium">{item.title}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <UserRound className="size-3.5" />
                {item.owner ?? t("meetings.actionItems.unassigned")}
              </span>
              {item.dueDate && (
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="size-3.5" />
                  {t("meetings.actionItems.due")}: {item.dueDate}
                </span>
              )}
              <Badge
                variant="outline"
                className={cn("h-5 px-1.5 text-[11px]", PRIORITY_CLASS[item.priority])}
              >
                {t(`meetings.actionItems.priority.${item.priority}`)}
              </Badge>
            </div>
          </div>
          {onShowSource && item.sourceSegmentIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => onShowSource(item.sourceSegmentIds[0])}
            >
              <Crosshair className="size-3.5" />
              {t("meetings.actionItems.source")}
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
