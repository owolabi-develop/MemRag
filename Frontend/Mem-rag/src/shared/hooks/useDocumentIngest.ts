
import { useQuery } from "@tanstack/react-query";
import { getIngestStatus, type IngestStatusResponse } from "../api/document.api";
import { removeTrackedJob } from "../utils/ingestJobsStorage";

export function useIngestStatusQuery(
  jobId: string,
  onTerminal?: (data: IngestStatusResponse) => void
) {
  return useQuery({
    queryKey: ["ingestStatus", jobId],
    queryFn: async () => {
      const data = await getIngestStatus(jobId);
      if (data.status === "complete" || data.status === "error") {
        removeTrackedJob(jobId);
        onTerminal?.(data);
      }
      return data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "complete" || status === "error" ? false : 1500;
    },
  });
}