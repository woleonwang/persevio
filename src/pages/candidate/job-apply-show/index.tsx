import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Button, message, Spin } from "antd";

import { Get, Post } from "@/utils/request";
import CandidateChat from "@/components/CandidateChat";
import { getImgSrc, parseJd } from "@/utils";
import MarkdownContainer from "@/components/MarkdownContainer";

import styles from "./style.module.less";

const JobApplyShow = () => {
  const [jobApply, setJobApply] = useState<IJobApply>();

  const { jobApplyId = "" } = useParams();

  const { t: originalT } = useTranslation();

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
        jd: parseJd(data.jd),
      });
    }
  };

  const delivery = async () => {
    const { code } = await Post(
      `/api/candidate/job_applies/${jobApplyId}/delivery`
    );
    if (code === 0) {
      message.success(originalT("submit_succeed"));
      fetchApplyJob();
    } else {
      message.error(originalT("submit_failed"));
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
                disabled={
                  !jobApply.interview_finished_at || !!jobApply.deliveried_at
                }
                onClick={() => delivery()}
              >
                {!!jobApply.deliveried_at ? "Applied" : "Apply Now"}
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
