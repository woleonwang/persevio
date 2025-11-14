import React, { useEffect, useState } from "react";
import { Button, Checkbox, Input, message, Modal, Tooltip } from "antd";
import classnames from "classnames";
import { useNavigate, useParams } from "react-router";

import CandidateChat from "@/components/CandidateChat";
import BasicInfo, { TBaiscInfo } from "./components/BasicInfo";
import Waiting from "./components/Waiting";

import logo from "@/assets/logo.png";
import styles from "./style.module.less";
import { Get, Post } from "@/utils/request";
import Step from "@/components/Step";
import { copy, deleteQuery, getQuery, parseJSON } from "@/utils";
import UploadResume from "./components/UploadResume";
import Copy from "@/assets/icons/copy";
import Icon from "@/components/Icon";
import Chat from "@/assets/icons/chat";

type TPageState = "basic" | "resume" | "conversation" | "waiting";

const ApplyJob: React.FC = () => {
  const [pageState, setPageState] = useState<TPageState>();

  const [jobApplyId, setJobApplyId] = useState<number>();
  const [mode, setMode] = useState<"ai" | "human">("ai");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState<string>();

  const { jobId: jobIdStr } = useParams();
  const jobId = parseInt(jobIdStr ?? "0");

  const navigate = useNavigate();

  // const { t: originalT } = useTranslation();
  // const t = (key: string) => originalT(`apply_job.${key}`);

  useEffect(() => {
    const token = getQuery("candidate_token");
    if (token) {
      localStorage.setItem("candidate_token", token);
      deleteQuery("candidate_token");
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
    const shareToken = parseJSON(localStorage.getItem("share_token") ?? "")[
      jobId
    ];
    const params = {
      ...basicInfo,
      job_id: jobId,
      share_token: shareToken,
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

  const switchModeToHuman = async () => {
    const { code } = await Post(`/api/candidate/conversation_mode`, {
      mode: "human",
      reasons: selectedReasons,
      other_reason: selectedReasons.includes("others")
        ? otherReason
        : undefined,
    });
    if (code === 0) {
      message.success("Switch mode to human successful");
      setMode("human");
      setPageState("waiting");
      setIsModalOpen(false);
    } else {
      message.error("Switch mode to human failed");
    }
  };

  const copyLink = async () => {
    await copy(
      `${window.location.href}?candidate_token=${localStorage.getItem(
        "candidate_token"
      )}`
    );
    message.success(
      "The link has been copied. Simply open it in a new device's browser to resume chatting."
    );
  };

  if (!jobId) {
    return <div>Apply job does not exist</div>;
  }

  const currentIndex = pageState === "basic" ? 0 : 1;

  return (
    <div className={classnames(styles.container, styles.mobile)}>
      <div
        className={classnames(styles.header, {
          [styles.mobileVisible]: pageState === "waiting",
        })}
      >
        <img
          src={logo}
          className={styles.banner}
          onClick={() => navigate("/")}
        />
        <div className={classnames(styles.headerRight, styles.desktopVisible)}>
          <Tooltip title="You can copy the current chat link and open it in a browser on another device to continue this conversation.">
            <div className={styles.buttonWrapper} onClick={copyLink}>
              <Button
                icon={<Icon icon={<Copy />} className={styles.icon} />}
                className={styles.button}
              />
              <span>Copy Link</span>
            </div>
          </Tooltip>

          {pageState === "conversation" && (
            <div
              className={styles.buttonWrapper}
              onClick={() => setIsModalOpen(true)}
            >
              <Button
                icon={<Icon icon={<Chat />} className={styles.icon} />}
                className={styles.button}
              />
              <span>
                Schedule <br />
                human recruiter
              </span>
            </div>
          )}
        </div>

        <div
          className={styles.mobileVisible}
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          {(pageState === "basic" || pageState === "resume") && (
            <Step
              stepCount={2}
              currentIndex={currentIndex}
              className={styles.stepContainer}
            />
          )}

          <Button
            icon={<Icon icon={<Copy />} className={styles.icon} />}
            className={styles.button}
            onClick={copyLink}
          />

          {pageState === "conversation" && (
            <Button
              icon={<Icon icon={<Chat />} className={styles.icon} />}
              className={styles.button}
              onClick={() => setIsModalOpen(true)}
            />
          )}
        </div>
      </div>
      <div className={styles.main}>
        {(() => {
          if (pageState === "basic" || pageState === "resume") {
            return (
              <>
                <Step
                  stepCount={2}
                  currentIndex={currentIndex}
                  className={classnames(
                    styles.stepContainer,
                    styles.desktopVisible
                  )}
                />

                <div className={styles.body}>
                  {pageState === "basic" && (
                    <BasicInfo
                      onFinish={(params) => {
                        onSubmitBasicInfo(params);
                      }}
                    />
                  )}
                  {pageState === "resume" && (
                    <UploadResume
                      isSubmitting={isSubmitting}
                      onFinish={(resumePath) => {
                        onSubmitResume(resumePath);
                      }}
                    />
                  )}
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

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        title="We have arranged a real recruitment staff for you."
        okText="Submit"
        okButtonProps={{
          disabled:
            selectedReasons.length === 0 ||
            (selectedReasons.includes("others") && !otherReason),
        }}
        onOk={() => {
          switchModeToHuman();
        }}
        centered
        width="auto"
        classNames={{
          wrapper: styles.modalWrapper,
          content: styles.modalContent,
        }}
      >
        <div className={styles.modalDescription}>
          May I briefly understand the reason why you hope to communicate with a
          real person? This can help us serve you better.
        </div>
        <div className={styles.form}>
          <Checkbox.Group value={selectedReasons} onChange={setSelectedReasons}>
            <Checkbox value="dissatisfied_with_my_answer">
              Dissatisfied with my answer
            </Checkbox>
            <Checkbox value="want_to_consult_more_complex_questions">
              Want to consult some more complex questions
            </Checkbox>
            <Checkbox value="want_to_chat_with_a_real_person">
              Just want to chat with a real person for more reassurance
            </Checkbox>
            <Checkbox value="others">Others</Checkbox>
          </Checkbox.Group>
          <div className={styles.otherReasonInput}>
            <Input.TextArea
              placeholder="Please enter other reasons"
              rows={4}
              disabled={!selectedReasons.includes("others")}
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApplyJob;
