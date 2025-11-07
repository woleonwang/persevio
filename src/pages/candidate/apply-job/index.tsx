import React, { useEffect, useState } from "react";
import { message } from "antd";
import classnames from "classnames";
import { useNavigate, useParams } from "react-router";

import CandidateChat from "@/components/CandidateChat";
import BasicInfo, { TBaiscInfo } from "./components/BasicInfo";
import Waiting from "./components/Waiting";

import logo from "@/assets/logo.png";
import styles from "./style.module.less";
import { Get, Post } from "@/utils/request";
import Step from "@/components/Step";
import { getQuery } from "@/utils";
import UploadResume from "./components/UploadResume";

type TPageState = "basic" | "resume" | "conversation" | "waiting";

const ApplyJob: React.FC = () => {
  const [pageState, setPageState] = useState<TPageState>();

  const [jobApplyId, setJobApplyId] = useState<number>();
  const [mode, setMode] = useState<"ai" | "human">("ai");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { jobId: jobIdStr } = useParams();
  const jobId = parseInt(jobIdStr ?? "0");

  const navigate = useNavigate();

  // const { t: originalT, i18n } = useTranslation();
  // const t = (key: string) => originalT(`apply_job.${key}`);

  useEffect(() => {
    const token = getQuery("candidate_token");
    if (token) {
      localStorage.setItem("candidate_token", token);
    }
    init();
  }, []);

  const init = async () => {
    try {
      const { code: code1, data: data1 } = await Get(`/api/candidate/settings`);
      // 没注册
      if (code1 !== 0) {
        setPageState("basic");
        return;
      }

      // 没上传简历
      if (!data1.candidate.resume_path) {
        setPageState("resume");
        return;
      }

      const preRegisterInfo: IPreRegisterInfo = JSON.parse(
        data1.candidate.pre_register_info ?? "{}"
      );
      setMode(preRegisterInfo.mode);

      const { code, data } = await Get(
        `/api/candidate/jobs/${jobId}/job_apply`
      );
      if (code === 0) {
        const jobApply: IJobApply = data.job_apply;
        setJobApplyId(jobApply.id);
        if (
          preRegisterInfo.mode === "human" ||
          !!jobApply.interview_finished_at
        ) {
          setPageState("waiting");
        } else {
          setPageState("conversation");
        }
      } else {
        localStorage.removeItem("candidate_token");
        setPageState("basic");
      }
    } catch {
      setPageState("basic");
    }
  };

  const onSubmitBasicInfo = async (basicInfo: TBaiscInfo) => {
    const params = {
      ...basicInfo,
      job_id: jobId,
    };
    const { code, data } = await Post(`/api/candidate/register`, params);

    if (code === 0) {
      const { job_apply_id, token } = data;
      message.success("Save successful");
      localStorage.setItem("candidate_token", token);
      setJobApplyId(job_apply_id);
      setPageState("resume");
    } else {
      message.error("Save failed");
    }
  };

  const onSubmitResume = async (resumePath: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const params = {
      resume_path: resumePath,
    };
    const { code } = await Post(`/api/candidate/resume`, params);

    if (code === 0) {
      message.success("Save successful");
      setPageState("conversation");
    } else {
      message.error("Save failed");
    }
    setIsSubmitting(false);
  };

  if (!jobId) {
    return <div>Apply job does not exist</div>;
  }

  return (
    <div className={classnames(styles.container, styles.mobile)}>
      <div className={styles.header}>
        <img
          src={logo}
          className={styles.banner}
          onClick={() => navigate("/")}
        />
      </div>
      <div className={styles.main}>
        {(() => {
          if (pageState === "basic" || pageState === "resume") {
            const currentIndex = pageState === "basic" ? 0 : 1;

            return (
              <>
                <Step
                  stepCount={2}
                  currentIndex={currentIndex}
                  className={styles.stepContainer}
                />

                <div
                  className={styles.body}
                  style={{ display: pageState === "basic" ? "block" : "none" }}
                >
                  <BasicInfo
                    onFinish={(params) => {
                      onSubmitBasicInfo(params);
                    }}
                  />
                </div>

                <div
                  className={styles.form}
                  style={{ display: pageState === "resume" ? "block" : "none" }}
                >
                  <UploadResume
                    isSubmitting={isSubmitting}
                    onFinish={(resumePath) => {
                      onSubmitResume(resumePath);
                    }}
                  />
                </div>
              </>
            );
          } else if (pageState === "conversation") {
            return (
              <div className={styles.conversation}>
                <CandidateChat
                  chatType="job_interview"
                  jobApplyId={jobApplyId}
                  onFinish={() => {
                    setPageState("waiting");
                  }}
                />
              </div>
            );
          } else if (pageState === "waiting") {
            return <Waiting mode={mode} />;
          }
        })()}
      </div>
    </div>
  );
};

export default ApplyJob;
