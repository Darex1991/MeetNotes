import { CloudUpload, FileAudio2, FileVideo2, X } from "lucide-react";
import { useCallback, useId, useRef, useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useUploadMeeting } from "~/api/mutations/useUploadMeeting";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Progress } from "~/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { ACCEPTED_MEDIA, MAX_UPLOAD_MB, formatBytes } from "../meetings.utils";

const LANGUAGES = ["auto", "en", "pl", "de", "es", "fr", "uk"] as const;

export function UploadDropzone({ onUploaded }: { onUploaded?: (id: string) => void }) {
  const { t } = useTranslation();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<string>("auto");
  const [dragging, setDragging] = useState(false);
  const [percent, setPercent] = useState(0);
  const upload = useUploadMeeting();

  const acceptFile = useCallback(
    (candidate: File | undefined) => {
      if (!candidate) return;
      const isMedia =
        candidate.type.startsWith("audio/") ||
        candidate.type.startsWith("video/") ||
        /\.(m4a|mp3|wav|flac|ogg|opus|mp4|mov|webm|mkv)$/i.test(candidate.name);

      if (!isMedia) {
        toast.error(t("meetings.upload.invalidType"));
        return;
      }
      if (candidate.size > MAX_UPLOAD_MB * 1024 * 1024) {
        toast.error(t("meetings.upload.tooLarge", { max: MAX_UPLOAD_MB }));
        return;
      }

      setFile(candidate);
      if (!title) {
        setTitle(candidate.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
      }
    },
    [t, title]
  );

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const reset = () => {
    setFile(null);
    setTitle("");
    setLanguage("auto");
    setPercent(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = () => {
    if (!file) return;
    setPercent(0);
    upload.mutate(
      {
        file,
        title: title.trim() || undefined,
        language: language === "auto" ? undefined : language,
        onProgress: setPercent
      },
      {
        onSuccess: (meeting) => {
          toast.success(t("meetings.upload.queued"));
          reset();
          onUploaded?.(meeting.id);
        }
      }
    );
  };

  const FileIcon = file?.type.startsWith("video/") ? FileVideo2 : FileAudio2;

  return (
    <Card id="upload" className="border-border">
      <CardHeader>
        <CardTitle>{t("meetings.upload.title")}</CardTitle>
        <CardDescription>
          {t("meetings.upload.description", { max: MAX_UPLOAD_MB })}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div
          role="button"
          tabIndex={0}
          aria-label={t("meetings.upload.dropzone")}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/40",
            upload.isPending && "pointer-events-none opacity-60"
          )}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPTED_MEDIA}
            className="hidden"
            onChange={(event) => acceptFile(event.target.files?.[0])}
          />
          {file ? (
            <>
              <FileIcon className="size-10 text-primary" />
              <div className="space-y-1">
                <p className="max-w-xs truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {file.type || "media"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  reset();
                }}
              >
                <X className="size-4" />
                {t("meetings.upload.remove")}
              </Button>
            </>
          ) : (
            <>
              <CloudUpload className="size-10 text-muted-foreground" />
              <p className="text-sm font-medium">{t("meetings.upload.dropzone")}</p>
              <p className="text-xs text-muted-foreground">
                {t("meetings.upload.dropzoneHint")}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`${inputId}-title`}>{t("meetings.upload.titleLabel")}</Label>
            <Input
              id={`${inputId}-title`}
              value={title}
              maxLength={200}
              placeholder={t("meetings.upload.titlePlaceholder")}
              onChange={(event) => setTitle(event.target.value)}
              disabled={upload.isPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${inputId}-language`}>
              {t("meetings.upload.languageLabel")}
            </Label>
            <Select
              value={language}
              onValueChange={setLanguage}
              disabled={upload.isPending}
            >
              <SelectTrigger id={`${inputId}-language`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code === "auto"
                      ? t("meetings.upload.languageAuto")
                      : code.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {upload.isPending && (
            <div className="space-y-1.5">
              <Progress value={percent} />
              <p className="text-xs text-muted-foreground">
                {t("meetings.upload.uploading", { percent })}
              </p>
            </div>
          )}

          <Button
            type="button"
            className="mt-auto"
            disabled={!file || upload.isPending}
            onClick={submit}
          >
            <CloudUpload className="size-4" />
            {t("meetings.upload.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
