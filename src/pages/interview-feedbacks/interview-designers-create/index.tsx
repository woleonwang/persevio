import { Button, Form, Input, message, Upload } from "antd";
import { Post, PostFormData } from "../../../utils/request";
import { useNavigate, useParams } from "react-router";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { useRef } from "react";

type TFormValue = {
  name: string;
  interview_design: string;
  interview_transcript: string;
  resume: string;
};
const InterviewFeedbacksCreate = () => {
  const { jobId } = useParams();
  const [form] = Form.useForm<TFormValue>();

  const isSubmittingRef = useRef(false);

  const navigate = useNavigate();
  const { t } = useTranslation();
  // const t = (key: string) => originalT(`create_interview_feedback.${key}`);

  const createInterviewFeedback = () => {
    form.validateFields().then(async (values) => {
      const { resume, name, interview_design, interview_transcript } = values;
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      const { code } = await Post(`/api/jobs/${jobId}/interview_feedbacks`, {
        name,
        resume,
        interview_design,
        interview_transcript,
      });
      if (code === 0) {
        message.success("Create succeed");
        navigate(`/app/jobs/${jobId}/interview-feedbacks`);
      }
      isSubmittingRef.current = false;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>{t("New Interview Feedback")}</div>
      <div className={styles.main}>
        <Form form={form} layout="vertical">
          <Form.Item label={t("Name")} name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label={t("Candidate Resume")}
            name="resume"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={10} />
          </Form.Item>
          <Upload
            beforeUpload={() => false}
            onChange={async (fileInfo) => {
              const formData = new FormData();
              formData.append("file", fileInfo.file as any);
              const { code, data } = await PostFormData(
                `/api/jobs/${jobId}/upload_resume_for_interview_design`,
                formData
              );
              if (code === 0) {
                message.success("Upload succeed");
                form.setFieldValue("resume", data.resume);
              } else {
                message.error("Upload failed");
              }
            }}
            showUploadList={false}
            accept=".docx,.pdf"
            multiple={false}
          >
            <Button type="primary" style={{ marginBottom: 16 }}>
              Upload Resume
            </Button>
          </Upload>
          <Form.Item label={t("Interview Plan")} name="interview_design">
            <Input.TextArea rows={10} />
          </Form.Item>
          <Form.Item
            label={t("Interview Transcript")}
            name="interview_transcript"
          >
            <Input.TextArea rows={10} />
          </Form.Item>
          <div style={{ marginTop: 24 }}>
            <Button
              type="primary"
              onClick={createInterviewFeedback}
              disabled={isSubmittingRef.current}
            >
              {t("submit")}
            </Button>

            <Button
              type="default"
              onClick={() => navigate(-1)}
              style={{ marginLeft: 12 }}
            >
              {t("back")}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default InterviewFeedbacksCreate;
