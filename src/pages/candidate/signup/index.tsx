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

const CandidateSignUp: React.FC = () => {
  const [pageState, setPageState] = useState<
    "upload" | "signin" | "phone" | "conversation"
  >("signin");

  const [fileId, setFileId] = useState<number>(30);
  const [jobId, setJobId] = useState<string>();
  const [candidate, setCandidate] = useState<ICandidateSettings>();

  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    const code = urlParams.get("code");
    if (error === "google_login_failed" && code === "100001") {
      message.error("Email exists");
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

    if (localStorage.getItem("candidate_token")) {
      fetchProfile();
    }

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

      if (!candidate.phone_confirmed_at) {
        setPageState("phone");
      } else {
        setPageState("conversation");
      }
    }
  };

  return (
    <div className={styles.container}>
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
              Upload resume
            </div>
            <div
              className={classnames(styles.step, {
                [styles.active]: pageState === "conversation",
              })}
            >
              Career Deep Dive
            </div>
          </div>
        )}
        {(() => {
          if (pageState === "upload") {
            return (
              <UploadResume
                onFinish={(fileId) => {
                  setFileId(fileId);
                  setPageState("signin");
                }}
              />
            );
          }

          if (pageState === "signin" && fileId) {
            return <OAuth fileId={fileId} jobId={jobId} />;
          }

          if (pageState === "phone") {
            return (
              <ConfirmPhone
                phone={candidate?.phone}
                onFinish={() => setPageState("conversation")}
              />
            );
          }

          if (pageState === "conversation") {
            return (
              <div className={styles.chatWrapper}>
                <CandidateChat
                  chatType="profile"
                  onFinish={() => navigate("/candidate/resume")}
                />
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
};

export default CandidateSignUp;
