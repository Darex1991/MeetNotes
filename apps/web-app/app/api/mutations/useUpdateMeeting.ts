import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ApiClient } from "../api-client";
import type { UpdateMeetingBody } from "../generated-api";
import { meetingKeys } from "../meetings.types";
import { queryClient } from "../queryClient";

export function useUpdateMeeting(id: string) {
  return useMutation({
    mutationFn: async (data: UpdateMeetingBody) => {
      const response = await ApiClient.api.meetingsControllerUpdateMeetingV1(id, data);
      return response.data.data;
    },
    onSuccess: (meeting) => {
      queryClient.setQueryData(meetingKeys.detail(id), meeting);
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
