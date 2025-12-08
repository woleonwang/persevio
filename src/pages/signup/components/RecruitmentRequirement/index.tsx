import React, { useEffect } from "react";
import { Form, Button, message, Select } from "antd";
import { Post } from "@/utils/request";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
          message.error(t("signup.signup_failed"));
        }
      });
  };

  return (
    <Form form={form} name="login" autoComplete="off" layout="vertical">
      <Form.Item
        label={t("signup.role_type")}
        name="role_type"
        rules={[
          { required: true, message: t("signup.please_enter_role_type") },
        ]}
      >
        <Select
          mode="multiple"
          options={[
            { label: "Engineering/Tech", value: "engineering/tech" },
            { label: "Data/AI", value: "data/ai" },
            { label: "Product", value: "product" },
            { label: "Design/UX", value: "design/ux" },
            { label: "Sales", value: "sales" },
            { label: "Marketing/Growth", value: "marketing/growth" },
            {
              label: "Customer Success/Support",
              value: "customer success/support",
            },
            { label: "Operations", value: "operations" },
            { label: "Finance", value: "finance" },
            { label: "HR/People", value: "hr/people" },
            { label: "Legal/Compliance", value: "legal/compliance" },
            { label: "IT/Security", value: "it/security" },
            {
              label: "Supply Chain/Procurement",
              value: "supply chain/procurement",
            },
            { label: "Manufacturing", value: "manufacturing" },
            { label: "Facilities", value: "facilities" },
            { label: "Medical/Clinical", value: "medical/clinical" },
            { label: "Other", value: "other" },
          ]}
          size="large"
        />
      </Form.Item>

      <Form.Item
        label={t("signup.headcount_number")}
        name="headcount_number"
        rules={[
          {
            required: true,
            message: t("signup.please_enter_headcount_number"),
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
          placeholder={t("signup.headcount_number_placeholder")}
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

export default RecruitmentRequirement;
