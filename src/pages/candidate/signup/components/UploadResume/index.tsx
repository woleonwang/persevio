import { Button, Form, message, Upload } from "antd";
import { useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";

import { PostFormData } from "@/utils/request";
import Icon from "@/components/Icon";
import UploadIcon from "@/assets/icons/upload";

import styles from "./style.module.less";

interface IProps {
  isSubmitting: boolean;
  initialResumePath: string;
  onFinish: (resumePath: string) => void;
  onBack: () => void;
}

const UploadResume = (props: IProps) => {
  const { isSubmitting, initialResumePath, onFinish, onBack } = props;
  const [resumePath, setResumePath] = useState<string>(initialResumePath);
  const [resumeFileName, setResumeFileName] = useState<string>();
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const [form] = Form.useForm<{ resumePath: string }>();

  const canSubmit = () => {
    return !!resumePath;
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}> Provide Your Basic Information</div>
      <div className={styles.hint}>
        We need this information to create your application and keep you updated
        on its progress.
      </div>
      <div className={styles.formContainer}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="resumePath"
            rules={[{ required: true }]}
            label="Resume"
          >
            <Upload.Dragger
              beforeUpload={() => false}
              onChange={async (fileInfo) => {
                setIsUploadingResume(true);
                const formData = new FormData();
                formData.append("file", fileInfo.file as any);
                const { code, data } = await PostFormData(
                  `/api/upload_resume`,
                  formData
                );
                if (code === 0) {
                  message.success("Upload successful");
                  setResumePath(data.resume);
                  console.log("resume:", data.resume);
                  setResumeFileName(fileInfo.file.name);
                } else {
                  message.error(data.message);
                }
                setIsUploadingResume(false);
              }}
              showUploadList={false}
              accept=".doc,.docx,.pdf"
              multiple={false}
            >
              <div className={styles.uploadIconContainer}>
                {resumeFileName ? (
                  resumeFileName
                ) : isUploadingResume ? (
                  <>
                    <LoadingOutlined className={styles.uploadingIcon} />
                    Uploading resume...
                  </>
                ) : (
                  <>
                    <Icon icon={<UploadIcon />} className={styles.uploadIcon} />
                    <div>Support uploading .doc,.docx,.pdf format files</div>
                  </>
                )}
              </div>
            </Upload.Dragger>
          </Form.Item>
        </Form>

        <div
          style={{
            marginTop: 52,
            textAlign: "center",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Button
            size="large"
            style={{ flex: 1, height: 44, borderRadius: 12 }}
            type="default"
            onClick={() => {
              onBack();
            }}
          >
            Previous Step
          </Button>
          <Button
            size="large"
            style={{ flex: 1, height: 44, borderRadius: 12 }}
            type="primary"
            disabled={!canSubmit()}
            onClick={() => {
              if (!canSubmit()) return;
              onFinish(resumePath ?? "");
            }}
            loading={isSubmitting}
          >
            {isSubmitting ? "Analyzing resume..." : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadResume;
