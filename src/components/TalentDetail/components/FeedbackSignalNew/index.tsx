import { useState } from "react";
import { Button, Empty, Form, Input, message, Radio, Tooltip } from "antd";
import { parseJSON } from "@/utils";
import { Post } from "@/utils/request";
import { useTranslation } from "react-i18next";

import styles from "./style.module.less";
import MarkdownContainer from "@/components/MarkdownContainer";

interface IProps {
  jobId: number;
  interviewerName: string;
  groupKey: string;
  signalKey: string;
  interviewFeedback: TInterviewFeedback;
  isPreview?: boolean;
  onSubmit: () => void;
}

const FeedbackSignalNew = (props: IProps) => {
  const {
    jobId,
    interviewerName,
    groupKey,
    signalKey,
    interviewFeedback,
    isPreview,
    onSubmit,
  } = props;

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`talent.${key}`);

  // 动态生成信号评估选项，使用国际化
  const getSignalEvaluationOptions = () => {
    switch (groupKey) {
      case "experience_contextual_fit":
        return [
          {
            label: t("feedback_signal.over_qualified"),
            value: "over_qualified" as TEvaluation,
            color: "#1FAC6A",
          },
          {
            label: t("feedback_signal.more_senior"),
            value: "more_senior" as TEvaluation,
            color: "#1FAC6A",
          },
          {
            label: t("feedback_signal.meets_seniority_bar"),
            value: "meets_seniority_bar" as TEvaluation,
            color: "#1FAC6A",
          },
          {
            label: t("feedback_signal.slightly_junior"),
            value: "slightly_junior" as TEvaluation,
            color: "#CC0000",
          },
          {
            label: t("feedback_signal.too_junior"),
            value: "too_junior" as TEvaluation,
            color: "#CC0000",
          },
          {
            label: t("feedback_signal.uncertain_not_assessed"),
            value: "uncertain_not_assessed" as TEvaluation,
            color: "rgb(33, 53, 71)",
          },
        ];

      case "key_responsibilities":
        return [
          {
            label: t("feedback_signal.directly_relevant"),
            value: "directly_relevant" as TEvaluation,
            color: "#1FAC6A",
          },
          {
            label: t("feedback_signal.highly_transferable"),
            value: "highly_transferable" as TEvaluation,
            color: "#1FAC6A",
          },
          {
            label: t("feedback_signal.partially_transferable"),
            value: "partially_transferable" as TEvaluation,
            color: "#1FAC6A",
          },
          {
            label: t("feedback_signal.no_relevant"),
            value: "no_relevant" as TEvaluation,
            color: "#CC0000",
          },
          {
            label: t("feedback_signal.uncertain_not_assessed"),
            value: "uncertain_not_assessed" as TEvaluation,
            color: "rgb(33, 53, 71)",
          },
        ];

      case "working_environment":
        return [
          {
            label: t("feedback_signal.identical_environment"),
            value: "identical_environment" as TEvaluation,
            color: "#1FAC6A",
          },
          {
            label: t("feedback_signal.similar_environment"),
            value: "similar_environment" as TEvaluation,
            color: "#1FAC6A",
          },
          {
            label: t("feedback_signal.different_environment"),
            value: "different_environment" as TEvaluation,
            color: "#CC0000",
          },
          {
            label: t("feedback_signal.uncertain_not_assessed"),
            value: "uncertain_not_assessed" as TEvaluation,
            color: "rgb(33, 53, 71)",
          },
        ];

      default:
        return [
          {
            label: t("feedback_signal.exceeds_expectations"),
            value: "exceeds" as TEvaluation,
            color: "#1FAC6A",
          },
          {
            label: t("feedback_signal.meets_standards"),
            value: "meets" as TEvaluation,
            color: "#1FAC6A",
          },
          {
            label: t("feedback_signal.likely_meets"),
            value: "likely_meets" as TEvaluation,
            color: "#1FAC6A",
          },
          {
            label: t("feedback_signal.likely_does_not_meet"),
            value: "likely_does_not_meet" as TEvaluation,
            color: "#CC0000",
          },
          {
            label: t("feedback_signal.does_not_meet"),
            value: "does_not_meet" as TEvaluation,
            color: "#CC0000",
          },
          {
            label: t("feedback_signal.uncertain"),
            value: "uncertain" as TEvaluation,
            color: "rgb(33, 53, 71)",
          },
          {
            label: t("feedback_signal.not_assessed"),
            value: "not_assessed" as TEvaluation,
            color: "rgb(33, 53, 71)",
          },
        ];
    }
  };

  const signalEvaluationOptions = getSignalEvaluationOptions();

  type TFormValue = {
    evaluation: TEvaluation;
    basis: string;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm<TFormValue>();

  const interviewFeedbackDetail = parseJSON(
    interviewFeedback.feedback_json
  ) as TInterviewFeedbackDetail;

  const currentSingleFeedback = interviewFeedbackDetail.predefine_signals?.find(
    (signalFeedback) => signalFeedback.key === signalKey
  );

  const submitSignalFeedback = () => {
    form.validateFields().then(async (values) => {
      const newInterviewFeedbackDetail: TInterviewFeedbackDetail = JSON.parse(
        JSON.stringify(interviewFeedbackDetail)
      );

      newInterviewFeedbackDetail.predefine_signals.forEach((signalFeedback) => {
        if (signalFeedback.key === signalKey) {
          signalFeedback.evaluation = values.evaluation;
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

  return (
    <div>
      <div>
        <div>
          <div className={styles.interviewer}>
            {t("feedback_summary.interviewer")}
            {interviewFeedback.round}
          </div>
          <div className={styles.name}>{interviewerName}</div>
        </div>
        {!currentSingleFeedback ? (
          <Empty description={t("feedback_signal.no_data")} />
        ) : isEditing ? (
          <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
            <Form.Item
              name="evaluation"
              label={t("feedback_signal.evaluation_result")}
              rules={[{ required: true }]}
            >
              <Radio.Group options={signalEvaluationOptions} size="small" />
            </Form.Item>

            <Form.Item
              name="basis"
              label={t("feedback_signal.basis")}
              rules={[{ required: true }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            <div style={{ marginTop: 8 }}>
              <Button
                type="primary"
                onClick={() => submitSignalFeedback()}
                shape="round"
              >
                {t("feedback_signal.save")}
              </Button>
              <Button
                shape="round"
                style={{ marginLeft: 8 }}
                onClick={() => setIsEditing(false)}
              >
                {t("feedback_signal.cancel")}
              </Button>
            </div>
          </Form>
        ) : (
          <>
            <div
              style={{
                marginTop: 8,
                color: signalEvaluationOptions.find(
                  (item) => item.value === currentSingleFeedback.evaluation
                )?.color,
              }}
            >
              {t("feedback_signal.evaluation_result")}:{" "}
              {
                signalEvaluationOptions.find(
                  (item) => item.value === currentSingleFeedback.evaluation
                )?.label
              }
            </div>
            <div style={{ marginTop: 8 }}>
              <MarkdownContainer content={currentSingleFeedback?.basis ?? ""} />
            </div>
            <div style={{ marginTop: 8 }}>
              {!isPreview && (
                <Button
                  type="primary"
                  onClick={() => {
                    setIsEditing(true);
                    form.setFieldsValue({
                      ...currentSingleFeedback,
                    });
                  }}
                  shape="round"
                >
                  {t("feedback_signal.edit")}
                </Button>
              )}
              <Tooltip
                title={currentSingleFeedback.evidences}
                trigger={"click"}
                styles={{ body: { whiteSpace: "pre-wrap" } }}
              >
                <Button shape="round" style={{ marginLeft: 8 }}>
                  {t("feedback_signal.evidence")}
                </Button>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackSignalNew;
