import React, { useEffect, useState } from "react";
import { Button, message } from "antd";
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

const ApplyJob: React.FC = () => {
  const [pageState, setPageState] = useState<
    "basic" | "mode" | "conversation" | "waiting"
  >();

  const [basicInfo, setBasicInfo] = useState<TBaiscInfo>();
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
      const { code, data: data1 } = await Get(`/api/candidate/settings`);
      if (code === 0) {
        const preRegisterInfo: IPreRegisterInfo = JSON.parse(
          data1.candidate.pre_register_info ?? "{}"
        );
        setMode(preRegisterInfo.mode);
        const { code, data } = await Get(
          `/api/candidate/jobs/${jobId}/job_apply`
        );
        if (code === 0) {
          setPageState("waiting");
          return;
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
      } else {
        setPageState("basic");
      }
    } catch {
      setPageState("basic");
    }
  };

  const onSubmitBasicInfo = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const params = {
      ...basicInfo,
      mode,
      job_id: jobId,
    };
    const { code, data } = await Post(`/api/candidate/register`, params);

    if (code === 0) {
      const { job_apply_id, token } = data;
      message.success("Save successful");
      localStorage.setItem("candidate_token", token);
      if (mode === "ai") {
        setJobApplyId(job_apply_id);
        setPageState("conversation");
      } else {
        setPageState("waiting");
      }
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
          if (pageState === "basic" || pageState === "mode") {
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
                      setBasicInfo(params);
                      setPageState("mode");
                    }}
                  />
                </div>

                <div
                  className={styles.form}
                  style={{ display: pageState === "mode" ? "block" : "none" }}
                >
                  <div className={styles.title}>
                    Let's Chat and Prepare Your Application
                  </div>
                  <div className={styles.hint}>
                    Before we can submit your application, our consultant needs
                    to have a quick chat to learn more about your experience and
                    ensure we represent you in the best possible light to the
                    employer.
                  </div>
                  <div className={styles.modeContainer}>
                    <div
                      className={classnames(styles.modeItem, {
                        [styles.active]: mode === "ai",
                      })}
                      onClick={() => setMode("ai")}
                    >
                      <div className={styles.modeItemTitle}>
                        Instant chat with AI Recruiter
                      </div>
                      <ul className={styles.modeItemList}>
                        <li>
                          <b>Chat On Your Terms</b>:Complete your chat anytime,
                          anywhere. It's text-based, instant, and requires no
                          scheduling.
                        </li>
                        <li>
                          <b>Get Noticed Faster</b>: Your application gets
                          fast-tracked directly to the hiring team. We aim to
                          get you feedback in just 24 hours.
                        </li>
                        <li>
                          <b>Stay Informed</b>: Easily check your application's
                          progress 24/7 on your candidate dashboard.
                        </li>
                      </ul>
                    </div>
                    <div
                      className={classnames(styles.modeItem, {
                        [styles.active]: mode === "human",
                      })}
                      onClick={() => setMode("human")}
                    >
                      <div className={styles.modeItemTitle}>
                        Schedule a call with human recruiter
                      </div>
                      <ul className={styles.modeItemList}>
                        <li>Our human recruiter will get in touch with you.</li>
                      </ul>
                    </div>
                  </div>

                  <div className={styles.footer}>
                    <div
                      className={styles.back}
                      onClick={() => setPageState("basic")}
                    >
                      {"< Back"}
                    </div>
                    <Button
                      type="primary"
                      onClick={() => onSubmitBasicInfo()}
                      size="large"
                      style={{ width: "200px" }}
                      loading={isSubmitting}
                    >
                      Next
                    </Button>
                  </div>
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
