import { useState } from "react";
import { Button, Empty, Form, Input, message, Tooltip } from "antd";
import { parseJSON } from "@/utils";
import { Post } from "@/utils/request";
import { useTranslation } from "react-i18next";

import styles from "./style.module.less";
import MarkdownContainer from "@/components/MarkdownContainer";

interface IProps {
  jobId: number;
  interviewerName: string;
  signalTitle: string;
  interviewFeedback: TInterviewFeedback;
  type: "others" | "dangers";
  isPreview?: boolean;
  onSubmit: () => void;
}

type TFormValue = {
  title: string;
  basis: string;
};

const FeedbackCustomizeSignal = (props: IProps) => {
  const {
    jobId,
    interviewerName,
    signalTitle,
    type,
    interviewFeedback,
    isPreview,
    onSubmit,
  } = props;

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`talent.${key}`);

  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm<TFormValue>();

  const interviewFeedbackDetail = parseJSON(
    interviewFeedback.feedback_json
  ) as TInterviewFeedbackDetail;

  const currentSignalFeedback = (
    type === "others"
      ? interviewFeedbackDetail.other_signals
      : interviewFeedbackDetail.dangers
  )?.find((signalFeedback) => signalFeedback.title === signalTitle);

  const submitSignalFeedback = () => {
    form.validateFields().then(async (values) => {
      const newInterviewFeedbackDetail: TInterviewFeedbackDetail = JSON.parse(
        JSON.stringify(interviewFeedbackDetail)
      );

      (type === "others"
        ? newInterviewFeedbackDetail.other_signals
        : newInterviewFeedbackDetail.dangers
      ).forEach((signalFeedback) => {
        if (signalFeedback.title === signalTitle) {
          signalFeedback.title = values.title;
          signalFeedback.basis = values.basis;
        }
      });

      const { code } = await Post(
        `/api/jobs/${jobId}/interview_feedbacks/${interviewFeedback.id}/json`,
        {
          feedback_json: JSON.stringify(newInterviewFeedbackDetail),
        }
      );
      if (code === 0) {
        message.success(t("feedback_summary.update_success"));
        onSubmit();
        setIsEditing(false);
      }
    });
  };

  if (!currentSignalFeedback) return <Empty description={t("feedback_customize_signal.no_data")} />;

  return (
    <div>
      <div>
        <div>
          <div className={styles.interviewer}>
            {t("feedback_summary.interviewer")}{interviewFeedback.round}
          </div>
          <div className={styles.name}>{interviewerName}</div>
        </div>
        {isEditing ? (
          <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
            <Form.Item name="title" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item
              name="basis"
              label={t("feedback_customize_signal.judgment_basis")}
              rules={[{ required: true }]}
            >
              <Input.TextArea />
            </Form.Item>

            <div style={{ marginTop: 8 }}>
              <Button
                type="primary"
                onClick={() => submitSignalFeedback()}
                shape="round"
              >
                {t("feedback_customize_signal.save")}
              </Button>
              <Button
                shape="round"
                style={{ marginLeft: 8 }}
                onClick={() => setIsEditing(false)}
              >
                {t("feedback_customize_signal.cancel")}
              </Button>
            </div>
          </Form>
        ) : (
          <>
            <div className={styles.signalTitle}>
              {currentSignalFeedback.title}
            </div>
            <div style={{ marginTop: 8 }}>
              <MarkdownContainer content={currentSignalFeedback?.basis ?? ""} />
            </div>
            <div style={{ marginTop: 8 }}>
              {!isPreview && (
                <Button
                  type="primary"
                  onClick={() => {
                    setIsEditing(true);
                    form.setFieldsValue({
                      ...currentSignalFeedback,
                    });
                  }}
                  shape="round"
                >
                  {t("feedback_customize_signal.edit")}
                </Button>
              )}
              <Tooltip
                title={currentSignalFeedback.evidences}
                trigger={"click"}
                styles={{ body: { whiteSpace: "pre-wrap" } }}
              >
                <Button shape="round" style={{ marginLeft: 8 }}>
                  {t("feedback_customize_signal.evidence")}
                </Button>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackCustomizeSignal;
