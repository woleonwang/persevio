import { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, InputNumber, Select, message } from "antd";

import { Post } from "@/utils/request";
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

/** value = key persisted by backend, label = UI copy */
const industryOptions: { value: string; label: string }[] = [
  { value: "advertising_marketing", label: "Advertising & Marketing" },
  { value: "agriculture_food", label: "Agriculture & Food" },
  { value: "automotive", label: "Automotive" },
  {
    value: "banking_financial_services",
    label: "Banking & Financial Services",
  },
  { value: "biotechnology", label: "Biotechnology" },
  { value: "consumer_goods_retail", label: "Consumer Goods & Retail" },
  { value: "education_edtech", label: "Education & EdTech" },
  { value: "energy_utilities", label: "Energy & Utilities" },
  { value: "entertainment_media", label: "Entertainment & Media" },
  { value: "fintech", label: "FinTech" },
  { value: "gaming", label: "Gaming" },
  {
    value: "healthcare_health_services",
    label: "Healthcare & Health Services",
  },
  { value: "hospitality_travel", label: "Hospitality & Travel" },
  {
    value: "human_resources_recruiting",
    label: "Human Resources & Recruiting",
  },
  { value: "insurance", label: "Insurance" },
  { value: "logistics_supply_chain", label: "Logistics & Supply Chain" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "nonprofit_social_impact", label: "Nonprofit & Social Impact" },
  { value: "pharmaceuticals", label: "Pharmaceuticals" },
  { value: "saas_enterprise_software", label: "SaaS & Enterprise Software" },
  { value: "telecommunications", label: "Telecommunications" },
  { value: "transportation_mobility", label: "Transportation & Mobility" },
  { value: "other", label: "Other" },
];

const stageOptions: { value: string; label: string }[] = [
  { value: "pre_seed", label: "Pre-seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "series_c_plus", label: "Series C+" },
  { value: "growth_private", label: "Growth (Private)" },
  { value: "public", label: "Public" },
  { value: "bootstrapped_self_funded", label: "Bootstrapped / Self-Funded" },
];

const employeeCountOptions: { value: string; label: string }[] = [
  { label: "1-5", value: "1-5" },
  { label: "6-10", value: "6-10" },
  { label: "11-50", value: "11-50" },
  { label: "51-100", value: "51-100" },
  { label: "100+", value: "100+" },
];

const languageOptions: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh_mandarin", label: "Mandarin Chinese" },
  { value: "zh_cantonese", label: "Cantonese" },
  { value: "ms", label: "Malay" },
  { value: "ta", label: "Tamil" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
];

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
    <Form
      form={form}
      name="onboardCompanyBasics"
      autoComplete="off"
      layout="vertical"
    >
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
          options={industryOptions}
          optionFilterProp="label"
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(input.trim().toLowerCase())
          }
        />
      </Form.Item>

      <Form.Item shouldUpdate noStyle>
        {() =>
          form.getFieldValue("industry") === "other" ? (
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
        <Select size="large" options={stageOptions} optionFilterProp="label" />
      </Form.Item>

      <Form.Item
        label="Employee Count"
        name="employee_count_range"
        rules={[{ required: true, message: "Please select employee count" }]}
      >
        <Select
          size="large"
          options={employeeCountOptions}
          optionFilterProp="label"
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
        required
        rules={[
          {
            validator: (_, value: string[]) => {
              if (Array.isArray(value) && value.length > 0) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("Please select at least one language"),
              );
            },
          },
        ]}
      >
        <Select
          mode="multiple"
          size="large"
          options={languageOptions}
          optionFilterProp="label"
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(input.trim().toLowerCase())
          }
        />
      </Form.Item>

      <div className={styles.footer}>
        <Button
          type="primary"
          size="large"
          loading={submitting}
          onClick={handleSubmit}
        >
          Next
        </Button>
      </div>
    </Form>
  );
};

export default StageBasics;
