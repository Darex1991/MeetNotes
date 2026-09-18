import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ApiClient } from "../api-client";
import { meetingKeys } from "../meetings.types";
import { queryClient } from "../queryClient";

export type UploadMeetingInput = {
  file: File;
  title?: string;
  language?: string;
  onProgress?: (percent: number) => void;
};

export function useUploadMeeting() {
  return useMutation({
    mutationFn: async ({ file, title, language, onProgress }: UploadMeetingInput) => {
      const response = await ApiClient.api.meetingsControllerCreateMeetingV1(
        {
          file,
          ...(title ? { title } : {}),
          ...(language ? { language } : {})
        },
        {
          onUploadProgress: (event) => {
            if (!onProgress) return;
            const total = event.total ?? file.size;
            onProgress(total ? Math.round((event.loaded / total) * 100) : 0);
          }
        }
      );

      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meetingKeys.list() });
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        return toast.error(error.response?.data?.message ?? error.message);
      }
      toast.error(error.message);
    }
  });
}
