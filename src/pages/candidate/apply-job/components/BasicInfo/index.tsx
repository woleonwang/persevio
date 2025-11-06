import { Button, Form, Input, message, Upload } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import React, { useReducer, useState } from "react";
import UploadIcon from "@/assets/icons/upload";

import styles from "./style.module.less";
import { PostFormData } from "@/utils/request";
import Icon from "@/components/Icon";

export interface TBaiscInfo {
  name: string;
  phone: string;
  email: string;
  resume_path: string;
}

interface IProps {
  onFinish: (params: TBaiscInfo) => void;
}

const BasicInfo: React.FC<IProps> = (props) => {
  const [form] = Form.useForm<TBaiscInfo>();
  const [resumePath, setResumePath] = useState<string>();
  const [resumeFileName, setResumeFileName] = useState<string>();
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [_, forceUpdate] = useReducer(() => ({}), {});

  const canSubmit = () => {
    const { name, phone, email } = form.getFieldsValue();
    return name && phone && email && resumePath;
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}> Provide Your Basic Information</div>
      <div className={styles.hint}>
        We need this information to create your application and keep you updated
        on its progress.
      </div>
      <div className={styles.formContainer}>
        <Form
          form={form}
          layout="vertical"
          onFieldsChange={() => forceUpdate()}
        >
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="Please fill in" />
          </Form.Item>
          <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
            <Input placeholder="Please fill in" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true }]}>
            <Input placeholder="Please fill in" />
          </Form.Item>

          <Form.Item
            label="Resume"
            required
            rules={[
              {
                validator: () => {
                  if (!resumePath) {
                    return Promise.reject(
                      new Error("Please upload resume/personal information")
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <div></div>
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
                  message.error("Upload failed");
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

        <div style={{ marginTop: 52, textAlign: "center" }}>
          <Button
            size="large"
            style={{ width: "100%", height: 44, borderRadius: 12 }}
            type="primary"
            disabled={!canSubmit()}
            onClick={() => {
              form.validateFields().then(async (values) => {
                const { name, phone, email } = values;
                const params = {
                  name,
                  phone,
                  email,
                  resume_path: resumePath ?? "",
                };
                props.onFinish(params);
              });
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BasicInfo;
