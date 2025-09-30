import { Button, Form, Input } from "antd";
import { useEffect } from "react";

import { Post } from "@/utils/request";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";

interface IProps {
  phone?: string;
  name?: string;
  onFinish: () => void;
}
const ConfirmPhone = (props: IProps) => {
  const { phone, name, onFinish } = props;
  const [form] = Form.useForm<{ phone: string; name: string }>();

  const { t: originalT } = useTranslation();
  const t = (key: string) => {
    return originalT(`candidate_sign.${key}`);
  };

  useEffect(() => {
    form.setFieldsValue({ phone, name });
  }, [phone, name]);
  const confirmPhone = async () => {
    form.validateFields().then(async (values) => {
      const { code } = await Post(`/api/candidate/confirm_contact_info`, {
        phone: values.phone,
        name: values.name,
      });
      if (code === 0) {
        onFinish();
      }
    });
  };
  return (
    <div style={{ width: 600, marginTop: 95 }}>
      <Form form={form}>
        <div className={styles.title}>{t("confirm_contact")}</div>
        <Form.Item name="name" rules={[{ required: true }]}>
          <Input size="large" />
        </Form.Item>
        <Form.Item name="phone" rules={[{ required: true }]}>
          <Input size="large" />
        </Form.Item>
        <div className={styles.hint}>{t("confirm_contact_hint")}</div>
      </Form>

      <div style={{ textAlign: "center", marginTop: 240 }}>
        <Button
          type="primary"
          onClick={() => {
            confirmPhone();
          }}
          size="large"
          shape="round"
          style={{ paddingLeft: 30, paddingRight: 30 }}
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmPhone;
