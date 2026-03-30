import { LoadingOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Switch,
  Upload,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Icon from "@/components/Icon";
import PhoneWithCountryCode from "@/components/PhoneWithCountryCode";
import UploadIcon from "@/assets/icons/upload";
import { Post, PostFormData } from "@/utils/request";
import useJobSourceChannelOptions from "@/hooks/useJobSourceChannelOptions";

import styles from "./style.module.less";

type TParseResumeData = {
  resume: string;
  basic_info: unknown;
  resume_path: string;
};

type TFormValues = {
  name: string;
  email: string;
  phone: {
    countryCode: string;
    phoneNumber: string;
  };
  sourceChannel: string;
  notifyInterview: boolean;
};

function normalizeBasicInfo(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function isBlankTalentField(value: string) {
  const s = value.trim();
  return !s || s === "N.A." || s === "N.A";
}

function pickFromBasicInfo(info: Record<string, unknown>) {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const pick = (keys: string[]) => {
    for (const k of keys) {
      const s = str(info[k]);
      if (!isBlankTalentField(s)) {
        return s;
      }
    }
    return "";
  };

  return {
    name: pick(["name"]),
    email: pick(["email"]),
    phoneNumber: pick(["phone_number"]),
    countryCode: pick(["country_code"]) || "+65",
  };
}

interface IProps {
  open: boolean;
  jobId: number;
  onCancel: () => void;
  onSuccess: () => void;
}

const UploadCandidateModal = ({ open, jobId, onCancel, onSuccess }: IProps) => {
  const { t } = useTranslation();
  const tKey = (key: string) => t(`job_details.pipeline_section.${key}`);

  const [form] = Form.useForm<TFormValues>();
  const { options: sourceChannelOptions } = useJobSourceChannelOptions({
    jobId,
  });
  const [resumeContent, setResumeContent] = useState<string | null>(null);
  const [resumePath, setResumePath] = useState<string>("");
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  const resetModal = useCallback(() => {
    setResumeContent(null);
    setResumePath("");
    setResumeFileName("");
    setIsUploadingResume(false);
    setIsSubmitting(false);
    setShowContactForm(false);
    form.resetFields();
  }, [form]);

  useEffect(() => {
    if (!open) {
      resetModal();
    }
  }, [open, resetModal]);

  const applyBasicInfoToForm = useCallback(
    (basicInfoRaw: unknown) => {
      const info = normalizeBasicInfo(basicInfoRaw);
      const picked = pickFromBasicInfo(info);
      form.setFieldsValue({
        name: picked.name,
        email: picked.email,
        phone: {
          countryCode: picked.countryCode || "+65",
          phoneNumber: picked.phoneNumber,
        },
      });
    },
    [form],
  );

  const handleResumeFile = async (file: File) => {
    if (isUploadingResume || !open) {
      return;
    }
    if (!file || !(file instanceof File)) {
      return;
    }

    setIsUploadingResume(true);
    setShowContactForm(false);
    setResumeContent(null);
    form.resetFields();

    const formData = new FormData();
    formData.append("file", file);

    const { code, data } = await PostFormData<TParseResumeData>(
      `/api/talents/parse_resume`,
      formData,
    );

    if (code !== 0 || !data?.resume) {
      message.error(tKey("parse_resume_failed"));
      setIsUploadingResume(false);
      return;
    }

    setResumeContent(data.resume);
    setResumePath(data.resume_path);
    setResumeFileName(file.name);
    applyBasicInfoToForm(data.basic_info);
    setShowContactForm(true);
    message.success(tKey("resume_upload_success"));
    setIsUploadingResume(false);
  };

  const handleSubmit = async () => {
    if (!resumeContent) {
      message.error(tKey("please_upload_resume_first"));
      return;
    }
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      const { code } = await Post(`/api/jobs/${jobId}/talents`, {
        resume: resumeContent,
        name: values.name,
        email: values.email,
        country_code: values.phone.countryCode,
        phone: values.phone.phoneNumber,
        source_channel: values.sourceChannel,
        notify_interview: values.notifyInterview ?? true,
        resume_path: resumePath,
      });
      if (code === 0) {
        message.success(tKey("create_candidate_success"));
        onSuccess();
        onCancel();
      } else {
        message.error(tKey("create_candidate_failed"));
      }
    } catch {
      // validateFields rejected
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={tKey("upload_candidate_modal_title")}
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      width={560}
    >
      <div className={styles.uploadSection}>
        <div className={styles.uploadLabel}>{tKey("resume_label")}</div>
        <Upload.Dragger
          beforeUpload={() => false}
          onChange={(info) => {
            const raw = info.file.originFileObj ?? info.file;
            if (raw instanceof File) {
              void handleResumeFile(raw);
            }
          }}
          showUploadList={false}
          accept=".doc,.docx,.pdf"
          multiple={false}
          disabled={isUploadingResume}
          className={styles.dragger}
        >
          <div className={styles.uploadIconContainer}>
            {resumeFileName ? (
              <span className={styles.fileName}>{resumeFileName}</span>
            ) : isUploadingResume ? (
              <>
                <LoadingOutlined className={styles.uploadingIcon} />
                <span>{tKey("uploading_resume")}</span>
              </>
            ) : (
              <>
                <Icon icon={<UploadIcon />} className={styles.uploadIcon} />
                <div className={styles.uploadHint}>
                  {tKey("resume_upload_hint")}
                </div>
              </>
            )}
          </div>
        </Upload.Dragger>
      </div>

      {showContactForm && (
        <Form
          form={form}
          layout="vertical"
          className={styles.contactForm}
          requiredMark
          initialValues={{ notifyInterview: true, sourceChannel: "persevio" }}
        >
          <Form.Item
            label={tKey("field_name")}
            name="name"
            rules={[{ required: true, message: tKey("field_required") }]}
          >
            <Input placeholder={tKey("field_placeholder")} />
          </Form.Item>
          <Form.Item
            label={tKey("field_email")}
            name="email"
            rules={[
              { required: true, message: tKey("field_required") },
              { type: "email", message: tKey("field_email_invalid") },
            ]}
          >
            <Input placeholder={tKey("field_placeholder")} />
          </Form.Item>
          <Form.Item
            label={tKey("field_phone")}
            name="phone"
            rules={[
              { required: true, message: tKey("field_required") },
              {
                validator: (_, value) => {
                  if (
                    value?.countryCode &&
                    value?.phoneNumber &&
                    String(value.phoneNumber).trim()
                  ) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(tKey("field_phone_invalid")));
                },
              },
            ]}
          >
            <PhoneWithCountryCode />
          </Form.Item>
          <Form.Item
            label={tKey("field_source_channel")}
            name="sourceChannel"
            rules={[
              {
                required: true,
                message: tKey("field_source_channel_required"),
              },
            ]}
          >
            <Select
              placeholder={tKey("field_source_channel_placeholder")}
              options={sourceChannelOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            label={tKey("field_notify_interview")}
            name="notifyInterview"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      )}

      <div className={styles.footer}>
        <Button onClick={onCancel}>{tKey("cancel")}</Button>
        <Button
          type="primary"
          loading={isSubmitting}
          disabled={!showContactForm || !resumeContent}
          onClick={() => void handleSubmit()}
        >
          {tKey("submit_create_candidate")}
        </Button>
      </div>
    </Modal>
  );
};

export default UploadCandidateModal;
