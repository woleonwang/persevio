import { Button, Form, Input, message } from "antd";
import { Post } from "../../utils/request";
import { useNavigate } from "react-router";
import styles from "./style.module.less";

const JobCreate = () => {
  const [form] = Form.useForm();

  const navigate = useNavigate();

  const createJob = () => {
    form.validateFields().then(async (values) => {
      const { name } = values;
      const { code, data } = await Post("/api/jobs", {
        name: name,
      });
      if (code === 0) {
        message.success("Create job succeed");
        navigate(`/app/jobs?active=${data.job_id}`);
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>Open a new role</div>
      <div className={styles.form}>
        <Form form={form} layout="vertical">
          <Form.Item label="Job Title" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Button type="primary" onClick={createJob} style={{ marginTop: 24 }}>
            Submit
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default JobCreate;
