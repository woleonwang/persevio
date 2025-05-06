import { Button, message, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import classnames from "classnames";
import { PostFormData } from "@/utils/request";
import styles from "./style.module.less";
import { useState } from "react";

interface IProps {
  state: "upload" | "phone";
  onUpload: (fileId: number) => void;
}

const BasicInfo = (props: IProps) => {
  const { state, onUpload } = props;
  const [fileId, setFileId] = useState<number>();

  return (
    <div className={styles.basicInfoWrapper}>
      <div className={styles.stepWrapper}>
        <div className={classnames(styles.step, styles.active)}>
          Upload resume
        </div>
        <div
          className={classnames(styles.step, {
            [styles.active]: state === "phone",
          })}
        >
          Contact number
        </div>
      </div>
      {state === "upload" && (
        <div>
          <div className={styles.title}>Upload your resume</div>
          <div className={styles.uploadWrapper}>
            <Upload
              beforeUpload={() => false}
              onChange={async (fileInfo) => {
                const formData = new FormData();
                formData.append("file", fileInfo.file as any);
                const { code, data } = await PostFormData(
                  `/api/upload_files`,
                  formData
                );
                if (code === 0) {
                  setFileId(data.upload_file.id);
                  message.success("Upload succeed");
                } else {
                  message.error("Upload failed");
                }
              }}
              showUploadList={false}
              accept=".docx,.pdf"
              multiple={false}
            >
              <UploadOutlined className={styles.uploadIcon} />
            </Upload>
            <div className={styles.uploadTips}>
              Please upload a copy of your resume or your downloaded LinkedIn
              profile.
            </div>
            <div className={styles.uploadTips}>
              Don't worry if it's not perfectly up-to-date! This document is not
              sent to employers. It simply gives our recruiters a starting point
              for our upcoming conversation. After your chat, we'll draft a new,
              polished resume specifically for your job applications.
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 50 }}>
            <Button
              type="primary"
              disabled={!fileId}
              onClick={() => {
                if (fileId) {
                  onUpload(fileId);
                }
              }}
              size="large"
              shape="round"
              style={{ paddingLeft: 30, paddingRight: 30 }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicInfo;
