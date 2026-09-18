import { AlertTriangle, Check, Loader2, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Meeting } from "~/api/meetings.types";
import { useRetryMeeting } from "~/api/mutations/useRetryMeeting";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";
import { STAGE_ORDER, STATUS_TO_STAGE } from "../meetings.utils";

type StepState = "done" | "active" | "failed" | "pending";

export function ProcessingTimeline({ meeting }: { meeting: Meeting }) {
  const { t } = useTranslation();
  const retry = useRetryMeeting();

  const activeStage = STATUS_TO_STAGE[meeting.status];
  const failedStage =
    meeting.status === "failed" ? (meeting.failedStage ?? "transcribe") : null;
  const reference = failedStage ?? activeStage;
  const referenceIndex = reference ? STAGE_ORDER.indexOf(reference) : -1;

  const steps: { key: string; label: string; state: StepState }[] = [
    { key: "upload", label: t("meetings.stages.upload"), state: "done" },
    ...STAGE_ORDER.map((stage, index) => {
      let state: StepState = "pending";
      if (meeting.status === "completed") state = "done";
      else if (failedStage) {
        state =
          index < referenceIndex
            ? "done"
            : index === referenceIndex
              ? "failed"
              : "pending";
      } else if (activeStage) {
        state =
          index < referenceIndex
            ? "done"
            : index === referenceIndex
              ? "active"
              : "pending";
      }
      return { key: stage, label: t(`meetings.stages.${stage}`), state };
    })
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("meetings.timeline.title")}</CardTitle>
        <CardDescription>{t("meetings.timeline.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="grid gap-3 sm:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.key} className="flex items-start gap-3 sm:flex-col sm:gap-2">
              <div className="flex items-center gap-2 sm:w-full">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    step.state === "done" &&
                      "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                    step.state === "active" &&
                      "border-primary bg-primary text-primary-foreground",
                    step.state === "failed" &&
                      "border-destructive bg-destructive/15 text-destructive",
                    step.state === "pending" && "border-border text-muted-foreground"
                  )}
                >
                  {step.state === "done" ? (
                    <Check className="size-3.5" />
                  ) : step.state === "active" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : step.state === "failed" ? (
                    <AlertTriangle className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "hidden h-px flex-1 sm:block",
                    index === steps.length - 1 && "invisible",
                    step.state === "done" ? "bg-emerald-500/40" : "bg-border"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-sm",
                  step.state === "pending" ? "text-muted-foreground" : "font-medium"
                )}
              >
                {step.label}
              </span>
            </li>
          ))}
        </ol>

        {meeting.status !== "failed" && meeting.status !== "completed" && (
          <div className="space-y-1.5">
            <Progress value={meeting.progress} />
            <p className="text-xs text-muted-foreground tabular-nums">
              {t(`meetings.status.${meeting.status}`)} · {meeting.progress}%
            </p>
          </div>
        )}

        {meeting.status === "failed" && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>
              {t("meetings.timeline.failedAt", {
                stage: t(`meetings.stages.${meeting.failedStage ?? "transcribe"}`)
              })}
            </AlertTitle>
            <AlertDescription className="gap-3">
              {meeting.errorMessage && (
                <code className="block max-h-32 overflow-auto rounded bg-destructive/10 p-2 text-xs whitespace-pre-wrap">
                  {meeting.errorMessage}
                </code>
              )}
              <Button
                size="sm"
                variant="outline"
                className="w-fit"
                disabled={retry.isPending}
                onClick={() => retry.mutate(meeting.id)}
              >
                <RotateCcw className={cn("size-4", retry.isPending && "animate-spin")} />
                {retry.isPending
                  ? t("meetings.timeline.retrying")
                  : t("meetings.timeline.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
