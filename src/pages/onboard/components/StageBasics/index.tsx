import { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, InputNumber, Select, message } from "antd";

import { Get, Post } from "@/utils/request";
import { TOnboardingProfile } from "../../type";
import styles from "./style.module.less";

type IProps = {
  profile?: TOnboardingProfile;
  onSuccess: () => void;
};

type TFormValues = {
  company_name: string;
  industry: string;
  industry_other?: string;
  founded_in: number;
  company_stage: string;
  employee_count_range: string;
  hq_city: string;
  hq_country: string;
  primary_business_languages: string[];
};

const industryOptions = [
  "Advertising & Marketing",
  "Agriculture & Food",
  "Automotive",
  "Banking & Financial Services",
  "Biotechnology",
  "Consumer Goods & Retail",
  "Education & EdTech",
  "Energy & Utilities",
  "Entertainment & Media",
  "FinTech",
  "Gaming",
  "Healthcare & Health Services",
  "Hospitality & Travel",
  "Human Resources & Recruiting",
  "Insurance",
  "Logistics & Supply Chain",
  "Manufacturing",
  "Nonprofit & Social Impact",
  "Pharmaceuticals",
  "SaaS & Enterprise Software",
  "Telecommunications",
  "Transportation & Mobility",
  "Other",
];

const stageOptions = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Growth (Private)",
  "Public",
  "Bootstrapped / Self-Funded",
];

const employeeCountOptions = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5000+",
];

const languageOptions = [
  "English",
  "Mandarin Chinese",
  "Cantonese",
  "Malay",
  "Tamil",
  "Japanese",
  "Korean",
  "French",
  "German",
  "Spanish",
];

const sizeMapping: Record<string, string> = {
  lte_10: "1-10",
  "11_to_50": "11-50",
  "51_to_100": "51-200",
  "101_to_500": "201-500",
  "501_to_1000": "501-1000",
  gte_1001: "1001-5000",
};

const StageBasics = ({ profile, onSuccess }: IProps) => {
  const [form] = Form.useForm<TFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();

  const initialFromProfile = useMemo(() => {
    const basics = profile?.basics;
    return {
      company_name: basics?.company_name,
      industry: basics?.industry,
      industry_other: basics?.industry_other,
      founded_in: basics?.founded_in,
      company_stage: basics?.company_stage,
      employee_count_range: basics?.employee_count_range,
      hq_city: basics?.hq_location?.city,
      hq_country: basics?.hq_location?.country,
      primary_business_languages: basics?.primary_business_languages ?? [],
    };
  }, [profile]);

  useEffect(() => {
    form.setFieldsValue(initialFromProfile);
  }, [form, initialFromProfile]);

  useEffect(() => {
    prefillFromCompanyInfo();
  }, []);

  const prefillIfEmpty = (name: keyof TFormValues, value?: string | number) => {
    if (value === undefined || value === null || value === "") return;
    const currentValue = form.getFieldValue(name);
    if (
      currentValue === undefined ||
      currentValue === null ||
      currentValue === "" ||
      (Array.isArray(currentValue) && currentValue.length === 0)
    ) {
      form.setFieldValue(name, value);
    }
  };

  const prefillFromCompanyInfo = async () => {
    const { code, data } = await Get("/api/companies");
    if (code !== 0 || !data) return;

    prefillIfEmpty("company_name", data.name);
    prefillIfEmpty("employee_count_range", sizeMapping[data.size] || undefined);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const { code } = await Post("/api/onboarding/company-basics", {
        company_name: values.company_name,
        industry: values.industry,
        industry_other: values.industry_other,
        founded_in: values.founded_in,
        company_stage: values.company_stage,
        employee_count_range: values.employee_count_range,
        hq_location: {
          city: values.hq_city,
          country: values.hq_country,
        },
        primary_business_languages: values.primary_business_languages,
      });
      setSubmitting(false);

      if (code === 0) {
        onSuccess();
      } else {
        message.error("Failed to save company basics");
      }
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div className={styles.title}>Let&apos;s get Viona up to speed on your company</div>
        <div className={styles.subTitle}>
          This takes about 2 minutes. Viona will tailor her conversations to your
          context.
        </div>
      </div>
      <Form form={form} layout="vertical" className={styles.formSection}>
        <Form.Item
          label="Company Name"
          name="company_name"
          rules={[{ required: true, message: "Please enter company name" }]}
        >
          <Input size="large" />
        </Form.Item>

        <Form.Item
          label="Industry"
          name="industry"
          rules={[{ required: true, message: "Please select industry" }]}
        >
          <Select
            showSearch
            size="large"
            options={industryOptions.map((value) => ({ label: value, value }))}
          />
        </Form.Item>

        <Form.Item shouldUpdate noStyle>
          {() =>
            form.getFieldValue("industry") === "Other" ? (
              <Form.Item
                label="Please specify industry"
                name="industry_other"
                rules={[
                  {
                    required: true,
                    message: "Please specify your industry",
                  },
                ]}
              >
                <Input size="large" />
              </Form.Item>
            ) : null
          }
        </Form.Item>

        <Form.Item
          label="Founded In"
          name="founded_in"
          rules={[
            { required: true, message: "Please enter founded year" },
            {
              type: "number",
              min: 1800,
              max: currentYear,
              message: `Please enter a year between 1800 and ${currentYear}`,
            },
          ]}
        >
          <InputNumber style={{ width: "100%" }} size="large" />
        </Form.Item>

        <Form.Item
          label="Company Stage"
          name="company_stage"
          rules={[{ required: true, message: "Please select company stage" }]}
        >
          <Select
            size="large"
            options={stageOptions.map((value) => ({ label: value, value }))}
          />
        </Form.Item>

        <Form.Item
          label="Employee Count"
          name="employee_count_range"
          rules={[{ required: true, message: "Please select employee count" }]}
        >
          <Select
            size="large"
            options={employeeCountOptions.map((value) => ({ label: value, value }))}
          />
        </Form.Item>

        <div className={styles.twoColumn}>
          <Form.Item
            label="HQ City"
            name="hq_city"
            rules={[{ required: true, message: "Please enter HQ city" }]}
          >
            <Input size="large" />
          </Form.Item>
          <Form.Item
            label="HQ Country"
            name="hq_country"
            rules={[{ required: true, message: "Please enter HQ country" }]}
          >
            <Input size="large" />
          </Form.Item>
        </div>

        <Form.Item
          label="Primary Business Language(s)"
          name="primary_business_languages"
          rules={[
            {
              validator: (_, value: string[]) => {
                if (Array.isArray(value) && value.length > 0) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Please select at least one language"));
              },
            },
          ]}
        >
          <Select
            mode="multiple"
            size="large"
            options={languageOptions.map((value) => ({ label: value, value }))}
          />
        </Form.Item>

        <div className={styles.footerSection}>
          <Button type="primary" size="large" loading={submitting} onClick={handleSubmit}>
            Continue
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default StageBasics;
