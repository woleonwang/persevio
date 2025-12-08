import React, { useEffect } from "react";
import { Form, Input, Button, Select } from "antd";
import { Post } from "@/utils/request";
import { useTranslation } from "react-i18next";

import styles from "../../style.module.less";
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
  const { t: originalT } = useTranslation();
  const t = (key: string) => {
    return originalT(`signup.${key}`);
  };

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
        label={t("company_name")}
        name="name"
        rules={[{ required: true, message: t("please_enter_company_name") }]}
      >
        <Input placeholder={originalT("please_enter")} size="large" />
      </Form.Item>

      <Form.Item
        label={t("website")}
        name="website"
        rules={[{ required: true, message: t("please_enter_website") }]}
      >
        <Input placeholder={originalT("please_enter")} size="large" />
      </Form.Item>

      <Form.Item
        label={t("company_size")}
        name="size"
        rules={[{ required: true, message: t("please_enter_company_size") }]}
      >
        <Select
          placeholder={originalT("please_select")}
          options={[
            { label: t("company_size_1"), value: "lte_10" },
            { label: t("company_size_2"), value: "11_to_50" },
            { label: t("company_size_3"), value: "51_to_100" },
            { label: t("company_size_4"), value: "101_to_500" },
            { label: t("company_size_5"), value: "501_to_1000" },
            { label: t("company_size_6"), value: "gte_1001" },
          ]}
          size="large"
        />
      </Form.Item>

      <div className={styles.footer}>
        <Button type="default" size="large" onClick={onPrev}>
          {t("prev")}
        </Button>
        <Button type="primary" size="large" onClick={submit}>
          {t("next_step")}
        </Button>
      </div>
    </Form>
  );
};

export default CompanyInfo;
