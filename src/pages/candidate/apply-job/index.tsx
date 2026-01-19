import React, { useEffect, useState } from "react";
import { Button, message, Tooltip } from "antd";
import classnames from "classnames";
import { useNavigate, useParams } from "react-router";

import CandidateChat from "@/components/CandidateChat";
import BasicInfo from "./components/BasicInfo";
import Waiting from "./components/Waiting";

import logo from "@/assets/logo.png";
import styles from "./style.module.less";
import { Get, Post } from "@/utils/request";
import Step from "@/components/Step";
import { copy, deleteQuery, getQuery, parseJSON } from "@/utils";
import UploadResume from "./components/UploadResume";
import Copy from "@/assets/icons/copy";
import { tokenStorage, storage, StorageKey } from "@/utils/storage";
import Icon from "@/components/Icon";
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
    country_code: "+65",
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubmittingWhatsapp, setIsSubmittingWhatsapp] = useState(false);

  const { jobId: jobIdStr } = useParams();
  const jobId = parseInt(jobIdStr ?? "0");

  const navigate = useNavigate();

  // const { t: originalT } = useTranslation();
  // const t = (key: string) => originalT(`apply_job.${key}`);

  useEffect(() => {
    const token = getQuery("candidate_token");
    if (token) {
      tokenStorage.setToken(token, "candidate");
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
        whatsappCountryCode:
          data1.candidate.whatsapp_country_code ||
          preRegisterInfo.country_code ||
          "+65",
        whatsappPhoneNumber:
          data1.candidate.whatsapp_phone_number || preRegisterInfo.phone || "",
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
          const code = getQuery("code");
          if (code === "10003") {
            message.error("The email is already registered");
          }
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

  const onSubmitBasicInfo = async (basicInfo: IPreRegisterInfo) => {
    setPreRegisterInfo({ ...preRegisterInfo, ...basicInfo });
    setWhatsappContactNumber({
      whatsappCountryCode: basicInfo.country_code,
      whatsappPhoneNumber: basicInfo.phone,
    });
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
      const shareTokenMapping =
        storage.get<Record<string, string>>(StorageKey.SHARE_TOKEN, {}) || {};
      const shareToken = shareTokenMapping[jobId];
      const linkedinProfileId = storage.get<string>(
        StorageKey.LINKEDIN_PROFILE_ID
      );
      const sourceChannelMapping =
        storage.get<Record<string, string>>(StorageKey.SOURCE_CHANNEL, {}) ||
        {};
      const sourceChannel = sourceChannelMapping[jobId];

      const params = {
        ...basicInfo,
        job_id: jobId,
        share_token: shareToken,
        linkedin_profile_id: linkedinProfileId
          ? parseInt(linkedinProfileId)
          : undefined,
        source_channel: sourceChannel,
      };

      const { code, data } = await Post(`/api/candidate/register`, params);

      if (code === 0) {
        const { token } = data;
        message.success("Save successful");
        tokenStorage.setToken(token, "candidate");
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
        from: "web",
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
    setIsSubmittingWhatsapp(true);
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
    setIsSubmittingWhatsapp(false);
  };

  const copyLink = async () => {
    await copy(
      `${window.location.href}?candidate_token=${
        tokenStorage.getToken("candidate") || ""
      }`
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
                      isSubmitting={isSubmittingWhatsapp}
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
                    <div style={{ maxWidth: 800, padding: "0 20px" }}>
                      Thanks! Our AI recruiter <b>Viona</b> has just reached out
                      to you on WhatsApp (you’ll see the message from{" "}
                      <b>Viona by Persevio</b>).
                      <br />
                      <br />
                      When you have a moment, please reply to her there and
                      complete the discovery conversation with her. This helps
                      us prepare your application accurately before submitting
                      it to the employer.
                    </div>
                  </div>
                )}
              </div>
            );
          } else if (pageState === "waiting") {
            return <Waiting mode={jobApply?.interview_mode ?? "ai"} />;
          }
        })()}
      </div>
    </div>
  );
};

export default ApplyJob;
