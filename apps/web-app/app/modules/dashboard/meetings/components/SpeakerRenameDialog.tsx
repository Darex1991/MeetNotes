import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useUpdateMeeting } from "~/api/mutations/useUpdateMeeting";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function SpeakerRenameDialog({
  meetingId,
  speaker,
  currentName,
  onClose
}: {
  meetingId: string;
  speaker: string | null;
  currentName: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateMeeting(meetingId);
  const [name, setName] = useState(currentName);

  useEffect(() => setName(currentName), [currentName, speaker]);

  const save = () => {
    if (!speaker || !name.trim()) return;
    update.mutate({ speakers: { [speaker]: name.trim() } }, { onSuccess: onClose });
  };

  return (
    <Dialog open={!!speaker} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("meetings.transcript.renameSpeaker")}</DialogTitle>
          <DialogDescription>{t("meetings.transcript.speakerHint")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="speaker-name">{t("meetings.transcript.speakerName")}</Label>
          <Input
            id="speaker-name"
            value={name}
            autoFocus
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && save()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("meetings.list.cancel")}
          </Button>
          <Button onClick={save} disabled={update.isPending || !name.trim()}>
            {update.isPending ? t("meetings.details.saving") : t("meetings.details.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
