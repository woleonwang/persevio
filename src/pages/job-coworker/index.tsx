import { useEffect, useState } from "react";

import styles from "./style.module.less";
import { useParams } from "react-router";
import ChatRoom from "../../components/ChatRoom";
import { Get, Post } from "../../utils/request";
import { Button, Form, Input } from "antd";
import { observer } from "mobx-react-lite";
import globalStore from "../../store/global";

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
  const { collapseForDrawer } = globalStore;

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
        setCoworker(data);
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
              Define job requirements for the {job.name} role by completing this
              conversation with Viona, your AI recruiter.
            </h2>
            <div
              className={styles.body}
              style={collapseForDrawer ? { width: "100%" } : {}}
            >
              <ChatRoom jobId={job.id} allowEditMessage role="coworker" />
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
