import React, { useState, useEffect, useRef } from "react";
import { Form, Input, Button, message } from "antd";
import logo from "@/assets/logo.png";
import { Post } from "@/utils/request";
import SignContainer from "@/components/SignContainer";
import { useTranslation } from "react-i18next";
import PhoneWithCountryCode from "@/components/PhoneWithCountryCode";

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
  const { t } = useTranslation();

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
        label={t("signup.your_name")}
        name="name"
        rules={[{ required: true, message: t("signup.please_enter_name") }]}
      >
        <Input placeholder={t("signup.name_placeholder")} size="large" />
      </Form.Item>

      <Form.Item
        label={t("signup.phone")}
        name="phone"
        rules={[{ required: true, message: t("signup.please_enter_phone") }]}
      >
        <PhoneWithCountryCode />
      </Form.Item>

      <Form.Item
        label={t("signup.position")}
        name="position"
        rules={[{ required: true, message: t("signup.please_enter_position") }]}
      >
        <Input placeholder={t("signup.position_placeholder")} size="large" />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          onClick={handleSignup}
        >
          {t("signup.sign_up")}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default BasicInfo;
