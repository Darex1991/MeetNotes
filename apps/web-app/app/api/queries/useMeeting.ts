import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "../api-client";
import { isProcessing, meetingKeys } from "../meetings.types";

const PROCESSING_POLL_MS = 3000;

export const meetingQueryOptions = (id: string) => ({
  queryKey: meetingKeys.detail(id),
  queryFn: async () => {
    const response = await ApiClient.api.meetingsControllerGetMeetingV1(id);
    return response.data.data;
  }
});

export function useMeeting(id: string) {
  return useQuery({
    ...meetingQueryOptions(id),
    refetchInterval: (query) =>
      query.state.data && isProcessing(query.state.data.status)
        ? PROCESSING_POLL_MS
        : false
  });
}
