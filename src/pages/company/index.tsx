import { Button, Form, Input, message } from "antd";
import { Get, Post } from "../../utils/request";
import styles from "./style.module.less";
import { useEffect } from "react";
const CompanyKnowledge = () => {
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCompany();
  });

  const fetchCompany = async () => {
    const { code, data } = await Get("/api/companies");
    if (code === 0) {
      form.setFieldsValue({
        content: data.content,
        name: data.name,
      });
    }
  };

  const updateCompany = () => {
    form.validateFields().then(async (values) => {
      const { content, name } = values;
      const { code } = await Post("/api/companies", {
        content,
        name,
      });
      if (code === 0) {
        message.success("Update company succeed");
      } else {
        message.error("Update company failed");
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <Form form={form} layout="vertical">
          <Form.Item
            label="Company Name"
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Knowledge Base"
            name="content"
            rules={[{ required: true }]}
          >
            <Input.TextArea autoSize={{ minRows: 20, maxRows: 30 }} />
          </Form.Item>
          <Button type="primary" onClick={updateCompany}>
            Submit
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default CompanyKnowledge;
