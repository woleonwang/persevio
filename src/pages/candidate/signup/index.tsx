import React, { useEffect, useState } from "react";
import { Button, Form, Input, message, Steps, Upload } from "antd";
import { Get, Post, PostFormData } from "@/utils/request";
import { GoogleOutlined, LinkedinOutlined } from "@ant-design/icons";

import CandidateProfileChat from "@/components/CandidateProfileChat";
import logo from "@/assets/logo.png";
import styles from "./style.module.less";
// import { useNavigate } from "react-router";

const CandidateSignUp: React.FC = () => {
  const [pageState, setPageState] = useState<
    "upload" | "signin" | "phone" | "conversation" | "confirm"
  >("upload");
  const [fileId, setFileId] = useState<number>();
  const [jobId, setJobId] = useState<string>();
  const [_, setCandidate] = useState<ICandidateSettings>();

  const steps = ["upload", "signin", "phone", "conversation", "confirm"];

  const [form] = Form.useForm<{ phone: string }>();
  // const navigate = useNavigate();

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
      <div className={styles.header}>
        <img
          src={logo}
          className={styles.banner}
          onClick={() => {
            localStorage.removeItem("candidate_token");
            window.location.reload();
          }}
        />
        <div className={styles.steps}>
          <Steps
            current={steps.indexOf(pageState)}
            labelPlacement="vertical"
            items={steps.map(() => ({ disabled: true }))}
          />
        </div>
      </div>
      <div className={styles.main}>
        {(() => {
          if (pageState === "upload") {
            return (
              <div className={styles.uploadWrapper}>
                <div className={styles.title}>
                  Apply to unlock opportunities at top companies
                </div>
                <Upload
                  beforeUpload={() => false}
                  onChange={async (fileInfo) => {
                    const formData = new FormData();
                    formData.append("file", fileInfo.file as any);
                    const { code, data } = await PostFormData(
                      `/api/upload_files`,
                      formData
                    );
                    if (code === 0) {
                      setFileId(data.upload_file.id);
                      message.success("Upload succeed");
                      setPageState("signin");
                    } else {
                      message.error("Upload failed");
                    }
                  }}
                  showUploadList={false}
                  accept=".docx,.pdf"
                  multiple={false}
                >
                  <Button type="primary">Upload Resume</Button>
                </Upload>
              </div>
            );
          }

          if (pageState === "signin") {
            return (
              <div>
                <h2 style={{ fontSize: 36 }}>Candidate Sign in</h2>
                <div>
                  <Button
                    icon={<GoogleOutlined />}
                    shape="circle"
                    size="large"
                    onClick={() => {
                      window.location.href = `/api/auth/google/login?role=candidate&file_id=${fileId}&job_id=${jobId}`;
                    }}
                  />

                  <Button
                    icon={<LinkedinOutlined />}
                    shape="circle"
                    size="large"
                    onClick={() => {
                      window.location.href = `/api/auth/linkedin/login?role=candidate&file_id=${fileId}&job_id=${jobId}`;
                    }}
                  />
                </div>
              </div>
            );
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
                <CandidateProfileChat />
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
};

export default CandidateSignUp;
