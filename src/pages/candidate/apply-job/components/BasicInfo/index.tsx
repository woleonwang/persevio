import { Button, Form, Input, message, Upload } from "antd";
import { UploadOutlined, LoadingOutlined } from "@ant-design/icons";
import React, { useReducer, useState } from "react";

import styles from "./style.module.less";
import { PostFormData } from "@/utils/request";

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
      <div className={styles.title}>基本信息</div>
      <div className={styles.container}>
        <Form
          form={form}
          layout="vertical"
          onFieldsChange={() => forceUpdate()}
        >
          <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="手机号码" name="phone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            label="个人简历"
            required
            rules={[
              {
                validator: () => {
                  if (!resumePath) {
                    return Promise.reject(new Error("请上传简历/个人资料"));
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
                  message.success("上传成功");
                  setResumePath(data.resume);
                  console.log("resume:", data.resume);
                  setResumeFileName(fileInfo.file.name);
                } else {
                  message.error("上传失败");
                }
                setIsUploadingResume(false);
              }}
              showUploadList={false}
              accept=".doc,.docx,.pdf"
              multiple={false}
            >
              {resumeFileName ? (
                <div>{resumeFileName}</div>
              ) : isUploadingResume ? (
                <div>
                  <LoadingOutlined className={styles.uploadingIcon} />
                  上传简历中...
                </div>
              ) : (
                <div>
                  <UploadOutlined className={styles.uploadIcon} />
                  <div>支持上传.doc,.docx,.pdf格式文件</div>
                </div>
              )}
            </Upload.Dragger>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 40, textAlign: "center" }}>
          <Button
            size="large"
            style={{ width: "100%" }}
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
            下一步
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BasicInfo;
