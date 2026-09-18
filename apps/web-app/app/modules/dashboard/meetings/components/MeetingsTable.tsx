import { ArrowRight, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";

import type { MeetingListItem } from "~/api/meetings.types";
import { useDeleteMeeting } from "~/api/mutations/useDeleteMeeting";
import { useRetryMeeting } from "~/api/mutations/useRetryMeeting";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "~/components/ui/dropdown-menu";
import { Progress } from "~/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "~/components/ui/table";
import { isProcessing } from "~/api/meetings.types";
import { formatDate, formatDuration } from "../meetings.utils";
import { MeetingStatusBadge } from "./MeetingStatusBadge";

export function MeetingsTable({ meetings }: { meetings: MeetingListItem[] }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const retry = useRetryMeeting();
  const remove = useDeleteMeeting();
  const [pendingDelete, setPendingDelete] = useState<MeetingListItem | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("meetings.list.columns.title")}</TableHead>
              <TableHead className="w-48">{t("meetings.list.columns.status")}</TableHead>
              <TableHead className="hidden w-24 md:table-cell">
                {t("meetings.list.columns.duration")}
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                {t("meetings.list.columns.results")}
              </TableHead>
              <TableHead className="hidden w-44 md:table-cell">
                {t("meetings.list.columns.created")}
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map((meeting) => (
              <TableRow
                key={meeting.id}
                className="cursor-pointer"
                onClick={() => navigate(`/dashboard/meetings/${meeting.id}`)}
              >
                <TableCell className="max-w-[18rem]">
                  <div className="flex flex-col gap-0.5">
                    <span className="truncate font-medium">{meeting.title}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {meeting.fileName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    <MeetingStatusBadge
                      status={meeting.status}
                      progress={meeting.progress}
                    />
                    {isProcessing(meeting.status) && (
                      <Progress value={meeting.progress} className="h-1" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden tabular-nums md:table-cell">
                  {formatDuration(meeting.durationSeconds)}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {meeting.status === "completed"
                    ? t("meetings.list.results", {
                        actionItems: meeting.actionItemsCount,
                        decisions: meeting.decisionsCount
                      })
                    : "—"}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {formatDate(meeting.createdAt, i18n.language)}
                </TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">More</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/meetings/${meeting.id}`}>
                          <ArrowRight className="text-muted-foreground" />
                          {t("meetings.list.open")}
                        </Link>
                      </DropdownMenuItem>
                      {meeting.status === "failed" && (
                        <DropdownMenuItem
                          disabled={retry.isPending}
                          onSelect={() => retry.mutate(meeting.id)}
                        >
                          <RotateCcw className="text-muted-foreground" />
                          {t("meetings.list.retry")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setPendingDelete(meeting)}
                      >
                        <Trash2 />
                        {t("meetings.list.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("meetings.list.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("meetings.list.deleteDescription", {
                title: pendingDelete?.title ?? ""
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("meetings.list.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (!pendingDelete) return;
                remove.mutate(pendingDelete.id, {
                  onSettled: () => setPendingDelete(null)
                });
              }}
            >
              {t("meetings.list.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
