import { useEffect, useState } from "react";
import { LeftCircleOutlined } from "@ant-design/icons";
import styles from "./style.module.less";
import { Get } from "@/utils/request";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Button } from "antd";
import dayjs from "dayjs";

const InterviewDesigners = () => {
  const [interviewDesigners, setInterviewDesigners] = useState<
    TInterviewDesigner[]
  >([]);

  const { jobId } = useParams();

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>) =>
    originalT(`interview_designer.${key}`, params);

  useEffect(() => {
    fetchInterviewDesigners();
  }, []);

  const fetchInterviewDesigners = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}/interview_designers`);
    if (code === 0) {
      setInterviewDesigners(data.interview_designers);
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
              navigate(`/app/jobs/${jobId}/interview-designers/new`)
            }
          >
            {t("new_chat")}
          </Button>
        </div>
        {interviewDesigners.map((interviewDesigner) => {
          return (
            <div key={interviewDesigner.id} className={styles.jobApplyCard}>
              <div>
                <div className={styles.jobName}>
                  {interviewDesigner.talent
                    ? `${interviewDesigner.talent.name} - ${t("round", {
                        round: interviewDesigner.round?.toString(),
                      })}`
                    : "Unknown Talent"}
                </div>
                <div style={{ fontSize: "14px", color: "#999", marginTop: 8 }}>
                  {originalT("created_at")}:{" "}
                  {dayjs(interviewDesigner.updated_at).format(
                    "YYYY-MM-DD HH:mm:ss"
                  )}
                </div>
                <div className={styles.tags}>
                  <Button
                    type="primary"
                    onClick={() =>
                      navigate(
                        `/app/jobs/${jobId}/interview-designers/${interviewDesigner.id}/chat`
                      )
                    }
                  >
                    {t("chat")}
                  </Button>
                  <Button
                    type="primary"
                    onClick={() =>
                      navigate(
                        `/app/jobs/${jobId}/interview-designers/${interviewDesigner.id}/edit`
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

export default InterviewDesigners;
