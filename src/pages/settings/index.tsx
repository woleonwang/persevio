import { Button, Form, Input, message, Select } from "antd";
import { Get, Post } from "../../utils/request";
import styles from "./style.module.less";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

type TPrompt = {
  prompt_type: string;
  content: string;
};
const Settings = () => {
  const [form] = Form.useForm();
  const [profile, setProfile] = useState<ISettings>();
  const navigate = useNavigate();
  const { t: originalT, i18n } = useTranslation();

  const t = (key: string) => {
    return originalT(`settings.${key}`);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { code, data } = await Get("/api/settings");
    if (code === 0) {
      setProfile(data);
      const formValues: Record<string, string> = {};

      data.prompts.forEach((item: TPrompt) => {
        formValues[item.prompt_type] = item.content;
      });
      form.setFieldsValue(formValues);
    }
  };

  const updatePassword = () => {
    form.validateFields().then(async (values) => {
      const { password } = values;
      const { code } = await Post("/api/update_password", {
        password,
      });
      if (code === 0) {
        message.success(t("update_password_success"));
      } else {
        message.error(t("update_password_error"));
      }
    });
  };

  const updatePrompt = async (promptType: string) => {
    const content = form.getFieldsValue()[promptType];
    const { code } = await Post("/api/update_prompt", {
      prompt_type: promptType,
      content,
    });
    if (code === 0) {
      message.success("Update prompt succeed");
    } else {
      message.error("Update prompt failed");
    }
  };

  const updateLang = async (lang: string) => {
    const { code } = await Post("/api/companies/language", {
      lang,
    });
    if (code === 0) {
      message.success(t("update_lang_success"));
      if (profile) {
        setProfile({
          ...profile,
          lang,
        });
      }
      i18n.changeLanguage(lang);
    } else {
      message.error(t("update_lang_success"));
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  return (
    <div className={styles.container}>
      <div className={styles.block}>
        <div className={styles.title}>{t("profile")}</div>
        <div className={styles.item}>
          <div className={styles.label}>{t("name")}:</div>
          <div>{profile?.staff_name}</div>
        </div>
        <div className={styles.item}>
          <div className={styles.label}>{t("email")}:</div>
          <div>{profile?.email}</div>
        </div>
        <div className={styles.item}>
          <Button type="primary" onClick={() => logout()}>
            {t("logout")}
          </Button>
        </div>
      </div>
      <div className={styles.block}>
        <div className={styles.title}>{t("change_password")}</div>
        <Form form={form}>
          <Form.Item
            label={t("password")}
            name="password"
            rules={[{ required: true }]}
          >
            <Input.Password style={{ width: 300 }} />
          </Form.Item>
          <Button type="primary" onClick={() => updatePassword()}>
            {originalT("save")}
          </Button>
        </Form>
      </div>

      <div className={styles.block}>
        <div className={styles.title}>{t("language")}</div>

        <Select
          style={{ width: 300 }}
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
          value={profile?.lang}
          onChange={(lang) => updateLang(lang)}
        />
      </div>

      {!!profile?.is_admin && (
        <div className={styles.block}>
          <div className={styles.title}>Customize Prompts</div>
          <Form form={form}>
            {profile.prompts.map((item) => {
              return (
                <div key={item.prompt_type} style={{ marginBottom: 40 }}>
                  <Form.Item
                    labelCol={{ span: 5 }}
                    label={item.prompt_type}
                    name={item.prompt_type}
                  >
                    <Input.TextArea rows={10} />
                  </Form.Item>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      type="primary"
                      onClick={() => updatePrompt(item.prompt_type)}
                    >
                      {originalT("save")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </Form>
        </div>
      )}
    </div>
  );
};

export default Settings;
