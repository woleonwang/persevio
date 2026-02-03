import { Button, Form, Input } from "antd";
import React, { useEffect, useReducer } from "react";

import styles from "./style.module.less";
import WhatsappContactNumber from "@/components/PhoneWithCountryCode";
import { Link } from "react-router";

interface IProps {
  initValues: IPreRegisterInfo;
  onFinish: (params: IPreRegisterInfo) => void;
  jobId?: number;
}

type TFormValues = {
  name: string;
  phone: {
    countryCode: string;
    phoneNumber: string;
  };
  email: string;
};

const BasicInfo: React.FC<IProps> = (props) => {
  const { initValues, onFinish, jobId } = props;
  const [form] = Form.useForm<TFormValues>();
  const [_, forceUpdate] = useReducer(() => ({}), {});

  useEffect(() => {
    const { name, country_code, phone, email } = initValues;
    form.setFieldsValue({
      name,
      phone: {
        countryCode: country_code,
        phoneNumber: phone,
      },
      email,
    });
    forceUpdate();
  }, [initValues]);
  const canSubmit = () => {
    const { name, phone, email } = form.getFieldsValue();
    return name && phone?.countryCode && phone?.phoneNumber && email;
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
            <WhatsappContactNumber />
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
                const {
                  name,
                  phone: { countryCode, phoneNumber },
                  email,
                } = values;
                const params = {
                  name,
                  country_code: countryCode,
                  phone: phoneNumber,
                  email,
                };
                onFinish(params);
              });
            }}
          >
            Next
          </Button>
        </div>

        <div style={{ marginTop: 12, textAlign: "center" }}>
          Already have an account?{" "}
          <Link to={`/signin-candidate${jobId ? `?job_id=${jobId}` : ""}`}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BasicInfo;
