import { Button, Form, InputNumber, message } from "antd";
import { Get, Post } from "@/utils/request";
import { useNavigate, useParams } from "react-router";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { useEffect, useReducer, useRef, useState } from "react";
import SelectOrUploadTalent from "@/components/SelectOrUploadTalent";
import MarkdownEditor from "@/components/MarkdownEditor";

type TFormValue = {
  round: number;
  talent_id: number;
  last_feedback: string;
};

type TFeedback = {
  id: number;
  talent_id: number;
  round: number;
  feedback_doc: string;
};

interface IProps {
  type: "create" | "edit";
}

const InterviewDesignerForm = (props: IProps) => {
  const { type } = props;

  const { jobId, interviewDesignerId } = useParams();
  const [form] = Form.useForm<TFormValue>();
  const [feedbacks, setFeedbacks] = useState<TFeedback[]>([]);

  const [_, forceUpdate] = useReducer(() => ({}), {});
  const isSubmittingRef = useRef(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const formValues = form.getFieldsValue();

  useEffect(() => {
    if (type === "edit") {
      fetchInterviewDesginer();
    }
  }, []);

  useEffect(() => {
    if (formValues.talent_id) {
      fetchFeedbacks();
    }
  }, [formValues.talent_id]);

  useEffect(() => {
    const lastFeedback =
      formValues.round && formValues.talent_id
        ? feedbacks.find(
            (feedback) =>
              feedback.round === formValues.round - 1 &&
              feedback.talent_id === formValues.talent_id
          )?.feedback_doc
        : undefined;

    form.setFieldsValue({
      last_feedback: lastFeedback,
    });
  }, [formValues.round, feedbacks]);

  const fetchInterviewDesginer = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobId}/interview_designers/${interviewDesignerId}`
    );
    if (code === 0) {
      form.setFieldsValue(data.interview_designer);
    }
  };

  const fetchFeedbacks = async () => {
    const { code, data } = await Get<{
      interview_feedbacks: TFeedback[];
    }>(`/api/jobs/${jobId}/interview_feedbacks`);

    if (code === 0) {
      setFeedbacks(data.interview_feedbacks);
    }
  };

  const submit = () => {
    form.validateFields().then(async (values) => {
      const { round, talent_id, last_feedback } = values;
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      const { code } = await Post(
        type === "create"
          ? `/api/jobs/${jobId}/interview_designers`
          : `/api/jobs/${jobId}/interview_designers/${interviewDesignerId}`,
        {
          talent_id,
          round,
          last_feedback,
        }
      );
      if (code === 0) {
        message.success(
          type === "create" ? "Create succeed" : "Update succeed"
        );
        navigate(`/app/jobs/${jobId}/interview-designers`);
      }
      isSubmittingRef.current = false;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {t(
          type === "create"
            ? "New Interview Design"
            : "Edit Interview Design Context"
        )}
      </div>
      <div className={styles.main}>
        <Form form={form} layout="vertical" onFieldsChange={forceUpdate}>
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

          <Form.Item label={t("Last Round Feedback")} name="last_feedback">
            <MarkdownEditor
              style={{ backgroundColor: "white", padding: 12 }}
              key={formValues.round}
            />
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

export default InterviewDesignerForm;
