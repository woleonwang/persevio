import { Button, Form, Input, message } from "antd";
import { Get, Post } from "../../../utils/request";
import { useNavigate, useParams } from "react-router";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";

type TFormValue = {
  name: string;
  interview_design: string;
  interview_transcript: string;
  resume: string;
};
const InterviewFeedbacksEdit = () => {
  const { jobId, interviewFeedbackId } = useParams();
  const [form] = Form.useForm<TFormValue>();

  const isSubmittingRef = useRef(false);

  const navigate = useNavigate();
  const { t } = useTranslation();
  // const t = (key: string) => originalT(`edit_interview_feedback.${key}`);

  useEffect(() => {
    fetchInterviewDesginer();
  }, []);

  const fetchInterviewDesginer = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobId}/interview_feedbacks/${interviewFeedbackId}`
    );
    if (code === 0) {
      form.setFieldsValue(data.interview_feedback);
    }
  };

  const updateInterviewFeedback = () => {
    form.validateFields().then(async (values) => {
      const { resume, name, interview_design, interview_transcript } = values;
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      const { code } = await Post(
        `/api/jobs/${jobId}/interview_feedbacks/${interviewFeedbackId}`,
        {
          name,
          resume,
          interview_design,
          interview_transcript,
        }
      );
      if (code === 0) {
        message.success("Update succeed");
      }
      isSubmittingRef.current = false;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {t("Edit Interview Feedback Context")}
      </div>
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
              onClick={updateInterviewFeedback}
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

export default InterviewFeedbacksEdit;
