import { message, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { PostFormData } from "@/utils/request";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { useState } from "react";

interface IProps {
  onFinish: () => void;
}

const UploadResume = (props: IProps) => {
  const { onFinish } = props;

  const { t: originalT } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const t = (key: string) => originalT(`candidate_sign.${key}`);

  return (
    <div className={styles.basicInfoWrapper}>
      <div className={styles.title}>{t("upload_your_resume")}</div>
      <div className={styles.uploadWrapper}>
        <Upload
          beforeUpload={() => false}
          onChange={async (fileInfo) => {
            const formData = new FormData();
            formData.append("file", fileInfo.file as any);
            setIsUploading(true);
            message.loading(originalT("uploading"));
            const { code } = await PostFormData(
              `/api/candidate/upload_resume`,
              formData
            );
            if (code === 0) {
              onFinish();
              message.success(t("upload_succeed"));
            } else {
              message.error(t("upload_failed"));
            }
            setIsUploading(false);
          }}
          showUploadList={false}
          accept=".doc,.docx,.pdf"
          multiple={false}
          disabled={isUploading}
        >
          <UploadOutlined className={styles.uploadIcon} />
        </Upload>
        <div className={styles.uploadTips}>{t("upload_tips_1")}</div>
        <div className={styles.uploadTips}>{t("upload_tips_2")}</div>
      </div>
    </div>
  );
};

export default UploadResume;
