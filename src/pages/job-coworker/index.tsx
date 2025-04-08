import { useEffect, useRef, useState } from "react";
import { Button, Form, Input, Tabs } from "antd";
import { useParams } from "react-router";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import ChatRoom from "../../components/ChatRoom";
import JobInformation, { TJobDocType } from "../../components/JobInformation";
import { Get, Post } from "../../utils/request";
import globalStore from "../../store/global";
import { TTabKey } from "../job";

import styles from "./style.module.less";

type TCoworker = {
  id: number;
  company_id: number;
  email: string;
  name: string;
};

type TJob = {
  id: number;
  name: string;
};

const JobCoworker = () => {
  const [form] = Form.useForm();
  const { invitation_token: invitationToken } = useParams();
  const [job, setJob] = useState<TJob>();
  const [coworker, setCoworker] = useState<TCoworker>();
  const [status, setStatus] = useState<TTabKey>("chat");

  const initDocTypeRef = useRef<TJobDocType>();

  const { collapseForDrawer } = globalStore;

  const { t, i18n } = useTranslation();

  useEffect(() => {
    checkLogin();
  }, []);

  useEffect(() => {
    if (coworker) {
      fetchJob();
    }
  }, [coworker]);

  const checkLogin = async () => {
    const token = localStorage.getItem("coworker_token");
    if (token) {
      const { code, data } = await Get("/api/coworker/info");
      if (code === 0) {
        setCoworker(data.coworker);
        i18n.changeLanguage(data.company.lang);
      }
    }
  };

  const fetchJob = async () => {
    const { code, data } = await Get(
      `/api/coworker/jobs/by_token/${invitationToken}`
    );
    if (code === 0) {
      setJob(data);
    }
  };

  const onSumbit = () => {
    form.validateFields().then(async (values) => {
      const { code, data } = await Post(`/api/coworker/login`, {
        invitation_token: invitationToken,
        email: values.email,
        name: values.name,
      });

      if (code === 0) {
        setCoworker(data.coworker);
        localStorage.setItem("coworker_token", data.token);
      }
    });
  };

  return (
    <div
      className={styles.container}
      style={collapseForDrawer ? { width: "50vw", marginRight: "auto" } : {}}
    >
      {coworker ? (
        job && (
          <>
            <h2 style={{ color: "#1FAC6A", padding: "0 40px" }}>
              {t("coworker.description", { jobName: job.name })}
            </h2>
            <Tabs
              centered
              activeKey={status}
              items={[
                {
                  key: "chat",
                  label: t("job.chat"),
                },
                {
                  key: "info",
                  label: t("job.document"),
                },
              ]}
              onChange={(type) => {
                setStatus(type as TTabKey);
              }}
              className={styles.tabs}
            />
            <div
              className={styles.body}
              style={collapseForDrawer ? { width: "100%" } : {}}
            >
              {status === "chat" && (
                <ChatRoom jobId={job.id} allowEditMessage role="coworker" />
              )}
              {status === "info" && (
                <JobInformation
                  jobId={job.id}
                  activeDocType={initDocTypeRef.current}
                  role="coworker"
                />
              )}
            </div>
          </>
        )
      ) : (
        <div className={styles.loginContainer}>
          <h2>Please fill your information</h2>
          <Form form={form} layout="vertical">
            <Form.Item label="Email" name="email" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Button type="primary" onClick={onSumbit}>
              Submit
            </Button>
          </Form>
        </div>
      )}
    </div>
  );
};

export default observer(JobCoworker);
