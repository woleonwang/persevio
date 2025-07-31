import { Avatar, Badge, Button, message, Spin, Upload } from "antd";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  CloseCircleOutlined,
  EyeOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";

import { checkJobDotStatus, copy, setJobDotStatus } from "@/utils";
import useJob from "@/hooks/useJob";
import { Get, Post, PostFormData } from "@/utils/request";

import VionaAvatar from "@/assets/viona-avatar.png";
import styles from "./style.module.less";

const JobBoard = () => {
  const { job } = useJob();

  const { t: originalT } = useTranslation();
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
          message.error(originalT("解析简历失败"));
          setIsUploading(false);
          return;
        }

        const { talent_name: talentName, resume } = data;
        const { code: code3, data: data3 } = await Get(
          `/api/jobs/${job.id}/talents/check_name?name=${talentName}`
        );
        if (code3 !== 0) {
          message.error("Upload failed");
          setIsUploading(false);
          return;
        }

        if (
          data3.is_exists &&
          !confirm(`已存在候选人${talentName}，请确认是否继续上传`)
        ) {
          setIsUploading(false);
          return;
        }

        const { code: code2 } = await Post(`/api/jobs/${job.id}/talents`, {
          resume: resume,
          name: talentName,
        });
        if (code2 === 0) {
          message.success(originalT("create_succeed"));
          await fetchTalents();
        } else {
          message.error(originalT("submit_failed"));
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
        {originalT("上传简历")}
      </Button>
    </Upload>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {job.name}
        <div className={styles.share}>
          <EyeOutlined
            disabled={!job.jd_doc_id}
            onClick={async () => {
              await copy(`${window.origin}/jobs/${job.id}/chat`);
              message.success("链接已复制");
            }}
          />
          <ShareAltOutlined
            onClick={async () => {
              await copy(
                `${window.origin}/app/jobs/${
                  job.id
                }/board?token=${localStorage.getItem("token")}&share=1`
              );
              message.success("链接已复制");
            }}
          />
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.block}>
          {VionaAvatarDiv}
          <div>{originalT(`您还有${unfinishedCount}项任务要完成`)}</div>
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
                详细定义职位需求
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
                确定职位描述(JD)
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
                制定面试计划&评分卡
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
              推荐候选人面试问题
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
              填写候选人评分卡
            </Button>
          </div>
        </div>

        <div className={styles.block}>
          {VionaAvatarDiv}
          <div>
            {originalT(`与 Viona 完成对话任务，以下是为您生成的详细文档：`)}
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
                职位需求表
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
                职位描述(JD)
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
                面试计划&评分卡
              </Button>
            </Badge>
          </div>
        </div>

        <div className={styles.block}>
          {VionaAvatarDiv}
          {talents.length === 0 ? (
            <div>
              <div>
                {originalT(
                  "您现在还没有候选人，可以告诉我候选人信息，我们一起制定面试计划或者填写评分卡！"
                )}
              </div>
              <div className={styles.buttonContainer}>{UploadResumeButton}</div>
            </div>
          ) : (
            <div>
              <div>
                {originalT(
                  "以下是您的候选人，可以制定面试计划或者填写评分卡！也可以与Viona对话新增新的候选人。"
                )}
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
                                `请确认是否删除 ${talent.name} ，删除后原有内容无法恢复?`
                              )
                            ) {
                              const { code } = await Post(
                                `/api/jobs/${job.id}/talents/${talent.id}/destroy`
                              );

                              if (code === 0) {
                                message.success("删除成功");
                                fetchTalents();
                              } else {
                                message.error("删除失败");
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
