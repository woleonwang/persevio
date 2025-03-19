import { Button, Form, Input, message } from "antd";
import { Get, Post } from "../../utils/request";
import styles from "./style.module.less";
import { useEffect, useState } from "react";
const Settings = () => {
  const [form] = Form.useForm();
  const [profile, setProfile] = useState<{ name: string; email: string }>();

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
      });
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
    </div>
  );
};

export default Settings;
