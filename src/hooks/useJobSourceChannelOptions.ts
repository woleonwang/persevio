import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { SOURCING_CHANNEL_KEYS } from "@/utils";
import { Get } from "@/utils/request";

export type TJobSourceChannelOption = {
  value: string;
  label: string;
  type: "preset" | "custom";
};

const useJobSourceChannelOptions = ({ jobId }: { jobId?: number }) => {
  const { t } = useTranslation();
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

  const options: TJobSourceChannelOption[] = useMemo(() => {
    const presetOptions: TJobSourceChannelOption[] = SOURCING_CHANNEL_KEYS.map(
      (key) => ({
        value: key,
        label: t(`sourcing_channel.${key}`),
        type: "preset",
      }),
    );

    const customOptions: TJobSourceChannelOption[] = (customSources ?? []).map(
      (cs) => ({
        value: cs.name,
        label: cs.name,
        type: "custom",
      }),
    );

    return [...presetOptions, ...customOptions];
  }, [customSources, t]);

  return { options, customSources, fetchCustomSources };
};

export default useJobSourceChannelOptions;
