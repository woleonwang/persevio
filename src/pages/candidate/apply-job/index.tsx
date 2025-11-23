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
import WhatsappIcon from "@/assets/icons/whatsapp";
import Whatsapp from "./components/Whatsapp";

type TPageState = "basic" | "resume" | "whatsapp" | "conversation" | "waiting";

const ApplyJob: React.FC = () => {
  const [pageState, setPageState] = useState<TPageState>();

  const [jobApply, setJobApply] = useState<IJobApply>();
  const [preRegisterInfo, setPreRegisterInfo] = useState<IPreRegisterInfo>({
    email: "",
    name: "",
    phone: "",
  });
  const [resumePath, setResumePath] = useState<string>("");
  const [whatsappContactNumber, setWhatsappContactNumber] = useState<{
    whatsappCountryCode: string;
    whatsappPhoneNumber: string;
  }>({
    whatsappCountryCode: "+65",
    whatsappPhoneNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState<string>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

      const preRegisterInfo: IPreRegisterInfo = parseJSON(
        data1.candidate.pre_register_info ?? "{}"
      );
      setPreRegisterInfo(preRegisterInfo);
      setResumePath(data1.candidate.resume_path ?? "");
      setWhatsappContactNumber({
        whatsappCountryCode: data1.candidate.whatsapp_country_code || "+65",
        whatsappPhoneNumber: data1.candidate.whatsapp_phone_number || "",
      });

      const jobApply = await fetchJobApply();
      if (jobApply) {
        setJobApply(jobApply);
        setIsLoggedIn(true);

        // 没上传简历
        if (!data1.candidate.resume_path) {
          setPageState("resume");
        } else if (
          jobApply.interview_mode === "whatsapp" &&
          (!data1.candidate.whatsapp_country_code ||
            !data1.candidate.whatsapp_phone_number)
        ) {
          setPageState("whatsapp");
        } else if (
          jobApply.interview_mode === "human" ||
          !!jobApply.interview_finished_at
        ) {
          setPageState("waiting");
        } else {
          setPageState("conversation");
        }
      } else {
        // 申请其它职位，暂不考虑
        setPageState("basic");
      }
    } catch {
      setPageState("basic");
    }
  };

  const fetchJobApply = async (): Promise<IJobApply | undefined> => {
    const { code, data } = await Get(`/api/candidate/jobs/${jobId}/job_apply`);
    if (code === 0) {
      return data.job_apply as IJobApply;
    }
    return undefined;
  };

  const onSubmitBasicInfo = async (basicInfo: TBaiscInfo) => {
    setPreRegisterInfo({ ...preRegisterInfo, ...basicInfo });
    if (isLoggedIn) {
      const { code } = await Post(`/api/candidate/pre_register_info`, {
        ...basicInfo,
      });

      if (code === 0) {
        message.success("Update successful");
        setPageState("resume");
      } else {
        message.error("Update failed");
      }
    } else {
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
        const { token } = data;
        message.success("Save successful");
        localStorage.setItem("candidate_token", token);
        const jobApply = await fetchJobApply();
        if (jobApply) {
          setJobApply(jobApply);
          setPageState("resume");
        } else {
          message.error("Create job apply failed");
        }
      } else {
        message.error("Save failed");
      }
    }
  };

  const onChooseInterviewMode = async (interviewMode: "ai" | "human") => {
    const { code } = await Post(
      `/api/candidate/job_applies/${jobApply?.id}/interview_mode`,
      {
        mode: interviewMode,
      }
    );
    if (code === 0) {
      const newJobApply = await fetchJobApply();
      if (newJobApply) {
        setJobApply(newJobApply);
      }
      if (interviewMode === "ai") {
        setPageState("conversation");
      } else {
        setPageState("waiting");
      }
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
      setPageState("whatsapp");
    } else {
      message.error("Save failed");
    }
    setIsSubmitting(false);
  };

  const onSubmitWhatsapp = async (whatsappContactNumber: {
    whatsappCountryCode: string;
    whatsappPhoneNumber: string;
  }) => {
    const { code } = await Post(`/api/candidate/whatsapp_contact_number`, {
      whatsapp_country_code: whatsappContactNumber.whatsappCountryCode,
      whatsapp_phone_number: whatsappContactNumber.whatsappPhoneNumber,
    });
    if (code === 0) {
      message.success("Save successful");
      setWhatsappContactNumber({
        whatsappCountryCode: whatsappContactNumber.whatsappCountryCode,
        whatsappPhoneNumber: whatsappContactNumber.whatsappPhoneNumber,
      });
      setPageState("conversation");
    }
  };

  const switchModeToHuman = async () => {
    const { code } = await Post(
      `/api/candidate/job_applies/${jobApply?.id}/interview_mode`,
      {
        mode: "human",
        reasons: selectedReasons,
        other_reason: selectedReasons.includes("others")
          ? otherReason
          : undefined,
      }
    );
    if (code === 0) {
      const newJobApply = await fetchJobApply();
      if (newJobApply) {
        setJobApply(newJobApply);
      }

      message.success("Switch mode to human successful");
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

  const currentIndex =
    pageState === "basic" ? 0 : pageState === "resume" ? 1 : 2;

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
          {(pageState === "basic" ||
            pageState === "resume" ||
            pageState === "whatsapp") && (
            <Step
              stepCount={3}
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
          if (
            pageState === "basic" ||
            pageState === "resume" ||
            pageState === "whatsapp"
          ) {
            return (
              <>
                <Step
                  stepCount={3}
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
                      initValues={preRegisterInfo}
                    />
                  )}
                  {pageState === "resume" && (
                    <UploadResume
                      initialResumePath={resumePath}
                      isSubmitting={isSubmitting}
                      onFinish={(newResumePath) => {
                        if (newResumePath !== resumePath) {
                          onSubmitResume(newResumePath);
                        } else {
                          setPageState("whatsapp");
                        }
                      }}
                      onBack={() => {
                        setPageState("basic");
                      }}
                    />
                  )}
                  {pageState === "whatsapp" && (
                    <Whatsapp
                      whatsappContactNumber={whatsappContactNumber}
                      onFinish={(whatsappContactNumber) => {
                        onSubmitWhatsapp(whatsappContactNumber);
                      }}
                      onBack={() => {
                        setPageState("resume");
                      }}
                      onChooseInterviewMode={onChooseInterviewMode}
                    />
                  )}
                </div>
              </>
            );
          } else if (pageState === "conversation") {
            return (
              <div className={styles.conversation}>
                {jobApply?.interview_mode === "ai" ? (
                  <CandidateChat
                    chatType="job_interview"
                    jobApplyId={jobApply?.id}
                    onFinish={() => {
                      setPageState("waiting");
                    }}
                  />
                ) : (
                  <div className={styles.whatsappContainer}>
                    <div className={styles.whatsappIcon}>
                      <Icon icon={<WhatsappIcon />} style={{ fontSize: 90 }} />
                    </div>
                    <div>请去Whatsapp内与您的专属顾问进行交流</div>
                  </div>
                )}
              </div>
            );
          } else if (pageState === "waiting") {
            return <Waiting mode={jobApply?.interview_mode ?? "ai"} />;
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
