import { Get } from "@/utils/request";
import { message } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

const usePublicJob = () => {
  const { jobId } = useParams<{
    jobId: string;
  }>();

  const [job, setJob] = useState<TPublicJob>();

  useEffect(() => {
    if (!jobId) return;
    void fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    if (!jobId) return;

    const { code, data } = await Get(`/api/public/jobs/${jobId}/share`);

    if (code === 0) {
      const job: TPublicJob = data.job;
      setJob(job);
    } else {
      message.error("Get job failed");
    }
  };

  return { job, fetchJob, jobId };
};

export default usePublicJob;
