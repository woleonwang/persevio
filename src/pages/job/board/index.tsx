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
import { CloseCircleOutlined, ShareAltOutlined } from "@ant-design/icons";

import { checkJobDotStatus, copy, setJobDotStatus } from "@/utils";
import useJob from "@/hooks/useJob";
import { Get, Post, PostFormData } from "@/utils/request";

import VionaAvatar from "@/assets/viona-avatar.png";
import styles from "./style.module.less";

const JobBoard = () => {
  const { job, fetchJob } = useJob();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_board.${key}`);
  const navigate = useNavigate();

  const [talents, setTalents] = useState<TTalent[]>([]);

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (job) {
      fetchTalents();
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

  const unfinishedCount =
    [
      !job.requirement_doc_id,
      !job.jd_doc_id,
      !job.interview_plan_doc_id,
    ].filter(Boolean).length + 2;

  const VionaAvatarDiv = (
    <div className={styles.avatar}>
      <Avatar src={VionaAvatar} />
      <div>Viona</div>
    </div>
  );

  const UploadResumeButton = (
    <Upload
      beforeUpload={() => false}
      onChange={async (fileInfo) => {
        if (isUploading || !job) return;

        const formData = new FormData();
        formData.append("file", fileInfo.file as any);

        setIsUploading(true);
        const { code, data } = await PostFormData(
          `/api/jobs/${job.id}/upload_resume_for_interview_design`,
          formData
        );

        if (code !== 0) {
          message.error(t("parse_resume_failed"));
          setIsUploading(false);
          return;
        }

        const { talent_name: talentName, resume } = data;
        const { code: code3, data: data3 } = await Get(
          `/api/jobs/${job.id}/talents/check_name?name=${talentName}`
        );
        if (code3 !== 0) {
          message.error(t("upload_failed"));
          setIsUploading(false);
          return;
        }

        if (
          data3.is_exists &&
          !confirm(t("candidate_exists_confirm").replace("{{name}}", talentName))
        ) {
          setIsUploading(false);
          return;
        }

        const { code: code2 } = await Post(`/api/jobs/${job.id}/talents`, {
          resume: resume,
          name: talentName,
        });
        if (code2 === 0) {
          message.success(t("create_succeed"));
          await fetchTalents();
        } else {
          message.error(t("submit_failed"));
        }

        setIsUploading(false);
      }}
      showUploadList={false}
      accept=".docx,.doc,.pdf"
      multiple={false}
    >
      <Button
        type="primary"
        loading={isUploading}
        disabled={isUploading}
        size="large"
      >
        {t("upload_resume")}
      </Button>
    </Upload>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {job.name}
        <div className={styles.share}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: "normal",
                color: "#333333",
                marginRight: 8,
              }}
            >
              {t("publish_to_persevio")}
            </span>
            <Tooltip
              title={!job.jd_doc_id ? t("complete_jd_first") : undefined}
            >
              <Switch
                checked={!!job.posted_at}
                onChange={async (checked) => {
                  const { code } = await Post(`/api/jobs/${job.id}/post_job`, {
                    open: checked ? "1" : "0",
                  });
                  if (code === 0) {
                    message.success(t("operation_success"));
                    fetchJob();
                  }
                }}
                disabled={!job.jd_doc_id}
              />
            </Tooltip>
          </div>

          <ShareAltOutlined
            onClick={async () => {
              await copy(
                `${window.origin}/app/jobs/${
                  job.id
                }/board?token=${localStorage.getItem("token")}&share=1`
              );
              message.success(t("link_copied"));
            }}
          />
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.block}>
          {VionaAvatarDiv}
          <div>{t("unfinished_tasks").replace("{{count}}", unfinishedCount.toString())}</div>
          <div className={styles.buttonContainer}>
            <Badge
              dot={
                !checkJobDotStatus(job.id, "job_requirement_doc") &&
                !checkJobDotStatus(job.id, "job_requirement_chat")
              }
            >
              <Button
                onClick={() => {
                  setJobDotStatus(job.id, "job_requirement_chat");
                  navigate(`/app/jobs/${job.id}/chat/job-requirement`);
                }}
                size="large"
                {...(!!job.requirement_doc_id && {
                  color: "primary",
                  variant: "outlined",
                })}
              >
                {t("detailed_define_job_requirement")}
              </Button>
            </Badge>
            <Badge
              dot={
                !!job.requirement_doc_id &&
                !checkJobDotStatus(job.id, "job_description_doc") &&
                !checkJobDotStatus(job.id, "job_description_chat")
              }
            >
              <Button
                disabled={!job.requirement_doc_id}
                onClick={() => {
                  setJobDotStatus(job.id, "job_description_chat");
                  navigate(`/app/jobs/${job.id}/chat/job-description`);
                }}
                size="large"
                {...(!!job.jd_doc_id && {
                  color: "primary",
                  variant: "outlined",
                })}
              >
                {t("define_jd")}
              </Button>
            </Badge>
            <Badge
              dot={
                !!job.requirement_doc_id &&
                !checkJobDotStatus(job.id, "job_interview_plan_doc") &&
                !checkJobDotStatus(job.id, "job_interview_plan_chat")
              }
            >
              <Button
                disabled={!job.requirement_doc_id}
                onClick={() => {
                  setJobDotStatus(job.id, "job_interview_plan_chat");
                  navigate(`/app/jobs/${job.id}/chat/job-interview-plan`);
                }}
                size="large"
                {...(!!job.interview_plan_doc_id && {
                  color: "primary",
                  variant: "outlined",
                })}
              >
                {t("create_interview_plan")}
              </Button>
            </Badge>
            <Button
              disabled={!job.interview_plan_doc_id}
              onClick={() => {
                navigate(
                  `/app/jobs/${job.id}/talents/select/interview_designer`
                );
              }}
              size="large"
            >
              {t("recommend_candidate_questions")}
            </Button>
            <Button
              disabled={!job.interview_plan_doc_id}
              onClick={() => {
                navigate(
                  `/app/jobs/${job.id}/talents/select/interview_feedback`
                );
              }}
              size="large"
            >
              {t("fill_candidate_scorecard")}
            </Button>
          </div>
        </div>

        <div className={styles.block}>
          {VionaAvatarDiv}
          <div>
            {t("complete_conversation_tasks")}
          </div>
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
                !!job.interview_plan_doc_id &&
                !checkJobDotStatus(job.id, "job_interview_plan_doc")
              }
            >
              <Button
                // disabled={!job.interview_plan_doc_id}
                onClick={() => {
                  setJobDotStatus(job.id, "job_interview_plan_doc");
                  navigate(`/app/jobs/${job.id}/document/job-interview-plan`);
                }}
                size="large"
              >
                {t("interview_plan_scorecard")}
              </Button>
            </Badge>
          </div>
        </div>

        <div className={styles.block}>
          {VionaAvatarDiv}
          {talents.length === 0 ? (
            <div>
              <div>
                {t("no_candidates_yet")}
              </div>
              <div className={styles.buttonContainer}>{UploadResumeButton}</div>
            </div>
          ) : (
            <div>
              <div>
                {t("candidates_list")}
                <div className={styles.buttonContainer}>
                  {UploadResumeButton}
                  {talents.map((talent) => {
                    return (
                      <div key={talent.id} className={styles.talentButton}>
                        <Button
                          type="default"
                          onClick={() => {
                            navigate(
                              `/app/jobs/${job.id}/talents/${talent.id}/chat`
                            );
                          }}
                          size="large"
                        >
                          {talent.name}
                        </Button>
                        <CloseCircleOutlined
                          className={styles.talentDestroy}
                          onClick={async () => {
                            if (
                              confirm(
                                t("delete_confirm").replace("{{name}}", talent.name)
                              )
                            ) {
                              const { code } = await Post(
                                `/api/jobs/${job.id}/talents/${talent.id}/destroy`
                              );

                              if (code === 0) {
                                message.success(t("delete_success"));
                                fetchTalents();
                              } else {
                                message.error(t("delete_failed"));
                              }
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobBoard;
