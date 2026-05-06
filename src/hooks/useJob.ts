import { Get } from "@/utils/request";
import { message } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

const useJob = () => {
  const { jobId } = useParams<{
    jobId: string;
  }>();

  const [job, setJob] = useState<IJob>();
  const [unviewedTalentCount, setUnviewedTalentCount] = useState(0);

  useEffect(() => {
    if (!jobId) return;
    void fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    if (!jobId) return;

    setJob(undefined);
    const { code, data } = await Get(`/api/jobs/${jobId}`);

    if (code === 0) {
      setJob({ ...data.job, apply_inbound_email: data.apply_inbound_email });
      setUnviewedTalentCount(data.unviewed_talent_count);
    } else {
      message.error("Get job failed");
    }
  };

  return {
    job,
    fetchJob,
    unviewedTalentCount,
    setUnviewedTalentCount,
    jobId,
  };
};

export default useJob;
