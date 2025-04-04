import { Button, Form, Input, message } from "antd";
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
  const { t } = useTranslation();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { code, data } = await Get("/api/settings");
    if (code === 0) {
      setProfile(data);
      const prompts: Record<string, string> = {};
      data.prompts.forEach((item: TPrompt) => {
        prompts[item.prompt_type] = item.content;
      });
      form.setFieldsValue(prompts);
    }
  };

  const updatePassword = () => {
    form.validateFields().then(async (values) => {
      const { password } = values;
      const { code } = await Post("/api/update_password", {
        password,
      });
      if (code === 0) {
        message.success("Update password succeed");
      } else {
        message.error("Update password failed");
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

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  return (
    <div className={styles.container}>
      <div className={styles.block}>
        <div className={styles.title}>{t("settings.profile")}</div>
        <div className={styles.item}>
          <div className={styles.label}>{t("settings.name")}:</div>
          <div>{profile?.staff_name}</div>
        </div>
        <div className={styles.item}>
          <div className={styles.label}>{t("settings.email")}:</div>
          <div>{profile?.email}</div>
        </div>
        <div className={styles.item}>
          <Button type="primary" onClick={() => logout()}>
            {t("settings.logout")}
          </Button>
        </div>
      </div>

      <div className={styles.block}>
        <div className={styles.title}>{t("settings.change_password")}</div>
        <Form form={form}>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true }]}
          >
            <Input.Password style={{ width: 300 }} />
          </Form.Item>
          <Button type="primary" onClick={() => updatePassword()}>
            {t("save")}
          </Button>
        </Form>
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
                      {t("save")}
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
