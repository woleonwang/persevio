import { InboxOutlined } from "@ant-design/icons";
import { Button, Upload, message } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import TextAreaWithVoice from "@/components/TextAreaWithVoice";
import { Post, PostFormData } from "@/utils/request";

import styles from "./style.module.less";

type IProps = {
  jobId: number;
  onSuccess: () => void;
};

const RoleBriefingStage = ({ jobId, onSuccess }: IProps) => {
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [parsedFileText, setParsedFileText] = useState("");
  const [manualText, setManualText] = useState("");
  const { t: originalT } = useTranslation();
  const t = (key: string, args?: Record<string, string>) =>
    originalT(`job_board.${key}`, args);

  const mergedContent = useMemo(() => {
    return [parsedFileText.trim(), manualText.trim()]
      .filter(Boolean)
      .join("\n\n");
  }, [parsedFileText, manualText]);

  const handleFileUpload = async (file: File) => {
    const fileExt = (file.name || "").split(".").pop()?.toLowerCase();
    if (!fileExt || !["pdf", "docx", "txt", "md"].includes(fileExt)) {
      message.error(t("role_briefing_file_type_error"));
      return false;
    }

    setIsParsingFile(true);
    setUploadedFileName(file.name);
    setParsedFileText("");

    const formData = new FormData();
    formData.append("file", file);
    const { code, data } = await PostFormData<{ parsed_content?: string }>(
      "/api/extract_file_text",
      formData,
    );
    setIsParsingFile(false);

    if (code === 0) {
      setParsedFileText(data?.parsed_content ?? "");
      message.success(t("role_briefing_file_uploaded"));
    } else {
      message.error(t("role_briefing_parse_failed"));
      setUploadedFileName("");
    }

    return false;
  };

  const handleSubmit = async () => {
    if (isParsingFile || isSubmitting) return;
    if (!mergedContent) {
      message.error(t("role_briefing_empty_content"));
      return;
    }

    setIsSubmitting(true);
    const { code } = await Post(`/api/jobs/${jobId}/document`, {
      type: "reference",
      content: mergedContent,
    });
    setIsSubmitting(false);

    if (code === 0) {
      message.success(originalT("submit_succeed"));
      onSuccess();
    } else {
      message.error(originalT("submit_failed"));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>{t("role_briefing_title")}</div>
        <div className={styles.hint}>{t("role_briefing_hint")}</div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          {t("role_briefing_upload_title")}
        </div>
        <Upload.Dragger
          beforeUpload={handleFileUpload}
          showUploadList={false}
          accept=".pdf,.docx,.txt,.md"
          multiple={false}
          className={styles.uploadArea}
          disabled={isParsingFile || isSubmitting}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className={styles.uploadTitle}>{t("role_briefing_upload_hint")}</p>
        </Upload.Dragger>
        {!!uploadedFileName && (
          <div className={styles.uploadResult}>
            {isParsingFile
              ? t("role_briefing_file_parsing", { fileName: uploadedFileName })
              : t("role_briefing_file_uploaded_name", {
                  fileName: uploadedFileName,
                })}
          </div>
        )}
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          {t("role_briefing_manual_title")}
        </div>
        <TextAreaWithVoice
          value={manualText}
          onChange={setManualText}
          rows={8}
          placeholder={t("role_briefing_text_placeholder")}
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.footer}>
        <Button
          type="primary"
          loading={isSubmitting}
          disabled={isParsingFile}
          onClick={handleSubmit}
        >
          {t("role_briefing_submit")}
        </Button>
      </div>
    </div>
  );
};

export default RoleBriefingStage;
