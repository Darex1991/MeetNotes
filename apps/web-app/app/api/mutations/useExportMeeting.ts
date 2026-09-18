import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiClient } from "../api-client";

export function useExportMeeting() {
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const response = await ApiClient.api.meetingsControllerExportMeetingV1(id, {
        format: "blob"
      });
      const blob = new Blob([response.data], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${title.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase() || "meeting"}.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => toast.error(error.message)
  });
}
