import { Button, Form, Input, message, Switch } from "antd";
import { CopyOutlined, ExportOutlined } from "@ant-design/icons";
import { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { Get, Post } from "@/utils/request";
import styles from "./style.module.less";
import { copy } from "@/utils";

const SUBDOMAIN_PATTERN = /^[a-z_-]+$/;

const sanitizeSubdomain = (value: string) =>
  value.toLowerCase().replace(/\s+/g, "");

const CareerPageConfig = () => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [careerPageSuffix, setCareerPageSuffix] = useState("");
  const [_, forceUpdate] = useReducer(() => ({}), {});

  useEffect(() => {
    fetchCareerPage();
  }, []);

  const fetchCareerPage = async () => {
    setLoading(true);
    const { code, data } = await Get("/api/career_page");
    setLoading(false);
    if (code !== 0) {
      return;
    }

    setCareerPageSuffix(data.career_page_suffix);
    form.setFieldsValue({
      enabled: data.enabled,
      subdomain: data.subdomain,
      page_title: data.page_title,
      introduction: data.introduction,
    });
  };

  const copyCareerPageLink = async () => {
    const subdomain = sanitizeSubdomain(form.getFieldValue("subdomain") || "");
    if (!subdomain) {
      form.validateFields(["subdomain"]);
      return;
    }

    const link = `https://${subdomain}.${careerPageSuffix}`;
    try {
      await copy(link);
    } catch (e) {}
    message.success(t("career_page.copied"));
  };

  const previewCareerPage = () => {
    const subdomain = sanitizeSubdomain(form.getFieldValue("subdomain") || "");
    form.setFieldValue("subdomain", subdomain);
    if (!subdomain) {
      form.validateFields(["subdomain"]);
      return;
    }
    window.open(
      `https://${subdomain}.${careerPageSuffix}`,
      "_blank",
      "noopener",
    );
  };

  const saveCareerPage = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const { code, data } = await Post<ICareerPageConfig>("/api/career_page", {
        enabled: values.enabled,
        subdomain: sanitizeSubdomain(values.subdomain),
        page_title: values.page_title.trim(),
        introduction: values.introduction,
      });
      setSaving(false);

      if (code === 0 && data) {
        fetchCareerPage();
        message.success(t("career_page.saved"));
        return;
      }

      message.error(t("career_page.save_failed"));
    } catch {
      setSaving(false);
    }
  };

  const enabled = form.getFieldValue("enabled");

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <h1 className={styles.title}>{t("career_page.title")}</h1>
        <Form
          form={form}
          layout="vertical"
          disabled={loading}
          onFieldsChange={forceUpdate}
        >
          <Form.Item label={t("career_page.enable")}>
            <div className={styles.switchRow}>
              <Form.Item name="enabled" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
              <span className={styles.switchCopy}>
                {enabled
                  ? t("career_page.switch_on")
                  : t("career_page.switch_off")}
              </span>
            </div>
          </Form.Item>

          <Form.Item
            label={t("career_page.domain_name")}
            extra={t("career_page.domain_hint")}
          >
            <div className={styles.domainRow}>
              <span className={styles.protocolPrefix}>https://</span>
              <Form.Item
                name="subdomain"
                noStyle
                rules={[
                  {
                    validator: async (_, value) => {
                      const subdomain = sanitizeSubdomain(value || "");
                      if (!subdomain) {
                        throw new Error(t("career_page.domain_required"));
                      }
                      if (subdomain.length < 3 || subdomain.length > 15) {
                        throw new Error(t("career_page.domain_length"));
                      }
                      if (!SUBDOMAIN_PATTERN.test(subdomain)) {
                        throw new Error(t("career_page.domain_chars"));
                      }
                    },
                  },
                ]}
              >
                <Input
                  className={styles.domainInputWrap}
                  addonAfter={`.${careerPageSuffix}`}
                  onBlur={(e) => {
                    form.setFieldValue(
                      "subdomain",
                      sanitizeSubdomain(e.target.value),
                    );
                  }}
                />
              </Form.Item>
              <Button
                icon={<CopyOutlined />}
                onClick={copyCareerPageLink}
                aria-label={t("career_page.copy_link")}
                style={{ flex: "none" }}
              />
              <Button
                icon={<ExportOutlined />}
                onClick={previewCareerPage}
                disabled={!enabled}
                aria-label={t("career_page.preview")}
                style={{ flex: "none" }}
              />
            </div>
          </Form.Item>

          <Form.Item
            label={t("career_page.page_title")}
            name="page_title"
            rules={[
              { required: true, message: t("career_page.page_title_required") },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item label={t("career_page.introduction")} name="introduction">
            <Input.TextArea autoSize={{ minRows: 6, maxRows: 16 }} />
          </Form.Item>

          <Button type="primary" loading={saving} onClick={saveCareerPage}>
            {t("career_page.save")}
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default CareerPageConfig;
