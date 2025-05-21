import { Button, Form, Input, message, Modal, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

import { Get, Post } from "@/utils/request";
import styles from "./style.module.less";

const Interviewer = () => {
  const [interviewers, setInterviewers] = useState<IInterviewer[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<IInterviewer>();

  useEffect(() => {
    fetchInterviewers();
  }, []);

  const fetchInterviewers = async () => {
    const { code, data } = await Get("/api/interviewers");
    if (code === 0) {
      setInterviewers(data.interviewers);
    }
  };

  const createInterviewer = async () => {
    form.validateFields().then(async (values) => {
      const { name, email } = values;
      const { code } = await Post("/api/interviewers", {
        name,
        email,
      });
      if (code === 0) {
        message.success("Create interviewer succeed");
        fetchInterviewers();
        form.resetFields();
        setModalOpen(false);
      } else {
        if (code === 10004) {
          message.error("Email exists");
        } else {
          message.error("Create interviewer failed");
        }
      }
    });
  };

  const columns: ColumnsType<IInterviewer> = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      render: (text: string) => {
        return dayjs(text).format("YYYY-MM-DD HH:mm:ss");
      },
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.title}>Interviewer</div>
        <div>
          <Button type="primary" onClick={() => setModalOpen(true)}>
            Add Interviewer
          </Button>
        </div>
      </div>
      <div className={styles.pageBody}>
        <Table<IInterviewer>
          pagination={false}
          bordered={false}
          columns={columns}
          dataSource={interviewers}
          rowKey={(record) => record.id}
        />
      </div>
      <Modal
        title={"Add Interviewer"}
        open={modalOpen}
        onOk={() => createInterviewer()}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Interviewer;
