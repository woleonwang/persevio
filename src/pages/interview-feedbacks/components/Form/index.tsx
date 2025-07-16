import { Button, Form, Input, InputNumber, message } from "antd";
import { Get, Post } from "@/utils/request";
import { useNavigate, useParams } from "react-router";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";
import SelectOrUploadTalent from "@/components/SelectOrUploadTalent";

type TFormValue = {
  talent_id: number;
  round: number;
  interview_transcript: string;
};

interface IProps {
  type: "create" | "edit";
}

const InterviewFeedbacksForm = (props: IProps) => {
  const { type } = props;

  const { jobId, interviewFeedbackId } = useParams();
  const [form] = Form.useForm<TFormValue>();

  const isSubmittingRef = useRef(false);

  const navigate = useNavigate();
  const { t } = useTranslation();
  // const t = (key: string) => originalT(`create_interview_feedback.${key}`);

  useEffect(() => {
    if (type === "edit") fetchInterviewFeedback();
  }, []);

  const fetchInterviewFeedback = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobId}/interview_feedbacks/${interviewFeedbackId}`
    );
    if (code === 0) {
      form.setFieldsValue(data.interview_feedback);
    }
  };

  const submit = () => {
    form.validateFields().then(async (values) => {
      const { talent_id, round, interview_transcript } = values;
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      const { code } = await Post(
        type == "create"
          ? `/api/jobs/${jobId}/interview_feedbacks`
          : `/api/jobs/${jobId}/interview_feedbacks/${interviewFeedbackId}`,
        {
          talent_id,
          round,
          interview_transcript,
        }
      );
      if (code === 0) {
        message.success(
          type === "create" ? "Create succeed" : "Update succeed"
        );
        navigate(`/app/jobs/${jobId}/interview-feedbacks`);
      }
      isSubmittingRef.current = false;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {t(
          type === "create"
            ? "New Interview Feedback"
            : "Edit Interview Feedback Context"
        )}
      </div>
      <div className={styles.main}>
        <Form form={form} layout="vertical">
          <Form.Item
            label={t("Candidate Resume")}
            name="talent_id"
            rules={[{ required: true }]}
          >
            <SelectOrUploadTalent jobId={parseInt(jobId as string)} />
          </Form.Item>

          <Form.Item
            label={t("Round")}
            name="round"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} />
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
              onClick={submit}
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

export default InterviewFeedbacksForm;
