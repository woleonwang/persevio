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
  const [unviewedTalentCount, setUnviewedTalentCount] = useState(0);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    setJob(undefined);
    const { code, data } = await Get(`/api/jobs/${jobId}`);

    if (code === 0) {
      setJob({ ...data.job, apply_inbound_email: data.apply_inbound_email });
      setUnviewedTalentCount(data.unviewed_talent_count);
    } else {
      message.error("Get job failed");
    }
  };

  return { job, fetchJob, unviewedTalentCount, setUnviewedTalentCount };
};

export default useJob;
