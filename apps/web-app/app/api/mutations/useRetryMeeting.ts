import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ApiClient } from "../api-client";
import { meetingKeys } from "../meetings.types";
import { queryClient } from "../queryClient";

export function useRetryMeeting() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await ApiClient.api.meetingsControllerRetryMeetingV1(id);
      return response.data.data;
    },
    onSuccess: (meeting) => {
      queryClient.setQueryData(meetingKeys.detail(meeting.id), meeting);
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
