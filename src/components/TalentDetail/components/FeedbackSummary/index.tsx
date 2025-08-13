import { copy, parseJSON } from "@/utils";
import styles from "./style.module.less";
import dayjs from "dayjs";
import MarkdownContainer from "@/components/MarkdownContainer";
import { useState } from "react";
import { CopyOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Form, Input, message, Radio } from "antd";
import MarkdownEditor from "@/components/MarkdownEditor";
import { Post } from "@/utils/request";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

interface IProps {
  jobId: number;
  talentId: number;
  interviewPlan: TInterviewPlanDetail;
  interviewFeedback: TInterviewFeedback;
  isPreview?: boolean;
  onSubmit: () => void;
}

const FeedbackSummary = (props: IProps) => {
  const {
    jobId,
    talentId,
    interviewPlan,
    interviewFeedback,
    onSubmit,
    isPreview,
  } = props;

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`talent.${key}`);

  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm<TFormValue>();

  const navigate = useNavigate();

  // 动态生成状态选项，使用国际化
  const feedbackStatusOptions = [
    {
      label: t("feedback_summary.recommend_next_stage"),
      value: "recommend",
    },
    {
      label: t("feedback_summary.keep_watching"),
      value: "pending",
    },
    {
      label: t("feedback_summary.not_recommend"),
      value: "reject",
    },
  ];

  type TFormValue = {
    interviewer_name: string;
    result: "recommend" | "pending" | "reject";
    feedback: string;
    next_round_concern: string;
  };

  const interviewFeedbackDetail = parseJSON(
    interviewFeedback.feedback_json
  ) as TInterviewFeedbackDetail;

  const submitFeedback = () => {
    form.validateFields().then(async (values) => {
      if (values["interviewer_name"] === defaultInterviewerName) {
        values.interviewer_name = "";
      }

      const { code } = await Post(
        `/api/jobs/${jobId}/interview_feedbacks/${interviewFeedback.id}/json`,
        {
          feedback_json: JSON.stringify(
            Object.assign(interviewFeedbackDetail, values)
          ),
        }
      );
      if (code === 0) {
        message.success(t("feedback_summary.update_success"));
        onSubmit();
        setIsEditing(false);
      }
    });
  };

  const defaultInterviewerName =
    interviewPlan.rounds[interviewFeedback.round - 1].interviewer;
  const mergedInterviewerName =
    interviewFeedbackDetail.interviewer_name ?? defaultInterviewerName;

  return (
    <div key={interviewFeedback.id} className={styles.feedbackItem}>
      <div className={styles.feedbackTitle}>
        <span className={styles.primary}>{interviewFeedback.round}{t("round_suffix")}</span>
        <span className={styles.interviewer}>{mergedInterviewerName}</span>
        <span className={styles.updatedAt}>
          {dayjs(interviewFeedback.updated_at).format("YYYY-MM-DD HH:mm:ss")}
        </span>
        {!isPreview && (
          <>
            <Button
              icon={<CopyOutlined />}
              onClick={async () => {
                await copy(
                  `## ${t("feedback_summary.overall_recommendation")}\n\n${
                    feedbackStatusOptions.find(
                      (item) => item.value === interviewFeedbackDetail.result
                    )?.label
                  }\n\n## ${t("feedback_summary.round_summary")}\n\n${
                    interviewFeedbackDetail.feedback
                  }\n\n## ${t("feedback_summary.next_round_operational_suggestions")}\n\n${
                    interviewFeedbackDetail.next_round_concern
                  }`
                );
                message.success(t("feedback_summary.copied"));
              }}
              style={{ marginLeft: 10 }}
            />
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setIsEditing(true);
                form.setFieldsValue({
                  ...interviewFeedbackDetail,
                  interviewer_name: mergedInterviewerName,
                });
              }}
              style={{ marginLeft: 10 }}
            />

            <Button
              type="primary"
              onClick={() =>
                navigate(
                  `/app/jobs/${jobId}/talents/${talentId}/chat?chatType=interview_feedback&round=${interviewFeedback.round}`
                )
              }
              style={{ marginLeft: "12px" }}
            >
              {t("feedback_summary.chat_with_viona")}
            </Button>
          </>
        )}
      </div>

      <div>
        {isEditing ? (
          <>
            <div className={styles.feedbackBlock}>
              <Form form={form} layout="vertical">
                <Form.Item
                  label={t("feedback_summary.interviewer")}
                  name="interviewer_name"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label={t("feedback_summary.overall_recommendation")}
                  name="result"
                  rules={[{ required: true }]}
                >
                  <Radio.Group
                    options={feedbackStatusOptions}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  />
                </Form.Item>
                <Form.Item
                  name="feedback"
                  label={t("feedback_summary.round_summary")}
                  rules={[{ required: true }]}
                >
                  <MarkdownEditor
                    style={{
                      border: "1px solid #dddddd",
                      borderRadius: 8,
                      height: 300,
                      overflow: "auto",
                    }}
                  />
                </Form.Item>
                <Form.Item
                  name="next_round_concern"
                  label={t("feedback_summary.next_round_operational_suggestions")}
                  rules={[{ required: true }]}
                >
                  <MarkdownEditor
                    style={{
                      border: "1px solid #dddddd",
                      borderRadius: 8,
                      height: 300,
                      overflow: "auto",
                    }}
                  />
                </Form.Item>
              </Form>
            </div>
            <div>
              <Button type="primary" onClick={() => submitFeedback()}>
                {t("feedback_summary.submit")}
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                style={{ marginLeft: 12 }}
              >
                {t("feedback_summary.cancel")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.feedbackBlock}>
              <div className={styles.primary} style={{ marginTop: 20 }}>
                {t("feedback_summary.overall_recommendation")}
              </div>
              <div style={{ marginTop: 12 }}>
                {
                  feedbackStatusOptions.find(
                    (item) => item.value === interviewFeedbackDetail.result
                  )?.label
                }
              </div>
            </div>

            <div className={styles.primary} style={{ marginTop: 20 }}>
              {t("feedback_summary.round_summary")}
            </div>

            <div style={{ marginTop: 12 }}>
              <MarkdownContainer content={interviewFeedbackDetail.feedback} />
            </div>

            <div className={styles.primary} style={{ marginTop: 20 }}>
              {t("feedback_summary.next_round_operational_suggestions")}
            </div>

            <div style={{ marginTop: 12 }}>
              <MarkdownContainer
                content={interviewFeedbackDetail.next_round_concern}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackSummary;
