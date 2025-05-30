import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Button, Drawer, message, Spin, Steps } from "antd";
import { LeftCircleOutlined } from "@ant-design/icons";
import { Get, Post } from "@/utils/request";
import CandidateChat from "@/components/CandidateChat";
import { parseJd } from "@/utils";
import MarkdownContainer from "@/components/MarkdownContainer";

import styles from "./style.module.less";
import CompanyLogo from "../components/CompanyLogo";
import ChatRoom from "@/components/ChatRoom";

const JobApplyShow = () => {
  const [jobApply, setJobApply] = useState<IJobApply>();
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [interviewChatDrawerOpen, setInterviewChatDrawerOpen] = useState(false);
  const applyStatus = ((): number => {
    if (!jobApply) {
      return 0;
    }

    if (
      jobApply.talentStatus === "accepted" ||
      jobApply.talentStatus === "rejected"
    ) {
      return 2;
    }

    if (!!jobApply.deliveried_at) {
      return 1;
    }

    return 0;
  })();

  const { jobApplyId = "" } = useParams();

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();

  const t = (key: string) => originalT(`job_apply.${key}`);

  useEffect(() => {
    fetchApplyJob();
    const urlParams = new URLSearchParams(window.location.search);
    const open = urlParams.get("open");
    if (open === "1") {
      setInterviewChatDrawerOpen(true);
    }
  }, []);

  const fetchApplyJob = async () => {
    const { code, data } = await Get(
      `/api/candidate/job_applies/${jobApplyId}`
    );
    if (code === 0) {
      setJobApply({
        ...data.job_apply,
        jd: parseJd(data.jd),
        talentStatus: data.talent_status,
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
      <div className={styles.header}>
        <div>{originalT("job_applies.jobs")}</div>
        <LeftCircleOutlined
          style={{ color: "#1FAC6A", cursor: "pointer" }}
          onClick={() => navigate("/candidate/job-applies")}
        />
      </div>
      <div className={styles.main}>
        <div className={styles.left}>
          <div className={styles.jobApplyCard}>
            <div className={styles.basicInfo}>
              <CompanyLogo logo={jobApply.company_logo} />
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
              {!jobApply.deliveried_at && (
                <Button
                  type="primary"
                  shape="round"
                  disabled={!!jobApply.deliveried_at}
                  onClick={() => {
                    if (jobApply.interview_finished_at) {
                      delivery();
                    } else {
                      setInterviewChatDrawerOpen(true);
                    }
                  }}
                >
                  {t("apply_now")}
                </Button>
              )}

              <Button
                style={{ marginLeft: 10 }}
                type="primary"
                shape="round"
                onClick={() => setChatDrawerOpen(true)}
              >
                {originalT("chat_with_viona")}
              </Button>
            </div>
          </div>
          <div className={styles.jd}>
            <MarkdownContainer content={jobApply.jd} />
          </div>
        </div>
        <div className={styles.right}>
          <Steps
            progressDot
            direction="vertical"
            size="small"
            current={applyStatus}
            items={[
              { title: "Interview" },
              { title: "Resume Submitted" },
              { title: "Resume Processed" },
            ]}
          />
        </div>
      </div>

      <Drawer
        open={chatDrawerOpen}
        width={1200}
        onClose={() => setChatDrawerOpen(false)}
        title={originalT("chat_with_viona")}
      >
        <div style={{ height: "100%", display: "flex" }}>
          <ChatRoom
            userRole="candidate"
            jobId={jobApply.job_id}
            sessionId={`${jobApply.candidate_id}`}
            disableApply
          />
        </div>
      </Drawer>

      <Drawer
        open={interviewChatDrawerOpen}
        width={1200}
        onClose={() => setInterviewChatDrawerOpen(false)}
        title={t("interview")}
      >
        <div style={{ height: "100%", display: "flex" }}>
          <CandidateChat
            chatType="job_interview"
            jobApplyId={parseInt(jobApplyId)}
            onFinish={() => {
              fetchApplyJob();
              message.success(t("finish_interview_hint"));
            }}
          />
        </div>
      </Drawer>
    </div>
  );
};

export default JobApplyShow;
