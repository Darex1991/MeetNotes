import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateMeeting } from "~/api/mutations/useUpdateMeeting";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function RenameMeetingDialog({
  meetingId,
  currentTitle,
  open,
  onOpenChange
}: {
  meetingId: string;
  currentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateMeeting(meetingId);
  const [title, setTitle] = useState(currentTitle);

  useEffect(() => {
    if (open) setTitle(currentTitle);
  }, [open, currentTitle]);

  const save = () => {
    if (!title.trim()) return;
    update.mutate({ title: title.trim() }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("meetings.details.renameTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="meeting-title">{t("meetings.details.renameLabel")}</Label>
          <Input
            id="meeting-title"
            value={title}
            autoFocus
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && save()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("meetings.list.cancel")}
          </Button>
          <Button onClick={save} disabled={update.isPending || !title.trim()}>
            {update.isPending ? t("meetings.details.saving") : t("meetings.details.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
