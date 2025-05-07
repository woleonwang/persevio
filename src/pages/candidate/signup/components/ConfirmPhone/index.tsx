import { Button, Form, Input } from "antd";
import { useEffect } from "react";

import { Post } from "@/utils/request";
import styles from "./style.module.less";

interface IProps {
  phone?: string;
  onFinish: () => void;
}
const ConfirmPhone = (props: IProps) => {
  const { phone, onFinish } = props;
  const [form] = Form.useForm<{ phone: string }>();

  useEffect(() => {
    if (!phone) return;
    form.setFieldsValue({ phone });
  }, [phone]);
  const confirmPhone = async () => {
    form.validateFields().then(async (values) => {
      const { code } = await Post(`/api/candidate/confirm_phone`, {
        phone: values.phone,
      });
      if (code === 0) {
        onFinish();
      }
    });
  };
  return (
    <div style={{ width: 600, marginTop: 95 }}>
      <Form form={form}>
        <div className={styles.title}>Confirm contact details </div>
        <Form.Item name="phone" rules={[{ required: true }]}>
          <Input size="large" />
        </Form.Item>
        <div className={styles.hint}>
          Please make sure your contact details are correct. We will need to
          contact you for the next steps in the recruitment process.
        </div>
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
          Next
        </Button>
      </div>
    </div>
  );
};

export default ConfirmPhone;
