import { useEffect, useState } from "react";
import { LeftCircleOutlined } from "@ant-design/icons";
import styles from "./style.module.less";
import { Get } from "@/utils/request";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Button } from "antd";
import dayjs from "dayjs";

const InterviewFeedbacks = () => {
  const [interviewFeedbacks, setInterviewFeedbacks] = useState<
    TInterviewFeedback[]
  >([]);

  const { jobId } = useParams();

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>) =>
    originalT(`interview_feedback.${key}`, params);

  useEffect(() => {
    fetchInterviewFeedbacks();
  }, []);

  const fetchInterviewFeedbacks = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}/interview_feedbacks`);
    if (code === 0) {
      setInterviewFeedbacks(data.interview_feedbacks);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>{t("title")}</div>
        <LeftCircleOutlined
          style={{ color: "#1FAC6A", cursor: "pointer" }}
          onClick={() => navigate(`/app/jobs/${jobId}`)}
        />
      </div>
      <div className={styles.main}>
        <div style={{ marginBottom: "12px" }}>
          <Button
            type="primary"
            onClick={() =>
              navigate(`/app/jobs/${jobId}/interview-feedbacks/new`)
            }
          >
            {t("new_chat")}
          </Button>
        </div>
        {interviewFeedbacks.map((interviewFeedback) => {
          return (
            <div key={interviewFeedback.id} className={styles.jobApplyCard}>
              <div>
                <div className={styles.jobName}>
                  {interviewFeedback.talent
                    ? `${interviewFeedback.talent.name} - ${t("round", {
                        round: interviewFeedback.round?.toString(),
                      })}`
                    : "Unknown Talent"}
                </div>
                <div style={{ fontSize: "14px", color: "#999", marginTop: 8 }}>
                  {originalT("created_at")}:{" "}
                  {dayjs(interviewFeedback.updated_at).format(
                    "YYYY-MM-DD HH:mm:ss"
                  )}
                </div>
                <div className={styles.tags}>
                  <Button
                    type="primary"
                    onClick={() =>
                      navigate(
                        `/app/jobs/${jobId}/interview-feedbacks/${interviewFeedback.id}/chat`
                      )
                    }
                  >
                    {t("chat")}
                  </Button>
                  <Button
                    type="primary"
                    onClick={() =>
                      navigate(
                        `/app/jobs/${jobId}/interview-feedbacks/${interviewFeedback.id}/edit`
                      )
                    }
                    style={{ marginLeft: 12 }}
                  >
                    {t("edit_context")}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InterviewFeedbacks;
