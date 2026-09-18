import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "../api-client";
import { isProcessing, meetingKeys } from "../meetings.types";

const PROCESSING_POLL_MS = 4000;

export const meetingsQueryOptions = {
  queryKey: meetingKeys.list(),
  queryFn: async () => {
    const response = await ApiClient.api.meetingsControllerListMeetingsV1();
    return response.data.data;
  }
};

export function useMeetings() {
  return useQuery({
    ...meetingsQueryOptions,
    refetchInterval: (query) =>
      query.state.data?.some((meeting) => isProcessing(meeting.status))
        ? PROCESSING_POLL_MS
        : false
  });
}
