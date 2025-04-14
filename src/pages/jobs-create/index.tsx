import { Button, Form, Input, message } from "antd";
import { Post } from "../../utils/request";
import { useNavigate } from "react-router";
import styles from "./style.module.less";
import globalStore from "../../store/global";
import { useTranslation } from "react-i18next";

const JobCreate = () => {
  const [form] = Form.useForm();
  const { fetchJobs } = globalStore;

  const navigate = useNavigate();
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`create_job.${key}`);

  const createJob = () => {
    form.validateFields().then(async (values) => {
      const { name } = values;
      const { code, data } = await Post("/api/jobs", {
        name: name,
      });
      if (code === 0) {
        message.success("Create job succeed");
        fetchJobs();
        navigate(`/app/jobs/${data.job_id}`);
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>{t("new_role")}</div>
      <div className={styles.form}>
        <Form form={form} layout="vertical">
          <Form.Item
            label={t("job_name")}
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Button type="primary" onClick={createJob} style={{ marginTop: 24 }}>
            {t("submit")}
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default JobCreate;
