import {
  ArrowLeft,
  Clock,
  Download,
  FileAudio2,
  Languages,
  Pencil,
  Trash2,
  Users
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, redirect, useNavigate, useParams } from "react-router";

import { isProcessing } from "~/api/meetings.types";
import { useDeleteMeeting } from "~/api/mutations/useDeleteMeeting";
import { useExportMeeting } from "~/api/mutations/useExportMeeting";
import { useMeeting } from "~/api/queries/useMeeting";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { authClient } from "~/modules/Auth/auth.client";
import { DashboardHeader } from "../components/DashboardHeader";
import { ActionItemsList } from "./components/ActionItemsList";
import { DecisionsList } from "./components/DecisionsList";
import { MediaPlayer } from "./components/MediaPlayer";
import { MeetingStatusBadge } from "./components/MeetingStatusBadge";
import { ProcessingTimeline } from "./components/ProcessingTimeline";
import { RenameMeetingDialog } from "./components/RenameMeetingDialog";
import { SimpleMarkdown } from "./components/SimpleMarkdown";
import { TranscriptView } from "./components/TranscriptView";
import { formatBytes, formatDate, formatDuration } from "./meetings.utils";
import type { Route } from "./+types/meeting-details.page";

const authMiddleware: Route.ClientMiddlewareFunction = async () => {
  const session = await authClient.getSession();

  if (!session.data) {
    throw redirect("/auth");
  }
};

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [authMiddleware];

type TabKey = "summary" | "actionItems" | "decisions" | "transcript";

export default function MeetingDetailsPage() {
  const { id = "" } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: meeting, isLoading, isError, error } = useMeeting(id);
  const remove = useDeleteMeeting();
  const exportMarkdown = useExportMeeting();
  const [tab, setTab] = useState<TabKey>("summary");
  const [renaming, setRenaming] = useState(false);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const mediaRef = useRef<HTMLMediaElement>(null);

  const seek = useCallback((seconds: number) => {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = seconds;
    void media.play().catch(() => undefined);
  }, []);

  const showSource = useCallback(
    (segmentId: number) => {
      setTab("transcript");
      setHighlighted(segmentId);
      const segment = meeting?.transcript?.find((s) => s.id === segmentId);
      if (segment) seek(segment.start);
    },
    [meeting?.transcript, seek]
  );

  const crumbs = [
    { label: t("meetings.title"), to: "/dashboard" },
    { label: meeting?.title ?? "…" }
  ];

  if (isLoading) {
    return (
      <>
        <DashboardHeader crumbs={crumbs} />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  if (isError || !meeting) {
    const notFound =
      (error as { response?: { status?: number } } | null)?.response?.status === 404;
    return (
      <>
        <DashboardHeader crumbs={crumbs} />
        <div className="flex flex-1 flex-col items-start gap-4 p-4 md:p-6">
          <p className="text-sm text-destructive">
            {notFound ? t("meetings.details.notFound") : t("meetings.details.loadError")}
          </p>
          <Button variant="outline" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="size-4" />
              {t("meetings.details.back")}
            </Link>
          </Button>
        </div>
      </>
    );
  }

  const processing = isProcessing(meeting.status);
  const ready = meeting.status === "completed";
  const speakerCount = Object.keys(meeting.speakers).length;

  return (
    <>
      <DashboardHeader
        crumbs={crumbs}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={!ready || exportMarkdown.isPending}
              onClick={() =>
                exportMarkdown.mutate({ id: meeting.id, title: meeting.title })
              }
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">
                {exportMarkdown.isPending
                  ? t("meetings.details.exporting")
                  : t("meetings.details.export")}
              </span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  <span className="hidden sm:inline">{t("meetings.details.delete")}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("meetings.list.deleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("meetings.list.deleteDescription", { title: meeting.title })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("meetings.list.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={remove.isPending}
                    onClick={() =>
                      remove.mutate(meeting.id, {
                        onSuccess: () => navigate("/dashboard")
                      })
                    }
                  >
                    {t("meetings.list.confirmDelete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        }
      />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{meeting.title}</h1>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setRenaming(true)}
                aria-label={t("meetings.details.rename")}
              >
                <Pencil className="size-4" />
              </Button>
              <MeetingStatusBadge status={meeting.status} progress={meeting.progress} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>
                {t("meetings.details.uploadedOn", {
                  date: formatDate(meeting.createdAt, i18n.language)
                })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {formatDuration(meeting.durationSeconds)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" />
                {speakerCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <Languages className="size-3.5" />
                {meeting.language?.toUpperCase() ?? t("meetings.details.unknown")}
              </span>
              <span className="inline-flex items-center gap-1">
                <FileAudio2 className="size-3.5" />
                {meeting.fileName} · {formatBytes(meeting.byteSize)}
              </span>
            </div>
          </div>
        </div>

        {(processing || meeting.status === "failed") && (
          <ProcessingTimeline meeting={meeting} />
        )}

        <Card>
          <CardContent className="pt-6">
            <MediaPlayer
              ref={mediaRef}
              meetingId={meeting.id}
              mimeType={meeting.mimeType}
            />
          </CardContent>
        </Card>

        {ready || meeting.transcript ? (
          <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="summary">{t("meetings.tabs.summary")}</TabsTrigger>
              <TabsTrigger value="actionItems">
                {t("meetings.tabs.actionItems")}
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[11px]">
                  {meeting.actionItems.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="decisions">
                {t("meetings.tabs.decisions")}
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[11px]">
                  {meeting.decisions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="transcript">
                {t("meetings.tabs.transcript")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4">
              <Card>
                <CardContent className="space-y-5 pt-6">
                  {meeting.summary ? (
                    <SimpleMarkdown text={meeting.summary} className="text-sm" />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {processing
                        ? t("meetings.details.notReady")
                        : t("meetings.summary.empty")}
                    </p>
                  )}
                  {meeting.keyTopics.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        {t("meetings.summary.keyTopics")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {meeting.keyTopics.map((topic) => (
                          <Badge key={topic} variant="outline">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actionItems" className="mt-4">
              <ActionItemsList items={meeting.actionItems} onShowSource={showSource} />
            </TabsContent>

            <TabsContent value="decisions" className="mt-4">
              <DecisionsList decisions={meeting.decisions} onShowSource={showSource} />
            </TabsContent>

            <TabsContent value="transcript" className="mt-4">
              <Card>
                <CardHeader className="sr-only">
                  <CardTitle>{t("meetings.tabs.transcript")}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <TranscriptView
                    meetingId={meeting.id}
                    segments={meeting.transcript ?? []}
                    speakers={meeting.speakers}
                    highlightedSegmentId={highlighted}
                    onSeek={seek}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("meetings.details.notReady")}
          </p>
        )}
      </div>

      <RenameMeetingDialog
        meetingId={meeting.id}
        currentTitle={meeting.title}
        open={renaming}
        onOpenChange={setRenaming}
      />
    </>
  );
}
