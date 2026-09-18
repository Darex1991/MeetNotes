import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

import { useMeetingMediaUrl } from "~/api/queries/useMeetingMediaUrl";
import { Skeleton } from "~/components/ui/skeleton";

export const MediaPlayer = forwardRef<
  HTMLMediaElement,
  { meetingId: string; mimeType: string }
>(function MediaPlayer({ meetingId, mimeType }, ref) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useMeetingMediaUrl(meetingId);
  const isVideo = mimeType.startsWith("video/");

  if (isLoading) {
    return (
      <Skeleton
        className={isVideo ? "aspect-video w-full rounded-xl" : "h-12 w-full rounded-xl"}
      />
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-muted-foreground">{t("meetings.player.unavailable")}</p>
    );
  }

  if (isVideo) {
    return (
      <video
        ref={ref as React.Ref<HTMLVideoElement>}
        src={data.url}
        controls
        preload="metadata"
        className="aspect-video w-full rounded-xl bg-black"
      />
    );
  }

  return (
    <audio
      ref={ref as React.Ref<HTMLAudioElement>}
      src={data.url}
      controls
      preload="metadata"
      className="w-full"
    />
  );
});
