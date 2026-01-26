import React, { useEffect, useState } from "react";
import { Button, message, Tooltip } from "antd";
import classnames from "classnames";
import { useNavigate } from "react-router";

import { Get, Post } from "@/utils/request";
import Step from "@/components/Step";
import { copy, deleteQuery, getQuery, isTempAccount, parseJSON } from "@/utils";
import { tokenStorage, storage, StorageKey } from "@/utils/storage";
import Icon from "@/components/Icon";
import logo from "@/assets/logo.png";
import Copy from "@/assets/icons/copy";

import BasicInfo from "./components/BasicInfo";
import UploadResume from "./components/UploadResume";
import Binding from "./components/Binding";
import Whatsapp from "./components/Whatsapp";

import styles from "./style.module.less";

type TPageState = "basic" | "resume" | "binding" | "whatsapp";

const Signup: React.FC = () => {
  const [pageState, setPageState] = useState<TPageState>();

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
  const [jobId, setJobId] = useState<number>(0);

  const navigate = useNavigate();

  useEffect(() => {
    const error = getQuery("error");
    const code = getQuery("code");
    if (error === "google_login_failed" && code === "10003") {
      message.error("The email is already exists");
    }

    const token = getQuery("candidate_token");
    if (token) {
      tokenStorage.setToken(token, "candidate");
      deleteQuery("candidate_token");
    }
    init();
  }, []);

  const init = async () => {
    const { code: code1, data: data1 } = await Get(`/api/candidate/settings`);
    // 没注册
    if (code1 !== 0) {
      setPageState("basic");
      return;
    }

    const candidate: ICandidateSettings = data1.candidate;
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
    setIsLoggedIn(true);
    setJobId(candidate.job_id ?? 0);

    // 如果没简历，跳到 resume
    // 如果没绑定邮箱，跳到 binding
    // 如果没确认 WA，跳到 whatsapp
    // 否则跳到 dashboarr
    if (!candidate.resume_path) {
      setPageState("resume");
    } else if (isTempAccount(candidate)) {
      setPageState("binding");
    } else if (
      !candidate.whatsapp_country_code ||
      !candidate.whatsapp_phone_number
    ) {
      setPageState("whatsapp");
    } else if (candidate.job_id) {
      const jobApply = await fetchJobApply(candidate.job_id);
      if (jobApply) {
        navigate(`/candidate/jobs/applies/${jobApply.id}`, {
          replace: true,
        });
      } else {
        navigate("/candidate/jobs", { replace: true });
      }
    } else {
      navigate("/candidate/jobs", { replace: true });
    }
  };

  const fetchJobApply = async (
    jobId: number
  ): Promise<IJobApply | undefined> => {
    if (!jobId) {
      return undefined;
    }

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
      let params: Record<string, unknown> = {
        ...basicInfo,
      };

      const jobIdStr: string = getQuery("job_id");
      const jobId = parseInt(jobIdStr ?? "0");

      if (jobId) {
        const shareTokenMapping =
          storage.get<Record<string, string>>(StorageKey.SHARE_TOKEN, {}) || {};
        const shareToken = shareTokenMapping[jobId];
        const linkedinProfileId = storage.get<string>(
          StorageKey.LINKEDIN_PROFILE_ID
        );
        const sourceChannelMapping = storage.get<Record<string, string>>(
          StorageKey.SOURCE_CHANNEL,
          {}
        );
        const sourceChannel = sourceChannelMapping?.[jobId];
        params = {
          ...params,
          job_id: jobId,
          share_token: shareToken,
          linkedin_profile_id: linkedinProfileId
            ? parseInt(linkedinProfileId)
            : undefined,
          source_channel: sourceChannel,
        };
      }

      const { code, data } = await Post(`/api/candidate/register`, params);

      if (code === 0) {
        const { token } = data;
        message.success("Save successful");
        tokenStorage.setToken(token, "candidate");
        setPageState("resume");
      } else {
        message.error("Save failed");
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
      setPageState("binding");
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
      skip_send_whatsapp_message: true,
    });
    if (code === 0) {
      message.success("Save successful");
      redirectToDashboard();
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

  const redirectToDashboard = async () => {
    const jobApply = jobId ? await fetchJobApply(jobId) : undefined;
    if (jobApply) {
      navigate(`/candidate/jobs/applies/${jobApply.id}?open=1`, {
        replace: true,
      });
    } else {
      navigate("/candidate/profile", { replace: true });
    }
  };

  const currentIndex = ["basic", "resume", "binding", "whatsapp"].indexOf(
    pageState || "basic"
  );

  if (!pageState) {
    return null;
  }

  return (
    <div className={classnames(styles.container, styles.mobile)}>
      <div className={classnames(styles.header)}>
        <img
          src={logo}
          className={styles.banner}
          onClick={() => navigate("/")}
        />
        <div className={classnames(styles.headerRight, styles.desktopVisible)}>
          <Tooltip title="You can copy the current chat link and open it in a browser on another device to continue this process.">
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
          <Step
            stepCount={4}
            currentIndex={currentIndex}
            className={styles.stepContainer}
          />

          <Button
            icon={<Icon icon={<Copy />} className={styles.icon} />}
            className={styles.button}
            onClick={copyLink}
          />
        </div>
      </div>
      <div className={styles.main}>
        <Step
          stepCount={4}
          currentIndex={currentIndex}
          className={classnames(styles.stepContainer, styles.desktopVisible)}
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
                  setPageState("binding");
                }
              }}
              onBack={() => {
                setPageState("basic");
              }}
            />
          )}
          {pageState === "binding" && <Binding />}
          {pageState === "whatsapp" && (
            <Whatsapp
              whatsappContactNumber={whatsappContactNumber}
              onFinish={(whatsappContactNumber) => {
                onSubmitWhatsapp(whatsappContactNumber);
              }}
              onSkip={() => {
                redirectToDashboard();
              }}
              isSubmitting={isSubmittingWhatsapp}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
