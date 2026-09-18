import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "~/components/ui/badge";
import { isProcessing, type MeetingStatus } from "~/api/meetings.types";
import { cn } from "~/lib/utils";

export function MeetingStatusBadge({
  status,
  progress,
  className
}: {
  status: MeetingStatus;
  progress?: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const processing = isProcessing(status);

  const Icon =
    status === "completed"
      ? CheckCircle2
      : status === "failed"
        ? AlertTriangle
        : status === "uploaded"
          ? Clock
          : Loader2;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium",
        status === "completed" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        status === "failed" && "border-destructive/40 bg-destructive/10 text-destructive",
        processing && "border-primary/30 bg-primary/10 text-primary",
        className
      )}
    >
      <Icon
        className={cn("size-3.5", processing && status !== "uploaded" && "animate-spin")}
      />
      {t(`meetings.status.${status}`)}
      {processing && typeof progress === "number" && progress > 0 && (
        <span className="tabular-nums opacity-80">{progress}%</span>
      )}
    </Badge>
  );
}
