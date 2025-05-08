import { useEffect, useState } from "react";
import styles from "./style.module.less";
import { Get } from "@/utils/request";
import { useParams } from "react-router";
import CandidateChat from "@/components/CandidateChat";
import { Button, Spin } from "antd";
import { getImgSrc } from "@/utils";
import MarkdownContainer from "@/components/MarkdownContainer";
const JobApplyShow = () => {
  const [jobApply, setJobApply] = useState<IJobApply>();

  const { jobApplyId = "" } = useParams();

  useEffect(() => {
    fetchApplyJob();
  }, []);

  const fetchApplyJob = async () => {
    const { code, data } = await Get(
      `/api/candidate/job_applies/${jobApplyId}`
    );
    if (code === 0) {
      setJobApply({
        ...data.job_apply,
        recommend_reason: data.recommend_reason,
        jd: data.jd,
      });
    }
  };

  if (!jobApply) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.left}>
          <div className={styles.jobApplyCard}>
            <div className={styles.basicInfo}>
              <img
                src={getImgSrc(jobApply.company_logo)}
                className={styles.companyLogo}
              />
              <div>
                <div className={styles.jobName}>{jobApply.job_name}</div>
                <div className={styles.tags}>
                  <div className={styles.companyName}>
                    {jobApply.company_name}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Button
                type="primary"
                shape="round"
                disabled={!jobApply.interview_finished_at}
              >
                Apply Now
              </Button>
            </div>
          </div>

          <div className={styles.recommendReason}>
            <div className={styles.recommendReasonTitle}>
              Why We Recommended This
            </div>
            <div className={styles.recommendReasonContent}>
              <MarkdownContainer content={jobApply.recommend_reason} />
            </div>
          </div>

          <div className={styles.jd}>
            <div className={styles.jdTitle}>Job Description</div>
            <div className={styles.jdContent}>
              <MarkdownContainer content={jobApply.jd} />
            </div>
          </div>
        </div>
        <div className={styles.right}>
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
