import { Get } from "@/utils/request";
import { useEffect, useState } from "react";

const useSourcingChannels = ({ jobId }: { jobId?: number }) => {
  const [customSources, setCustomSources] = useState<TCustomSource[]>([]);

  useEffect(() => {
    fetchCustomSources();
  }, [jobId]);

  const fetchCustomSources = async () => {
    if (!jobId) return;
    const { code, data } = await Get<{ custom_sources: TCustomSource[] }>(
      `/api/jobs/${jobId}/custom_sources`,
    );
    if (code === 0) setCustomSources(data?.custom_sources ?? []);
  };

  return { customSources, fetchCustomSources };
};

export default useSourcingChannels;
