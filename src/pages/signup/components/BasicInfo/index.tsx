import React, { useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { Post } from "@/utils/request";
import { useTranslation } from "react-i18next";
import PhoneWithCountryCode from "@/components/PhoneWithCountryCode";

import styles from "../../style.module.less";
interface BasicInfoFormValues {
  name?: string;
  phone?: {
    countryCode?: string;
    phoneNumber?: string;
  };
  position?: string;
}

interface IProps {
  onNext: () => void;
  initialValues: BasicInfoFormValues;
}
const BasicInfo: React.FC<IProps> = (props) => {
  const { onNext, initialValues } = props;
  const [form] = Form.useForm<BasicInfoFormValues>();
  const { t: originalT } = useTranslation();
  const t = (key: string) => {
    return originalT(`signup.${key}`);
  };

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues]);

  const handleSignup = async () => {
    form.validateFields().then(async (values) => {
      const { name, position, phone } = values;
      const { code } = await Post("/api/basic_info", {
        name,
        position,
        country_code: phone?.countryCode,
        phone: phone?.phoneNumber,
      });

      if (code === 0) {
        onNext();
      } else {
        message.error(t("signup.signup_failed"));
      }
    });
  };

  return (
    <Form form={form} name="login" autoComplete="off" layout="vertical">
      <Form.Item
        label={t("your_name")}
        name="name"
        rules={[{ required: true, message: t("please_enter_name") }]}
      >
        <Input placeholder={originalT("please_enter")} size="large" />
      </Form.Item>

      <Form.Item
        label={t("phone")}
        name="phone"
        rules={[
          {
            validator: (_, value, callback) => {
              if (!value?.countryCode || !value?.phoneNumber) {
                callback(originalT("please_enter"));
                return;
              }
              const reg = /^[0-9]+$/;
              if (!(value.phoneNumber as string).match(reg)) {
                callback(originalT("phone_not_valid"));
                return;
              }
              callback();
            },
          },
        ]}
      >
        <PhoneWithCountryCode />
      </Form.Item>

      <Form.Item
        label={t("position")}
        name="position"
        rules={[{ required: true, message: t("please_enter_position") }]}
      >
        <Input placeholder={originalT("please_enter")} size="large" />
      </Form.Item>

      <div className={styles.footer}>
        <Button type="primary" size="large" onClick={handleSignup}>
          {t("next_step")}
        </Button>
      </div>
    </Form>
  );
};

export default BasicInfo;
