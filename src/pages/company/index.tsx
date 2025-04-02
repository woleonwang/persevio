import { Button, Form, Input, message, Select } from "antd";
import { Get, Post } from "../../utils/request";
import styles from "./style.module.less";
import { useEffect } from "react";
import TextAreaWithHint from "./components/TextAreaWithHint";
import { useTranslation } from "react-i18next";
const CompanyKnowledge = () => {
  const [form] = Form.useForm();
  const { i18n } = useTranslation();
  useEffect(() => {
    fetchCompany();
  });

  const fetchCompany = async () => {
    const { code, data } = await Get("/api/companies");
    if (code === 0) {
      form.setFieldsValue({
        content: data.content,
        name: data.name,
        lang: data.lang,
      });
    }
  };

  const updateCompany = () => {
    form.validateFields().then(async (values) => {
      const { content, name, lang } = values;
      const { code } = await Post("/api/companies", {
        content,
        name,
        lang,
      });
      if (code === 0) {
        message.success("Update company succeed");
        i18n.changeLanguage(lang);
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

          <Form.Item label="Language" name="lang" rules={[{ required: true }]}>
            <Select
              options={[
                {
                  value: "en-US",
                  label: "English",
                },
                {
                  value: "zh-CN",
                  label: "中文",
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Knowledge Base"
            name="content"
            rules={[{ required: true }]}
          >
            <TextAreaWithHint autoSize={{ minRows: 20, maxRows: 30 }} />
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
