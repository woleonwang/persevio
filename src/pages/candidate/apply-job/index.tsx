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
    init();
  }, []);

  const init = async () => {
    try {
      const { code, data: data1 } = await Get(`/api/candidate/settings`);
      if (code === 0) {
        const preRegisterInfo: IPreRegisterInfo = JSON.parse(
          data1.candidate.pre_register_info ?? "{}"
        );
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
      message.success("保存成功");
      localStorage.setItem("candidate_token", token);
      if (mode === "ai") {
        setJobApplyId(job_apply_id);
        setPageState("conversation");
      } else {
        setPageState("waiting");
      }
    } else {
      message.error("保存失败");
    }
    setIsSubmitting(false);
  };

  if (!jobId) {
    return <div>申请职位不存在</div>;
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
                <div className={styles.stepContainer}>
                  {new Array(2).fill(0).map((_, index) => {
                    return (
                      <div
                        key={index}
                        className={classnames(styles.step, {
                          [styles.active]: index <= currentIndex,
                        })}
                      />
                    );
                  })}
                </div>

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
                  <div className={styles.title}>沟通偏好</div>
                  <div className={styles.hint}>
                    95%的职位申请可通过AI面试快速完成初步沟通，建议您优先尝试。
                  </div>
                  <div className={styles.modeContainer}>
                    <div
                      className={classnames(styles.modeItem, {
                        [styles.active]: mode === "ai",
                      })}
                      onClick={() => setMode("ai")}
                    >
                      <div className={styles.modeItemTitle}>
                        AI 轻松聊 <span>强烈推荐</span>
                      </div>
                      <ul className={styles.modeItemList}>
                        <li>
                          <b>高效直达</b>
                          ：无需协调时间，现在就能开始，沟通后，将优先推送给猎头和企业HR，
                          <b>最快24小时内获得反馈</b>，快人一步。
                        </li>
                        <li>
                          <b>公平公正</b>
                          ： AI将专注于您的技能和经验，确保不错过任何亮点，尽可能规避各类偏见。
                        </li>
                      </ul>
                    </div>
                    <div
                      className={classnames(styles.modeItem, {
                        [styles.active]: mode === "human",
                      })}
                      onClick={() => setMode("human")}
                    >
                      <div className={styles.modeItemTitle}>真人沟通</div>
                      <ul className={styles.modeItemList}>
                        <li>
                          <b>需要预约</b>
                          ： 我们的顾问将在 1-2个工作日内 与您联系安排时间（此流程可能会延长您的申请反馈周期）。
                        </li>
                        <li>
                          如果您有特别复杂的问题需要与猎头深入探讨，可以选择此方式。
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className={styles.footer}>
                    <div
                      className={styles.back}
                      onClick={() => setPageState("basic")}
                    >
                      {"< 上一步"}
                    </div>
                    <Button
                      type="primary"
                      onClick={() => onSubmitBasicInfo()}
                      size="large"
                      style={{ width: "200px" }}
                      loading={isSubmitting}
                    >
                      下一步
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
                />
              </div>
            );
          } else if (pageState === "waiting") {
            return <Waiting />;
          }
        })()}
      </div>
    </div>
  );
};

export default ApplyJob;
