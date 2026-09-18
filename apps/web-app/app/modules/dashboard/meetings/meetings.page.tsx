import { AudioLines, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { redirect } from "react-router";

import { isProcessing } from "~/api/meetings.types";
import { useMeetings } from "~/api/queries/useMeetings";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "~/components/ui/empty";
import { Skeleton } from "~/components/ui/skeleton";
import { authClient } from "~/modules/Auth/auth.client";
import { DashboardHeader } from "../components/DashboardHeader";
import { MeetingsTable } from "./components/MeetingsTable";
import { UploadDropzone } from "./components/UploadDropzone";
import type { Route } from "./+types/meetings.page";

const authMiddleware: Route.ClientMiddlewareFunction = async () => {
  const session = await authClient.getSession();

  if (!session.data) {
    throw redirect("/auth");
  }
};

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [authMiddleware];

export default function MeetingsPage() {
  const { t } = useTranslation();
  const { data: meetings, isLoading, isError, refetch, isFetching } = useMeetings();
  const processingCount = meetings?.filter((m) => isProcessing(m.status)).length ?? 0;

  return (
    <>
      <DashboardHeader crumbs={[{ label: t("meetings.title") }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("meetings.title")}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t("meetings.subtitle")}
          </p>
        </div>

        <UploadDropzone />

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {meetings ? t("meetings.list.count", { count: meetings.length }) : ""}
            </h2>
            {processingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs text-primary">
                <Loader2 className="size-3.5 animate-spin" />
                {t("meetings.list.processing", { count: processingCount })}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              <p className="text-sm font-medium">{t("meetings.list.loadError")}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                {t("meetings.list.retry")}
              </Button>
            </div>
          ) : meetings && meetings.length > 0 ? (
            <MeetingsTable meetings={meetings} />
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AudioLines />
                </EmptyMedia>
                <EmptyTitle>{t("meetings.list.empty.title")}</EmptyTitle>
                <EmptyDescription>
                  {t("meetings.list.empty.description")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>
      </div>
    </>
  );
}
