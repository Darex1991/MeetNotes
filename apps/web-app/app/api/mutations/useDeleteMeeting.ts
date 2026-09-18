import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ApiClient } from "../api-client";
import { meetingKeys } from "../meetings.types";
import { queryClient } from "../queryClient";

export function useDeleteMeeting() {
  return useMutation({
    mutationFn: async (id: string) => {
      await ApiClient.api.meetingsControllerDeleteMeetingV1(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        return toast.error(error.response?.data?.message ?? error.message);
      }
      toast.error(error.message);
    }
  });
}
