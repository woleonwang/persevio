import { Button, Form, Input, message } from "antd";
import { Get, Post } from "../../utils/request";
import styles from "./style.module.less";
import { useEffect, useState } from "react";

type TPrompt = {
  prompt_type: string;
  content: string;
};
const Settings = () => {
  const [form] = Form.useForm();
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    prompts: TPrompt[];
    is_admin: number;
  }>();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { code, data } = await Get("/api/settings");
    if (code === 0) {
      const { staff_name, email } = data;
      setProfile({
        name: staff_name,
        email,
        prompts: data.prompts,
        is_admin: data.is_admin,
      });
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

  return (
    <div className={styles.container}>
      <div className={styles.block}>
        <div className={styles.title}>Proflie</div>
        <div className={styles.item}>
          <div className={styles.label}>Name:</div>
          <div>{profile?.name}</div>
        </div>
        <div className={styles.item}>
          <div className={styles.label}>Email:</div>
          <div>{profile?.email}</div>
        </div>
      </div>

      <div className={styles.block}>
        <div className={styles.title}>Change Password</div>
        <Form form={form}>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true }]}
          >
            <Input.Password style={{ width: 300 }} />
          </Form.Item>
          <Button type="primary" onClick={() => updatePassword()}>
            Save
          </Button>
        </Form>
      </div>

      {profile?.is_admin && (
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
                      Save
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
