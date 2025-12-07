import React, { useState, useEffect, useRef } from "react";
import { Form, Input, Button, message } from "antd";
import logo from "@/assets/logo.png";
import { Post } from "@/utils/request";
import { Link, useNavigate } from "react-router";
import SignContainer from "@/components/SignContainer";
import { useTranslation } from "react-i18next";

interface BasicInfoFormValues {
  staff_name: string;
  position: string;
  phone: string;
}
const BasicInfo: React.FC = () => {
  const [form] = Form.useForm<BasicInfoFormValues>();
  const { t } = useTranslation();

  const navigate = useNavigate();

  const handleSignup = async () => {
    // 这里添加登录逻辑
    form.validateFields().then(async (values) => {
      const { staff_name, position, phone } = values;
      const {code} = await Post(  )
    }
  };

  return (
    <SignContainer>
      <img src={logo} style={{ width: 188 }} />
      <h2 style={{ fontSize: 36 }}>{t("signup.title")}</h2>
      <Form form={form} name="login" autoComplete="off" layout="vertical">
        <Form.Item
          label={t("signup.your_name")}
          name="staff_name"
          rules={[{ required: true, message: t("signup.please_enter_name") }]}
        >
          <Input placeholder={t("signup.name_placeholder")} size="large" />
        </Form.Item>

        <Form.Item
          label={t("signup.position")}
          name="position"
          rules={[
            { required: true, message: t("signup.please_enter_position") },
          ]}
        >
          <Input placeholder={t("signup.position_placeholder")} size="large" />
        </Form.Item>

        <Form.Item
          label={t("signup.phone")}
          name="phone"
          rules={[
            { required: true, message: t("signup.please_enter_phone") },
            {
              validator: (_, value, callback) => {
                // 国际手机号正则，支持+86、+1等国家码，也支持本地手机号
                const phoneRegex = /^(\+?\d{1,4}[-\s]?)?(\d{6,20})$/;
                if (!phoneRegex.test(value)) {
                  callback(t("signup.phone_format_error"));
                }
                callback();
              },
            },
          ]}
        >
          <Input placeholder={t("signup.phone_placeholder")} size="large" />
        </Form.Item>

        <Form.Item
          label={t("signup.company_name")}
          name="company_name"
          rules={[
            { required: true, message: t("signup.please_enter_company") },
          ]}
        >
          <Input placeholder={t("signup.company_placeholder")} size="large" />
        </Form.Item>

        <Form.Item
          label={t("signup.website")}
          name="website"
          rules={[
            { required: true, message: t("signup.please_enter_website") },
          ]}
        >
          <Input placeholder={t("signup.website_placeholder")} size="large" />
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
    </SignContainer>
  );
};

export default BasicInfo;
