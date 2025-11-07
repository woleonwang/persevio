import { Button, Form, Input } from "antd";
import React, { useReducer } from "react";

import styles from "./style.module.less";

export interface TBaiscInfo {
  name: string;
  phone: string;
  email: string;
}

interface IProps {
  onFinish: (params: TBaiscInfo) => void;
}

const BasicInfo: React.FC<IProps> = (props) => {
  const [form] = Form.useForm<TBaiscInfo>();
  const [_, forceUpdate] = useReducer(() => ({}), {});

  const canSubmit = () => {
    const { name, phone, email } = form.getFieldsValue();
    return name && phone && email;
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}> Provide Your Basic Information</div>
      <div className={styles.hint}>
        We need this information to create your application and keep you updated
        on its progress.
      </div>
      <div className={styles.formContainer}>
        <Form
          form={form}
          layout="vertical"
          onFieldsChange={() => forceUpdate()}
        >
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="Please fill in" />
          </Form.Item>
          <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
            <Input placeholder="Please fill in" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true }]}>
            <Input placeholder="Please fill in" />
          </Form.Item>
        </Form>

        <div style={{ marginTop: 52, textAlign: "center" }}>
          <Button
            size="large"
            style={{ width: "100%", height: 44, borderRadius: 12 }}
            type="primary"
            disabled={!canSubmit()}
            onClick={() => {
              form.validateFields().then(async (values) => {
                const { name, phone, email } = values;
                const params = {
                  name,
                  phone,
                  email,
                };
                props.onFinish(params);
              });
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BasicInfo;
