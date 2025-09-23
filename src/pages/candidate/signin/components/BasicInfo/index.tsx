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
  LoadingOutlined,
} from "@ant-design/icons";
import React, { useReducer, useState } from "react";

import styles from "./style.module.less";
import { PostFormData } from "@/utils/request";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

export interface TWorkExperience {
  company_name: string;
  position: string;
  work_period_start: Dayjs;
  work_period_end?: Dayjs;
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
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [_, forceUpdate] = useReducer(() => ({}), {});

  const isLinkedinUrlValid = (value: string): boolean => {
    const regex = /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?$/;
    if (!regex.test(value.trim())) return false;
    return true;
  };

  const canSubmit = () => {
    const { name, linkedin_profile_url, work_experience } =
      form.getFieldsValue();

    if (!name) return false;
    if (
      resumeFormat === "linkedin" &&
      (!linkedin_profile_url || !isLinkedinUrlValid(linkedin_profile_url))
    )
      return false;
    if (resumeFormat === "upload" && !resumePath) return false;

    if (resumeFormat === "form") {
      if (!work_experience) return false;

      for (const exp of work_experience) {
        if (
          !exp.company_name ||
          !exp.position ||
          !exp.work_period_start ||
          (!exp.is_current && !exp.work_period_end) ||
          !exp.description
        )
          return false;
      }
    }

    return true;
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

          <Form.Item label="个人信息" required>
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
              <Form.Item
                name="linkedin_profile_url"
                rules={[
                  {
                    validator: (_, value) => {
                      if (!value) {
                        return Promise.reject(
                          new Error("请输入LinkedIn个人主页链接")
                        );
                      }
                      if (!isLinkedinUrlValid(value)) {
                        return Promise.reject(
                          new Error("请输入有效的LinkedIn个人主页链接")
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
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
                <div></div>
                <Upload.Dragger
                  beforeUpload={() => false}
                  onChange={async (fileInfo) => {
                    setIsUploadingResume(true);
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
            )}
            {resumeFormat === "form" && (
              <div className={styles.formWrapper}>
                <Form.List
                  name="work_experience"
                  initialValue={[
                    {
                      company_name: "",
                      position: "",
                      work_period_start: undefined,
                      work_period_end: undefined,
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
                                  style={{
                                    color: "#ff4d4f",
                                    cursor: "pointer",
                                  }}
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
                              <Form.Item
                                {...restField}
                                name={[name, "work_period_start"]}
                                label="在职时间"
                                rules={[
                                  { required: true, message: "请选择开始时间" },
                                ]}
                                style={{ flex: "1" }}
                              >
                                <DatePicker
                                  style={{ width: "100%" }}
                                  picker="month"
                                  disabledDate={(current) => {
                                    if (current && current > dayjs()) {
                                      return true;
                                    }
                                    const endDate = form.getFieldValue([
                                      "work_experience",
                                      name,
                                      "work_period_end",
                                    ]);
                                    if (
                                      endDate &&
                                      current &&
                                      current > endDate
                                    ) {
                                      return true;
                                    }
                                    return false;
                                  }}
                                  placeholder="开始时间"
                                />
                              </Form.Item>
                              <span style={{ position: "relative", top: -30 }}>
                                -
                              </span>
                              <Form.Item
                                {...restField}
                                name={[name, "work_period_end"]}
                                label={" "}
                                rules={[
                                  {
                                    validator: (_, value) => {
                                      if (!isCurrent && !value) {
                                        return Promise.reject(
                                          new Error("请选择结束时间")
                                        );
                                      }
                                      return Promise.resolve();
                                    },
                                  },
                                ]}
                                style={{ flex: "1" }}
                              >
                                <DatePicker
                                  style={{ width: "100%" }}
                                  picker="month"
                                  disabledDate={(current) => {
                                    if (current && current > dayjs()) {
                                      return true;
                                    }
                                    const startDate = form.getFieldValue([
                                      "work_experience",
                                      name,
                                      "work_period_start",
                                    ]);
                                    if (
                                      startDate &&
                                      current &&
                                      current < startDate
                                    ) {
                                      return true;
                                    }
                                    return false;
                                  }}
                                  placeholder="结束时间"
                                  disabled={isCurrent}
                                />
                              </Form.Item>
                              <Form.Item
                                {...restField}
                                name={[name, "is_current"]}
                                valuePropName="checked"
                                style={{
                                  marginBottom: 0,
                                  position: "relative",
                                  top: -25,
                                }}
                              >
                                <Checkbox
                                  onChange={(checked) => {
                                    if (checked) {
                                      form.setFieldValue(
                                        [
                                          "work_experience",
                                          name,
                                          "work_period_end",
                                        ],
                                        undefined
                                      );
                                    }
                                  }}
                                >
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
                            work_period_start: undefined,
                            work_period_end: undefined,
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
          </Form.Item>
        </Form>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Button
            size="large"
            style={{ width: "100%" }}
            type="primary"
            disabled={!canSubmit()}
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
                      ? work_experience.map((exp: any) => ({
                          company_name: exp.company_name,
                          position: exp.position,
                          start_date:
                            exp.work_period_start.format("YYYY-MM-DD"),
                          end_date:
                            !exp.is_current && exp.work_period_end
                              ? exp.work_period_end.format("YYYY-MM-DD")
                              : undefined,
                          is_current: exp.is_current,
                          description: exp.description,
                        }))
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
