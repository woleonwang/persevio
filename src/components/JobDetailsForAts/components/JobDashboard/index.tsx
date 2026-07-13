import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import EmployerDashboard from "@/components/EmployerDashboard";
import useJob from "@/hooks/useJob";
import { PREFIX_DEFAULT_STAGE_KEYS } from "@/utils/consts";

const JobDashboard = () => {
  const { job } = useJob();
  const { t } = useTranslation();

  const pipelineStages = useMemo(() => {
    if (!job) return [];
    const customStages: { id: string; name: string }[] = job.pipeline_stages
      ? JSON.parse(job.pipeline_stages)
      : [];
    return [
      ...PREFIX_DEFAULT_STAGE_KEYS.filter((key) => key !== "reached_out").map(
        (key) => ({
          id: key,
          name: t(`pipeline_section.${key}`),
        }),
      ),
      ...customStages.map((stage) => ({
        id: stage.id,
        name: stage.name,
      })),
    ];
  }, [job, t]);

  if (!job?.id) return null;

  return (
    <EmployerDashboard
      mode="job"
      jobId={job.id}
      pipelineStages={pipelineStages}
    />
  );
};

export default JobDashboard;
