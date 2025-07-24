import { Button, Form, message } from "antd";
import { Get, Post } from "@/utils/request";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { useEffect, useReducer, useRef, useState } from "react";
import MarkdownEditor from "@/components/MarkdownEditor";

type TFormValue = {
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
  jobId: number;
  talentId: number;
  round: number;
  interviewDesignerId?: number;
  onFinish: () => void;
  onCancel?: () => void;
}

const InterviewDesignerForm = (props: IProps) => {
  const {
    type,
    jobId,
    talentId,
    round,
    interviewDesignerId,
    onFinish,
    onCancel,
  } = props;

  const [form] = Form.useForm<TFormValue>();
  const [feedbacks, setFeedbacks] = useState<TFeedback[]>([]);

  const [_, forceUpdate] = useReducer(() => ({}), {});
  const isSubmittingRef = useRef(false);

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`interview_designer.${key}`);

  useEffect(() => {
    if (type === "edit") {
      fetchInterviewDesginer();
    } else {
      fetchFeedbacks();
    }
  }, []);

  useEffect(() => {
    const lastFeedback = feedbacks.find(
      (feedback) =>
        feedback.round === round - 1 && feedback.talent_id === talentId
    )?.feedback_doc;

    form.setFieldsValue({
      last_feedback: lastFeedback,
    });
  }, [feedbacks]);

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
      const { last_feedback } = values;
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      const { code } = await Post(
        type === "create"
          ? `/api/jobs/${jobId}/interview_designers`
          : `/api/jobs/${jobId}/interview_designers/${interviewDesignerId}`,
        {
          talent_id: talentId,
          round,
          last_feedback,
        }
      );
      if (code === 0) {
        message.success(
          type === "create"
            ? originalT("create_succeed")
            : originalT("update_succeed")
        );
        onFinish();
      }
      isSubmittingRef.current = false;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <Form form={form} layout="vertical" onFieldsChange={forceUpdate}>
          <Form.Item label={t("last_round_feedback")} name="last_feedback">
            <MarkdownEditor
              style={{ backgroundColor: "white", padding: 12, height: "600px" }}
            />
          </Form.Item>
          <div style={{ marginTop: 24 }}>
            <Button
              type="primary"
              onClick={submit}
              disabled={isSubmittingRef.current}
            >
              {originalT("submit")}
            </Button>

            {type === "edit" && (
              <Button
                onClick={() => onCancel?.()}
                disabled={isSubmittingRef.current}
                style={{ marginLeft: 12 }}
              >
                {originalT("cancel")}
              </Button>
            )}
          </div>
        </Form>
      </div>
    </div>
  );
};

export default InterviewDesignerForm;
