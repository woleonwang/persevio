import React, { useEffect, useState } from "react";
import { Button, Form, Input, message } from "antd";
import { Get, Post } from "@/utils/request";

import CandidateChat from "@/components/CandidateChat";
import logo from "@/assets/logo.png";
import styles from "./style.module.less";
import BasicInfo from "./components/BasicInfo";
import OAuth from "./components/OAuth";
import { useNavigate } from "react-router";

// import { useNavigate } from "react-router";

const CandidateSignUp: React.FC = () => {
  const [pageState, setPageState] = useState<
    "upload" | "signin" | "phone" | "conversation"
  >("upload");
  console.log(pageState);
  const [fileId, setFileId] = useState<number>();
  const [jobId, setJobId] = useState<string>();
  const [_, setCandidate] = useState<ICandidateSettings>();

  const [form] = Form.useForm<{ phone: string }>();
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
      form.setFieldsValue({
        phone: candidate.phone,
      });

      if (!candidate.phone_confirmed_at) {
        setPageState("phone");
      } else {
        setPageState("conversation");
      }
    }
  };

  const confirmPhone = async () => {
    form.validateFields().then(async (values) => {
      const { code } = await Post(`/api/candidate/confirm_phone`, {
        phone: values.phone,
      });
      if (code === 0) {
        setPageState("conversation");
      }
    });
  };

  return (
    <div className={styles.container}>
      {pageState !== "signin" && (
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
      )}

      <div className={styles.main}>
        {(() => {
          if (pageState === "upload") {
            return (
              <BasicInfo
                state="upload"
                onUpload={(fileId) => {
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
              <Form form={form}>
                <Form.Item
                  label="Phone"
                  name="phone"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Button onClick={() => confirmPhone()}>Next</Button>
              </Form>
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
