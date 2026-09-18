import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "../api-client";
import { meetingKeys } from "../meetings.types";

export function useMeetingMediaUrl(id: string, enabled = true) {
  return useQuery({
    queryKey: meetingKeys.mediaUrl(id),
    queryFn: async () => {
      const response = await ApiClient.api.meetingsControllerGetMediaUrlV1(id);
      return response.data.data;
    },
    enabled,
    // Signed URLs live for an hour; refresh a little before they expire.
    staleTime: 50 * 60 * 1000,
    refetchInterval: 50 * 60 * 1000
  });
}
