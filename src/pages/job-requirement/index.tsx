import { useEffect, useRef, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import { Button, Form, Input, Modal, Spin } from "antd";
import { useTranslation } from "react-i18next";

import { Get, Post } from "../../utils/request";
import ChatRoom from "../../components/ChatRoom";

import styles from "./style.module.less";

export type TTrialUser = {
  id: number;
  company_id: number;
  uuid: string;
  name: string;
  job_title: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
};

type TStatus = "init" | "register" | "create_job" | "talk";
const JobRequirement = () => {
  const [trialUser, setTrialUser] = useState<TTrialUser>();
  const [status, setStatus] = useState<TStatus>("init");
  const [jobId, setJobId] = useState<number>();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const [form] = Form.useForm();
  const [createJobform] = Form.useForm();

  const isSubmittingRef = useRef(false);

  const { t: originalT } = useTranslation();

  const t = (key: string) => {
    return originalT(`job_requirement.${key}`);
  };

  useEffect(() => {
    initTrialUser();
  }, []);

  const initTrialUser = async () => {
    const uuid = localStorage.getItem("trial_user_uuid");
    if (!uuid) {
      localStorage.setItem("trial_user_uuid", uuidV4());
    }

    const { code, data } = await Get("/api/trial_user/info");
    if (code === 0) {
      setTrialUser(data?.trial_user);
    }
  };

  const registerTrialUser = () => {
    form.validateFields().then(async (values) => {
      const { code, data } = await Post("/api/trial_user/create", {
        ...values,
      });

      if (code === 0) {
        setTrialUser(data.trial_user);
        setStatus("create_job");
      }
    });
  };

  const createJob = () => {
    createJobform.validateFields().then(async (values) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      const { code, data } = await Post("/api/trial_user/jobs", {
        ...values,
      });

      if (code === 0) {
        setJobId(data.job_id);
        setStatus("talk");
      }

      isSubmittingRef.current = false;
    });
  };

  if (status === "init") {
    return (
      <div className={styles.container} style={{ width: 400 }}>
        <div className={styles.flexLayout}>
          <div>Introduce Viona blablabla...</div>
          <Button
            type="primary"
            onClick={() => setStatus(trialUser ? "create_job" : "register")}
            style={{ marginTop: 40 }}
          >
            Chat with Viona
          </Button>
        </div>
      </div>
    );
  }

  if (status === "register") {
    return (
      <div className={styles.container} style={{ width: 600 }}>
        <Form form={form} layout="vertical">
          {["name", "company_name", "job_title", "email", "phone"].map(
            (key) => (
              <Form.Item
                key={key}
                label={t(key)}
                name={key}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            )
          )}
          <Button type="primary" onClick={registerTrialUser}>
            {originalT("submit")}
          </Button>
        </Form>
      </div>
    );
  }

  if (status === "create_job") {
    return (
      <div className={styles.container} style={{ width: 600 }}>
        <Form form={createJobform}>
          <Form.Item
            label={t("job_name")}
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Button
            type="primary"
            onClick={createJob}
            style={{ marginTop: 24 }}
            disabled={isSubmittingRef.current}
          >
            {originalT("submit")}
          </Button>
        </Form>
      </div>
    );
  }

  if (jobId) {
    return (
      <div
        className={styles.container}
        style={{ width: 1200, display: "flex" }}
      >
        <ChatRoom
          jobId={jobId}
          userRole="trial_user"
          onNextTask={() => setRegisterModalOpen(true)}
        />
        <Modal
          open={registerModalOpen}
          onCancel={() => setRegisterModalOpen(false)}
          title={"Sign Up Now!"}
          onOk={() => window.open("/signup?from=trial")}
        >
          <div>
            Sign up now to access the Job Requirement Document, plus a
            ready-to-use JD, social media post, and outreach message Viona
            created specifically for your role!
          </div>
        </Modal>
      </div>
    );
  }

  return <Spin spinning />;
};

export default JobRequirement;
