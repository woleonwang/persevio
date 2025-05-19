import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Empty, Form, Input, message, Select } from "antd";

import { parseJSON } from "@/utils";
import { Get, Post } from "@/utils/request";

import styles from "./style.module.less";

type TCareerAspiration = {
  desired_role: string;
  minimum_salary: string;
  maximum_salary: string;
  remote_preference: string;
  preferred_locations: string[];
  preferred_industries: string[];
  job_search_status: string;
};
const CareerAspirations = () => {
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`candidate_aspirations.${key}`);

  const [form] = Form.useForm<TCareerAspiration>();
  const [ready, setReady] = useState(false);

  const [hasEdited, setHasEdited] = useState(false);
  useEffect(() => {
    fetchAspirations();
  }, []);

  const fetchAspirations = async () => {
    const { code, data } = await Get(
      "/api/candidate/docs/career_aspiration_json"
    );
    if (code === 0) {
      form.setFieldsValue(parseJSON(data.content));
      setReady(true);
    }
  };

  const handleSave = async () => {
    form.validateFields().then(async (values) => {
      const { code } = await Post(
        "/api/candidate/docs/career_aspiration_json",
        {
          content: JSON.stringify(values),
        }
      );
      if (code === 0) {
        fetchAspirations();
        setHasEdited(false);
        message.success(originalT("submit_succeed"));
      }
    });
  };

  if (!ready) {
    return <Empty style={{ marginTop: 200 }} description={t("pending")} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>{t("career_aspirations")}</div>
      <div style={{ padding: "40px 20px" }}>
        <Form
          form={form}
          layout="vertical"
          onFieldsChange={() => setHasEdited(true)}
        >
          <Form.Item name="desired_role" label="Desired Role">
            <Input />
          </Form.Item>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            <Form.Item
              name="minimum_salary"
              label="Minimum Salary"
              style={{ flex: "auto" }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="maximum_salary"
              label="Maximum Salary"
              style={{ flex: "auto" }}
            >
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="remote_preference" label="Remote Preference">
            <Input />
          </Form.Item>
          <Form.Item name="preferred_locations" label="Preferred Locations">
            <Select mode="tags" />
          </Form.Item>
          <Form.Item name="preferred_industries" label="Preferred Industries">
            <Select mode="tags" />
          </Form.Item>
          <Form.Item name="job_search_status" label="Job Search Status">
            <Input />
          </Form.Item>
        </Form>
        <div className={styles.footer}>
          <Button type="primary" onClick={handleSave} disabled={!hasEdited}>
            {originalT("save")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CareerAspirations;
