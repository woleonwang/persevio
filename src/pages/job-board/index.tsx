import useJob from "@/hooks/useJob";
import { Avatar, Badge, Button, message, Spin, Upload } from "antd";
import VionaAvatar from "@/assets/viona-avatar.png";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Get, Post, PostFormData } from "@/utils/request";
import { useNavigate } from "react-router";
import { checkJobDotStatus, setJobDotStatus } from "@/utils";

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
      !!job.requirement_doc_id,
      !!job.jd_doc_id,
      !!job.interview_plan_doc_id,
    ].filter(Boolean).length + 2;

  const VionaAvatarDiv = (
    <div>
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

        const { code: code2 } = await Post(`/api/jobs/${job.id}/talents`, {
          resume: data.resume,
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
      <Button type="primary" loading={isUploading} disabled={isUploading}>
        {originalT("上传简历")}
      </Button>
    </Upload>
  );

  return (
    <div>
      <div>{job.name}</div>
      <div>
        <div>
          {VionaAvatarDiv}
          <div>{originalT(`您还有${unfinishedCount}项任务要完成`)}</div>
          <div>
            <Badge dot={!checkJobDotStatus(job.id, "job_requirement_chat")}>
              <Button
                onClick={() => {
                  setJobDotStatus(job.id, "job_requirement_chat");
                  navigate(`/app/jobs/${job.id}/chat/job-requirement`);
                }}
              >
                详细定义职位需求
              </Button>
            </Badge>
            <Badge dot={!checkJobDotStatus(job.id, "job_description_chat")}>
              <Button
                disabled={!job.requirement_doc_id}
                onClick={() => {
                  setJobDotStatus(job.id, "job_description_chat");
                  navigate(`/app/jobs/${job.id}/chat/job-description`);
                }}
              >
                确定职位描述(JD)
              </Button>
            </Badge>
            <Badge dot={!checkJobDotStatus(job.id, "job_interview_plan_chat")}>
              <Button
                disabled={!job.requirement_doc_id}
                onClick={() => {
                  setJobDotStatus(job.id, "job_interview_plan_chat");
                  navigate(`/app/jobs/${job.id}/chat/job-interview-plan`);
                }}
              >
                制定面试计划&评分卡
              </Button>
            </Badge>
            <Button disabled={!job.interview_plan_doc_id}>
              推荐候选人面试问题
            </Button>
            <Button disabled={!job.interview_plan_doc_id}>
              填写候选人评分卡
            </Button>
          </div>
        </div>

        <div>
          {VionaAvatarDiv}
          <div>
            {originalT(`与 Viona 完成对话任务，以下是为您生成的详细文档：`)}
          </div>
          <div>
            <Badge dot={!checkJobDotStatus(job.id, "job_description_doc")}>
              <Button
                disabled={!job.requirement_doc_id}
                onClick={() => {
                  setJobDotStatus(job.id, "job_description_doc");
                  navigate(`/app/jobs/${job.id}/document/job-requirement`);
                }}
              >
                职位需求表
              </Button>
            </Badge>
            <Badge dot={!checkJobDotStatus(job.id, "job_description_doc")}>
              <Button
                disabled={!job.jd_doc_id}
                onClick={() => {
                  setJobDotStatus(job.id, "job_description_doc");
                  navigate(`/app/jobs/${job.id}/document/job-description`);
                }}
              >
                职位描述(JD)
              </Button>
            </Badge>
            <Badge dot={!checkJobDotStatus(job.id, "job_interview_plan_doc")}>
              <Button
                disabled={!job.interview_plan_doc_id}
                onClick={() => {
                  setJobDotStatus(job.id, "job_interview_plan_doc");
                  navigate(`/app/jobs/${job.id}/document/job-interview-plan`);
                }}
              >
                面试计划&评分卡
              </Button>
            </Badge>
          </div>
        </div>

        <div>
          {VionaAvatarDiv}
          {talents.length === 0 ? (
            <div>
              <div>
                {originalT(
                  "您现在还没有候选人，可以告诉我候选人信息，我们一起制定面试计划或者填写评分卡！"
                )}
              </div>
              <div>{UploadResumeButton}</div>
            </div>
          ) : (
            <div>
              <div>
                {originalT(
                  "以下是您的候选人，可以制定面试计划或者填写评分卡！也可以与Viona对话新增新的候选人。"
                )}
                <div>
                  {UploadResumeButton}
                  {talents.map((talent) => {
                    return (
                      <div key={talent.id}>
                        <Button
                          type="default"
                          onClick={() => {
                            navigate(
                              `/app/jobs/${job.id}/talents/${talent.id}/chat`
                            );
                          }}
                        >
                          {talent.name}
                        </Button>
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
