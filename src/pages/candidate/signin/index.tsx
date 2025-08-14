import React, { useEffect, useState } from "react";
import { message } from "antd";
import classnames from "classnames";
import { Get, Post } from "@/utils/request";

import CandidateChat from "@/components/CandidateChat";
import logo from "@/assets/logo.png";
import styles from "./style.module.less";
import UploadResume from "./components/UploadResume";
import OAuth from "./components/OAuth";
import { useNavigate } from "react-router";
import ConfirmPhone from "./components/ConfirmPhone";
import { useTranslation } from "react-i18next";

const CandidateSignIn: React.FC = () => {
  const [pageState, setPageState] = useState<
    "signin" | "upload" | "phone" | "conversation"
  >();

  const [jobId, setJobId] = useState<string>();
  const [candidate, setCandidate] = useState<ICandidateSettings>();

  const navigate = useNavigate();
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`candidate_sign.${key}`);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    const code = urlParams.get("code");
    if (error === "google_login_failed" && code === "10001") {
      message.error(t("email_exists"));
    }

    const tokenFromUrl = urlParams.get("token");
    if (tokenFromUrl) {
      urlParams.delete("token");
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${
          urlParams.toString() ? `?${urlParams.toString()}` : ""
        }`
      );

      localStorage.setItem("candidate_token", tokenFromUrl);
    }

    fetchProfile();

    const jobId = urlParams.get("job_id");
    if (jobId) {
      setJobId(jobId);
    }
  }, []);

  const fetchProfile = async () => {
    const { code, data } = await Get(`/api/candidate/settings`);
    if (code === 0) {
      const candidate: ICandidateSettings = data.candidate;
      setCandidate(candidate);

      if (candidate.status !== "extracted") {
        setPageState("upload");
      } else if (!candidate.phone_confirmed_at) {
        setPageState("phone");
      } else if (!candidate.interview_finished_at) {
        setPageState("conversation");
      } else {
        navigate("/candidate/job-applies");
      }
    } else {
      setPageState("signin");
    }
  };

  return (
    <div
      className={classnames(styles.container, {
        [styles.mobile]: pageState === "signin",
      })}
    >
      {pageState !== "signin" && (
        <>
          <div className={styles.header}>
            <img
              src={logo}
              className={styles.banner}
              onClick={async () => {
                const { code } = await Post("/api/candidate/clear");
                if (code === 0) {
                  localStorage.removeItem("candidate_token");
                  window.location.reload();
                }
              }}
            />
          </div>
        </>
      )}

      <div className={styles.main}>
        {pageState !== "signin" && (
          <div className={styles.stepWrapper}>
            <div className={classnames(styles.step, styles.active)}>
              {t("upload_resume")}
            </div>
            <div
              className={classnames(styles.step, {
                [styles.active]: pageState === "conversation",
              })}
            >
              {t("career_dive")}
            </div>
          </div>
        )}
        {(() => {
          if (pageState === "signin") {
            return <OAuth jobId={jobId} />;
          }

          if (pageState === "upload") {
            return (
              <UploadResume
                onFinish={() => {
                  setPageState("phone");
                }}
              />
            );
          }

          if (pageState === "phone") {
            return (
              <ConfirmPhone
                phone={candidate?.phone}
                name={candidate?.name}
                onFinish={() => setPageState("conversation")}
              />
            );
          }

          if (pageState === "conversation") {
            return (
              <div className={styles.chatWrapper}>
                <CandidateChat
                  chatType="profile"
                  onFinish={() => navigate("/candidate/job-applies?open=1")}
                />
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
};

export default CandidateSignIn;
