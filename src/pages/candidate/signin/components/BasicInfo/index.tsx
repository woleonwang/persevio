import { Button, DatePicker, Form, Input, message, Radio, Upload } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import React, { useState } from "react";

import styles from "./style.module.less";
import { PostFormData } from "@/utils/request";
import type { Dayjs } from "dayjs";

export interface TBasicInfoFormValues {
  name: string;
  linkedin_profile_url: string;

  company_name: string;
  position: string;
  work_period: [Dayjs, Dayjs];
  description: string;
}

export interface TBaiscInfo {
  name: string;
  avatar?: string;
  linkedin_profile_url?: string;
  resume_path?: string;
  work_experience?: {
    company_name: string;
    position: string;
    start_date: string;
    end_date: string;
    description: string;
  };
}

interface IProps {
  onFinish: (params: TBaiscInfo) => void;
}

const BasicInfo: React.FC<IProps> = (props) => {
  const [form] = Form.useForm<TBasicInfoFormValues>();
  const [avatar, setAvatar] = useState<string>();
  const [resumePath, setResumePath] = useState<string>();
  const [resumeFileName, setResumeFileName] = useState<string>();
  const [resumeFormat, setResumeFormat] = useState<
    "linkedin" | "upload" | "form"
  >("linkedin");

  return (
    <div className={styles.container}>
      <div className={styles.title}>基本信息</div>
      <div className={styles.container}>
        <Form form={form} layout="vertical">
          <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="头像">
            <Upload
              action="/api/candidate/network/avatar"
              accept="image/*"
              maxCount={1}
              listType="picture-card"
              showUploadList={false}
              headers={{
                authorization: localStorage.getItem("candidate_token") || "",
              }}
              onChange={(info) => {
                if (info.file.status === "done") {
                  setAvatar(info.file.response.data.avatar);
                } else if (info.file.status === "error") {
                  message.error("上传失败");
                }
              }}
            >
              {avatar ? (
                <img
                  src={`/api/avatar/${avatar}`}
                  alt="avatar"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    width: "auto",
                    height: "auto",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              ) : (
                <button style={{ border: 0, background: "none" }} type="button">
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </button>
              )}
            </Upload>
          </Form.Item>

          <Radio.Group
            value={resumeFormat}
            onChange={(e) => setResumeFormat(e.target.value)}
            style={{ marginBottom: 16 }}
          >
            <Radio value="linkedin">LinkedIn Profile</Radio>
            <Radio value="upload">上传简历/个人资料</Radio>
            <Radio value="form">简要概述工作内容</Radio>
          </Radio.Group>

          {resumeFormat === "linkedin" && (
            <Form.Item name="linkedin_profile_url" rules={[{ required: true }]}>
              <Input placeholder="例如: https://www.linkedin.com/in/tiangengxinjacky" />
            </Form.Item>
          )}
          {resumeFormat === "upload" && (
            <Form.Item
              name="resume_path"
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
              <Upload.Dragger
                beforeUpload={() => false}
                onChange={async (fileInfo) => {
                  const formData = new FormData();
                  formData.append("file", fileInfo.file as any);
                  const { code, data } = await PostFormData(
                    `/api/candidate/network/resume`,
                    formData
                  );
                  if (code === 0) {
                    message.success("上传成功");
                    setResumePath(data.resume);
                    setResumeFileName(fileInfo.file.name);
                  } else {
                    message.error("上传失败");
                  }
                }}
                showUploadList={false}
                accept=".doc,.docx,.pdf"
                multiple={false}
              >
                {resumeFileName ? (
                  <div>{resumeFileName}</div>
                ) : (
                  <div>
                    <UploadOutlined className={styles.uploadIcon} />
                    <div>支持上传.doc,.docx,.pdf格式文件</div>
                  </div>
                )}
              </Upload.Dragger>
            </Form.Item>
          )}
          {resumeFormat === "form" && (
            <div className={styles.formWrapper}>
              <Form.Item
                label="公司名称"
                name="company_name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="职位名称"
                name="position"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="在职时间"
                name="work_period"
                rules={[{ required: true }]}
              >
                <DatePicker.RangePicker style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                label="工作内容"
                name="description"
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={4} placeholder="请简要概述工作内容" />
              </Form.Item>
            </div>
          )}
        </Form>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Button
            size="large"
            style={{ width: "100%" }}
            type="primary"
            onClick={() => {
              form.validateFields().then(async (values) => {
                const {
                  name,
                  linkedin_profile_url,
                  company_name,
                  position,
                  work_period,
                  description,
                } = values;
                const params = {
                  name,
                  avatar,
                  linkedin_profile_url:
                    resumeFormat === "linkedin" ? linkedin_profile_url : "",
                  resume_path: resumeFormat === "upload" ? resumePath : "",
                  work_experience:
                    resumeFormat === "form"
                      ? {
                          company_name,
                          position,
                          start_date: work_period[0].format("YYYY-MM-DD"),
                          end_date: work_period[1].format("YYYY-MM-DD"),
                          description,
                        }
                      : undefined,
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
