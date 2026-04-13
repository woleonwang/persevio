import { useMemo, useState } from "react";
import { Button, Form, Input, Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";

import { Post, PostFormData } from "@/utils/request";
import { TOnboardingProfile } from "../../type";
import styles from "./style.module.less";

type IProps = {
  profile?: TOnboardingProfile;
  onSuccess: () => void;
};

type TFormValues = {
  website_url: string;
  linkedin_url?: string;
  material_text?: string;
};

const StageMaterials = ({ profile, onSuccess }: IProps) => {
  const [form] = Form.useForm<TFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [parsedFileText, setParsedFileText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isParsingFile, setIsParsingFile] = useState(false);

  const initialValues = useMemo(
    () => ({
      website_url: profile?.materials?.website_url,
      linkedin_url: profile?.materials?.linkedin_url,
      material_text: profile?.materials?.material_text,
    }),
    [profile],
  );

  const handleFileUpload = async (file: File) => {
    setIsParsingFile(true);
    setUploadedFileName(file.name);
    setParsedFileText("");

    const fileExt = (file.name || "").split(".").pop()?.toLowerCase();
    if (!fileExt || !["pdf", "docx"].includes(fileExt)) {
      setIsParsingFile(false);
      message.error("Only PDF and DOCX are supported");
      return false;
    }

    const formData = new FormData();
    formData.append("file", file);
    const { code, data } = await PostFormData<{ parsed_content?: string }>(
      "/api/extract_file_text",
      formData,
    );
    setIsParsingFile(false);

    if (code === 0) {
      setParsedFileText(data?.parsed_content || "");
      message.success(`${file.name} uploaded`);
    } else {
      setUploadedFileName("");
      message.error("Failed to parse file");
    }
    return false;
  };

  const handleSubmit = async () => {
    if (isParsingFile) {
      return;
    }
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const { code } = await Post("/api/onboarding/company-materials", {
        website_url: values.website_url,
        linkedin_url: values.linkedin_url,
        material_text: [values.material_text || "", parsedFileText]
          .filter(Boolean)
          .join("\n\n"),
      });
      setSubmitting(false);

      if (code === 0) {
        onSuccess();
      } else {
        message.error("Failed to save company materials");
      }
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div className={styles.title}>Help Viona learn more about your company</div>
        <div className={styles.subTitle}>
          Homepage URL is required. Other materials are optional but can improve
          onboarding quality.
        </div>
      </div>
      <Form
        form={form}
        layout="vertical"
        className={styles.formSection}
        initialValues={initialValues}
      >
        <Form.Item
          label="Homepage URL"
          name="website_url"
          rules={[
            { required: true, message: "Please enter homepage URL" },
            { type: "url", message: "Please enter a valid URL" },
          ]}
        >
          <Input size="large" placeholder="https://example.com" />
        </Form.Item>

        <Form.Item
          label="LinkedIn Company Page URL"
          name="linkedin_url"
          rules={[{ type: "url", message: "Please enter a valid URL" }]}
        >
          <Input size="large" placeholder="https://www.linkedin.com/company/..." />
        </Form.Item>

        <Form.Item label="Any materials that can help us understand your company">
          <Upload.Dragger
            beforeUpload={handleFileUpload}
            showUploadList={false}
            accept=".pdf,.docx"
            multiple={false}
            className={styles.materialUpload}
            disabled={isParsingFile || submitting}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className={styles.uploadTitle}>Click or drag file to this area to upload</p>
            <p className={styles.uploadHint}>
              Supports PDF and DOCX files
            </p>
          </Upload.Dragger>
          {!!uploadedFileName && (
            <div className={styles.fileNameText}>
              {isParsingFile
                ? `Parsing ${uploadedFileName}...`
                : `Uploaded file: ${uploadedFileName}`}
            </div>
          )}
        </Form.Item>

        <Form.Item name="material_text">
          <Input.TextArea
            rows={8}
            placeholder="Paste any intro docs, culture notes, or company context..."
          />
        </Form.Item>

        <div className={styles.footerSection}>
          <Button
            type="primary"
            size="large"
            loading={submitting || isParsingFile}
            onClick={handleSubmit}
            disabled={isParsingFile}
          >
            Continue
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default StageMaterials;
