import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Radio,
  Upload,
  Card,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import React, { useReducer, useState } from "react";

import styles from "./style.module.less";
import { PostFormData } from "@/utils/request";
import type { Dayjs } from "dayjs";

export interface TWorkExperience {
  company_name: string;
  position: string;
  work_period: [Dayjs, Dayjs];
  work_period_start: Dayjs;
  is_current: boolean;
  description: string;
}

export interface TBasicInfoFormValues {
  name: string;
  linkedin_profile_url: string;
  work_experience: TWorkExperience[];
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
    end_date?: string;
    is_current?: boolean;
    description: string;
  }[];
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
  const [_, forceUpdate] = useReducer(() => ({}), {});

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
                    console.log("resume path:", resumePath);
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
                  const formData = new FormData();
                  formData.append("file", fileInfo.file as any);
                  const { code, data } = await PostFormData(
                    `/api/candidate/network/resume`,
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
              <Form.List
                name="work_experience"
                initialValue={[
                  {
                    company_name: "",
                    position: "",
                    work_period: undefined,
                    is_current: false,
                    description: "",
                  },
                ]}
              >
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => {
                      const isCurrent = form.getFieldValue([
                        "work_experience",
                        name,
                        "is_current",
                      ]);
                      return (
                        <Card
                          key={key}
                          size="small"
                          style={{ marginBottom: 16 }}
                        >
                          <div
                            style={{
                              marginBottom: 16,
                              fontWeight: "bold",
                              color: "#1890ff",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span>工作经历 {name + 1}</span>
                            {fields.length > 1 && (
                              <DeleteOutlined
                                onClick={() => remove(name)}
                                style={{ color: "#ff4d4f", cursor: "pointer" }}
                              />
                            )}
                          </div>
                          <Form.Item
                            {...restField}
                            name={[name, "company_name"]}
                            label="公司名称"
                            rules={[
                              { required: true, message: "请输入公司名称" },
                            ]}
                          >
                            <Input />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, "position"]}
                            label="职位名称"
                            rules={[
                              { required: true, message: "请输入职位名称" },
                            ]}
                          >
                            <Input />
                          </Form.Item>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "flex-end",
                            }}
                          >
                            {isCurrent ? (
                              <Form.Item
                                {...restField}
                                name={[name, "work_period_start"]}
                                label="在职时间"
                                rules={[
                                  { required: true, message: "请选择开始时间" },
                                ]}
                                style={{ flex: "auto" }}
                              >
                                <DatePicker
                                  style={{ width: "100%" }}
                                  picker="month"
                                />
                              </Form.Item>
                            ) : (
                              <Form.Item
                                {...restField}
                                name={[name, "work_period"]}
                                label="在职时间"
                                rules={[
                                  { required: true, message: "请选择在职时间" },
                                ]}
                                style={{ flex: "auto" }}
                              >
                                <DatePicker.RangePicker
                                  style={{ width: "100%" }}
                                  picker="month"
                                />
                              </Form.Item>
                            )}
                            <Form.Item
                              {...restField}
                              name={[name, "is_current"]}
                              valuePropName="checked"
                            >
                              <Checkbox onChange={() => forceUpdate()}>
                                至今
                              </Checkbox>
                            </Form.Item>
                          </div>
                          <Form.Item
                            {...restField}
                            name={[name, "description"]}
                            label="工作内容"
                            rules={[
                              { required: true, message: "请输入工作内容" },
                            ]}
                          >
                            <Input.TextArea
                              rows={4}
                              placeholder="请简要概述工作内容"
                            />
                          </Form.Item>
                        </Card>
                      );
                    })}
                    <Button
                      type="dashed"
                      onClick={() =>
                        add({
                          company_name: "",
                          position: "",
                          work_period: undefined,
                          is_current: false,
                          description: "",
                        })
                      }
                      block
                      icon={<PlusOutlined />}
                      style={{ marginBottom: 16 }}
                    >
                      添加工作经历
                    </Button>
                  </>
                )}
              </Form.List>
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
                const { name, linkedin_profile_url, work_experience } = values;
                const params = {
                  name,
                  avatar,
                  linkedin_profile_url:
                    resumeFormat === "linkedin" ? linkedin_profile_url : "",
                  resume_path: resumeFormat === "upload" ? resumePath : "",
                  work_experience:
                    resumeFormat === "form"
                      ? work_experience.map((exp: TWorkExperience) => ({
                          company_name: exp.company_name,
                          position: exp.position,
                          start_date: (exp.is_current
                            ? exp.work_period_start
                            : exp.work_period[0]
                          ).format("YYYY-MM-DD"),
                          end_date:
                            !exp.is_current && exp.work_period[1]
                              ? exp.work_period[1].format("YYYY-MM-DD")
                              : undefined,
                          is_current: exp.is_current,
                          description: exp.description,
                        }))
                      : undefined,
                };

                console.log("params:", params);
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
