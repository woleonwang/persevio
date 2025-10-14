import {
  Avatar,
  Badge,
  Button,
  message,
  Spin,
  Switch,
  Tooltip,
  Upload,
} from "antd";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  CloseCircleOutlined,
  ExportOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";

import { checkJobDotStatus, copy, setJobDotStatus } from "@/utils";
import useJob from "@/hooks/useJob";
import { Get, Post, PostFormData } from "@/utils/request";

import VionaAvatar from "@/assets/viona-avatar.png";
import styles from "./style.module.less";
import Step from "@/components/Step";
import ChatRoomNew from "@/components/ChatRoomNew";

type TJobState = "jrd" | "jd" | "preview" | "board";

const JobBoard = () => {
  const { job, fetchJob } = useJob();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_board.${key}`);
  const navigate = useNavigate();

  const [talents, setTalents] = useState<TTalent[]>([]);
  const [jobState, setJobState] = useState<TJobState>();

  useEffect(() => {
    if (job) {
      fetchTalents();
      if (job.posted_at) {
        setJobState("board");
      } else if (job.jd_doc_id) {
        setJobState("preview");
      } else if (job.requirement_doc_id) {
        setJobState("jd");
      } else {
        setJobState("jrd");
      }
    }
  }, [job]);
  const fetchTalents = async () => {
    const { code, data } = await Get<{
      talents: TTalent[];
    }>(`/api/jobs/${job?.id}/talents`);

    if (code === 0) {
      setTalents(data.talents);
    }
  };

  if (!job) {
    return <Spin />;
  }

  const VionaAvatarDiv = (
    <div className={styles.avatar}>
      <Avatar src={VionaAvatar} />
      <div>Viona</div>
    </div>
  );

  const stateText = () => {
    if (jobState === "jrd") {
      return "详细定义职位需求";
    }
    if (jobState === "jd") {
      return "定义JD";
    }
    if (jobState === "preview") {
      return "职位预览";
    }
    return "";
  };

  const stateIndex = () => {
    if (jobState === "jrd") {
      return 0;
    }
    if (jobState === "jd") {
      return 1;
    }
    if (jobState === "preview") {
      return 2;
    }
    return 0;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {jobState === "board" ? (
          <>
            {job.name}
            <div className={styles.right}>
              <Tooltip title={t("recruitment_chatbot")}>
                <ExportOutlined
                  onClick={async () => {
                    window.open(`${window.origin}/jobs/${job.id}/chat`);
                  }}
                />
              </Tooltip>
            </div>
          </>
        ) : (
          <>
            <div className={styles.title}>{`${job.name} - ${stateText()}`}</div>
            <div className={styles.right}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ whiteSpace: "nowrap" }}>
                  STEP {stateIndex() + 1} OF 3
                </div>
                <Step stepCount={3} currentIndex={stateIndex()} width={80} />
              </div>
            </div>
          </>
        )}
      </div>
      <div className={styles.body}>
        {jobState === "jrd" && (
          <ChatRoomNew
            chatType="jobRequirementDoc"
            jobId={job.id}
            onNextTask={() => setJobState("jd")}
          />
        )}
        {jobState === "jd" && (
          <ChatRoomNew
            chatType="jobDescription"
            jobId={job.id}
            onNextTask={() => setJobState("preview")}
          />
        )}
        {jobState === "preview" && (
          <div
            style={{
              flex: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <iframe
              src={`/jobs/${job.id}/chat?preview=1`}
              style={{
                border: "1px solid #eee",
                flex: "auto",
                width: "100%",
              }}
            />
            <div>{t("post_job")}</div>
          </div>
        )}
        {/* {jobState === "board" && (
          <>
            <div className={styles.block}>
              {VionaAvatarDiv}
              <div>{t("complete_conversation_tasks")}</div>
              <div className={styles.buttonContainer}>
                <Badge
                  dot={
                    !!job.requirement_doc_id &&
                    !checkJobDotStatus(job.id, "job_description_doc")
                  }
                >
                  <Button
                    // disabled={!job.requirement_doc_id}
                    onClick={() => {
                      setJobDotStatus(job.id, "job_description_doc");
                      navigate(`/app/jobs/${job.id}/document/job-requirement`);
                    }}
                    size="large"
                  >
                    {t("job_requirement_table")}
                  </Button>
                </Badge>
                <Badge
                  dot={
                    !!job.jd_doc_id &&
                    !checkJobDotStatus(job.id, "job_description_doc")
                  }
                >
                  <Button
                    // disabled={!job.jd_doc_id}
                    onClick={() => {
                      setJobDotStatus(job.id, "job_description_doc");
                      navigate(`/app/jobs/${job.id}/document/job-description`);
                    }}
                    size="large"
                  >
                    {t("job_description_jd")}
                  </Button>
                </Badge>
                <Badge
                  dot={
                    !!job.compensation_details_doc_id &&
                    !checkJobDotStatus(job.id, "job_compensation_details_doc")
                  }
                >
                  <Button
                    // disabled={!job.jd_doc_id}
                    onClick={() => {
                      setJobDotStatus(job.id, "job_compensation_details_doc");
                      navigate(
                        `/app/jobs/${job.id}/document/job-compensation-details`
                      );
                    }}
                    size="large"
                  >
                    {t("job_compensation_details")}
                  </Button>
                </Badge>
                <Badge
                  dot={
                    !!job.compensation_details_doc_id &&
                    !checkJobDotStatus(job.id, "job_outreach_message_doc")
                  }
                >
                  <Button
                    // disabled={!job.jd_doc_id}
                    onClick={() => {
                      setJobDotStatus(job.id, "job_outreach_message_doc");
                      navigate(
                        `/app/jobs/${job.id}/document/job-outreach-message`
                      );
                    }}
                    size="large"
                  >
                    {t("job_outreach_message")}
                  </Button>
                </Badge>
                <Badge
                  dot={
                    !!job.interview_plan_doc_id &&
                    !checkJobDotStatus(job.id, "job_interview_plan_doc")
                  }
                >
                  <Button
                    // disabled={!job.interview_plan_doc_id}
                    onClick={() => {
                      setJobDotStatus(job.id, "job_interview_plan_doc");
                      navigate(
                        `/app/jobs/${job.id}/document/job-interview-plan`
                      );
                    }}
                    size="large"
                  >
                    {t("interview_plan_scorecard")}
                  </Button>
                </Badge>
              </div>
            </div>

            <div className={styles.block}></div>
          </>
        )} */}
      </div>
    </div>
  );
};

export default JobBoard;
