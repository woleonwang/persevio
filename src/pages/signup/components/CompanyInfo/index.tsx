import React, { useState, useEffect, useRef } from "react";
import { Form, Input, Button, message, Select } from "antd";
import logo from "@/assets/logo.png";
import { Post } from "@/utils/request";
import { Link, useNavigate } from "react-router";
import SignContainer from "@/components/SignContainer";
import { useTranslation } from "react-i18next";

interface CompanyInfoFormValues {
  name?: string;
  website?: string;
  size?: string;
}

interface IProps {
  onPrev: () => void;
  onNext: () => void;
  initialValues: CompanyInfoFormValues;
}
const CompanyInfo: React.FC<IProps> = (props) => {
  const { onPrev, onNext, initialValues } = props;

  const [form] = Form.useForm<CompanyInfoFormValues>();
  const { t } = useTranslation();

  const navigate = useNavigate();

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues]);

  const submit = async () => {
    form.validateFields().then(async (values: CompanyInfoFormValues) => {
      const { name, website, size } = values;
      const { code } = await Post("/api/companies/basic_info", {
        name,
        website,
        size,
      });

      if (code === 0) {
        onNext();
      }
    });
  };

  return (
    <Form form={form} name="login" autoComplete="off" layout="vertical">
      <Form.Item
        label={t("signup.company_name")}
        name="name"
        rules={[{ required: true, message: t("signup.please_enter_company") }]}
      >
        <Input placeholder={t("signup.company_placeholder")} size="large" />
      </Form.Item>

      <Form.Item
        label={t("signup.website")}
        name="website"
        rules={[{ required: true, message: t("signup.please_enter_website") }]}
      >
        <Input placeholder={t("signup.website_placeholder")} size="large" />
      </Form.Item>

      <Form.Item
        label={t("signup.company_size")}
        name="size"
        rules={[
          { required: true, message: t("signup.please_enter_company_size") },
        ]}
      >
        <Select
          options={[
            { label: t("signup.company_size_1"), value: "lte_10" },
            { label: t("signup.company_size_2"), value: "11_to_50" },
            { label: t("signup.company_size_3"), value: "51_to_100" },
            { label: t("signup.company_size_4"), value: "101_to_500" },
            { label: t("signup.company_size_5"), value: "501_to_1000" },
            { label: t("signup.company_size_6"), value: "gte_1001" },
          ]}
          size="large"
        />
      </Form.Item>

      <div>
        <Button type="default" size="large" onClick={onPrev}>
          {t("signup.prev")}
        </Button>
        <Button type="primary" size="large" onClick={submit}>
          {t("signup.sign_up")}
        </Button>
      </div>
    </Form>
  );
};

export default CompanyInfo;
