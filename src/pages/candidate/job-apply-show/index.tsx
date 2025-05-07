import { useEffect, useState } from "react";
import styles from "./style.module.less";
import { Get } from "@/utils/request";
import { useNavigate, useParams } from "react-router";
import CandidateChat from "@/components/CandidateChat";
import { Spin } from "antd";
const JobApplyShow = () => {
  const [jobApply, setJobApply] = useState<IJobApply>();

  const { jobApplyId = "" } = useParams();

  const navigate = useNavigate();

  useEffect(() => {
    fetchApplyJob();
  }, []);

  const fetchApplyJob = async () => {
    const { code, data } = await Get(
      `/api/candidate/job_applies/${jobApplyId}`
    );
    if (code === 0) {
      setJobApply(data.job_apply);
    }
  };

  if (!jobApply) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div>{jobApply.job_name}</div>
        <div>
          <CandidateChat
            chatType="job_interview"
            jobApplyId={parseInt(jobApplyId)}
          />
        </div>
      </div>
    </div>
  );
};

export default JobApplyShow;
