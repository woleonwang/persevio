import { Get } from "@/utils/request";
import { message } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

const useJob = () => {
  const { jobId: jobIdStr } = useParams<{
    jobId: string;
  }>();
  const jobId = parseInt(jobIdStr ?? "0");

  const [job, setJob] = useState<IJob>();

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}`);

    if (code === 0) {
      const job: IJob = data.job ?? data;
      setJob(job);
    } else {
      message.error("Get job failed");
    }
  };

  return { job, fetchJob };
};

export default useJob;
