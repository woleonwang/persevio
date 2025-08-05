import { Get } from "@/utils/request";
import { message } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
const usePublicJob = () => {
  const { jobId: jobIdStr } = useParams<{
    jobId: string;
  }>();
  const jobId = parseInt(jobIdStr ?? "0");

  const [job, setJob] = useState<TPublicJob>();

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    const { code, data } = await Get(`/api/public/jobs/${jobId}/share`);

    if (code === 0) {
      const job: TPublicJob = data.job;
      setJob(job);
    } else {
      message.error("Get job failed");
    }
  };

  return { job, fetchJob };
};

export default usePublicJob;
