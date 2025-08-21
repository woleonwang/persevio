import { Button, Form, Input, message, Upload, Select } from "antd";
import { Get, Post } from "../../utils/request";
import styles from "./style.module.less";
import { useEffect, useState } from "react";
import TextAreaWithHint from "./components/TextAreaWithHint";
import { useTranslation } from "react-i18next";
import { PlusOutlined } from "@ant-design/icons";

const CompanyKnowledge = () => {
  const [form] = Form.useForm();
  const { t, i18n } = useTranslation();
  const [logo, setLogo] = useState("");

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    const { code, data } = await Get("/api/companies");
    if (code === 0) {
      form.setFieldsValue({
        content: data.content,
        name: data.name,
        lang: data.lang || "en-US",
        website: data.website,
      });
      setLogo(data.logo);
    }
  };

  const updateCompany = () => {
    form.validateFields().then(async (values) => {
      const { content, name, lang, website } = values;
      const { code } = await Post("/api/companies", {
        content,
        name,
        lang,
        website,
      });
      if (code === 0) {
        message.success("Update company succeed");

        const { code, data } = await Get("/api/settings");
        if (code === 0) {
          // 更新本地语言设置
          i18n.changeLanguage(data.lang);
        }
      } else {
        message.error("Update company failed");
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <Form form={form} layout="vertical">
          <Form.Item label={t("company.logo")} name="logo">
            <Upload
              action="/api/companies/logo"
              accept="image/*"
              maxCount={1}
              listType="picture-card"
              showUploadList={false}
              headers={{
                authorization: localStorage.getItem("token") || "",
              }}
              onChange={(info) => {
                if (info.file.status === "done") {
                  message.success(t("company.upload_logo_succeed"));
                  fetchCompany();
                } else if (info.file.status === "error") {
                  message.error(t("company.upload_logo_failed"));
                }
              }}
            >
              {logo ? (
                <img
                  src={`/api/logo/${logo}`}
                  alt="logo"
                  style={{ width: "100%" }}
                />
              ) : (
                <button style={{ border: 0, background: "none" }} type="button">
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </button>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            label={t("company.name")}
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t("company.website")}
            name="website"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t("company.language")}
            name="lang"
            rules={[{ required: true }]}
          >
            <Select
              style={{ width: "100%" }}
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
            label={t("company.knowledge_base")}
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
