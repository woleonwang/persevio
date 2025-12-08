import React, { useEffect } from "react";
import { Form, Button, message, Select } from "antd";
import { Post } from "@/utils/request";
import { useTranslation } from "react-i18next";

import styles from "../../style.module.less";

type CompanyRecruitmentRequirementFormValues = {
  role_type?: string[];
  headcount_number?: string;
};

interface IProps {
  onPrev: () => void;
  onNext: () => void;
  initialValues: CompanyRecruitmentRequirementFormValues;
}
const RecruitmentRequirement: React.FC<IProps> = (props) => {
  const { onPrev, onNext, initialValues } = props;

  const [form] = Form.useForm<CompanyRecruitmentRequirementFormValues>();
  const { t: originalT } = useTranslation();
  const t = (key: string) => {
    return originalT(`signup.${key}`);
  };

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues]);

  const submit = async () => {
    form
      .validateFields()
      .then(async (values: CompanyRecruitmentRequirementFormValues) => {
        const { role_type, headcount_number } = values;
        const { code } = await Post("/api/companies/recruitment_requirements", {
          role_type,
          headcount_number,
        });

        if (code === 0) {
          onNext();
        } else {
          message.error(t("signup_failed"));
        }
      });
  };

  return (
    <Form form={form} name="login" autoComplete="off" layout="vertical">
      <Form.Item
        label={t("role_type")}
        name="role_type"
        rules={[{ required: true, message: originalT("please_select") }]}
      >
        <Select
          mode="multiple"
          placeholder={originalT("please_select")}
          options={[
            {
              label: t("role_type_engineering_tech"),
              value: "engineering/tech",
            },
            { label: t("role_type_data_ai"), value: "data/ai" },
            { label: t("role_type_product"), value: "product" },
            { label: t("role_type_design_ux"), value: "design/ux" },
            { label: t("role_type_sales"), value: "sales" },
            {
              label: t("role_type_marketing_growth"),
              value: "marketing/growth",
            },
            {
              label: t("role_type_customer_success_support"),
              value: "customer success/support",
            },
            { label: t("role_type_operations"), value: "operations" },
            { label: t("role_type_finance"), value: "finance" },
            { label: t("role_type_hr_people"), value: "hr/people" },
            {
              label: t("role_type_legal_compliance"),
              value: "legal/compliance",
            },
            { label: t("role_type_it_security"), value: "it/security" },
            {
              label: t("role_type_supply_chain_procurement"),
              value: "supply chain/procurement",
            },
            { label: t("role_type_manufacturing"), value: "manufacturing" },
            { label: t("role_type_facilities"), value: "facilities" },
            {
              label: t("role_type_medical_clinical"),
              value: "medical/clinical",
            },
            { label: t("role_type_other"), value: "other" },
          ]}
          size="large"
        />
      </Form.Item>

      <Form.Item
        label={t("headcount_number")}
        name="headcount_number"
        rules={[
          {
            required: true,
            message: originalT("please_select"),
          },
        ]}
      >
        <Select
          options={[
            { label: "1-5", value: "1-5" },
            { label: "6-10", value: "6-10" },
            { label: "11-50", value: "11-50" },
            { label: "51-100", value: "51-100" },
            { label: "100+", value: "100+" },
          ]}
          placeholder={originalT("please_select")}
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

export default RecruitmentRequirement;
