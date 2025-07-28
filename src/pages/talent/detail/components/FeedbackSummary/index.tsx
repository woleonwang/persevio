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

interface IProps {
  jobId: number;
  talentId: number;
  interviewPlan: TInterviewPlanDetail;
  interviewFeedback: TInterviewFeedback;
  onSubmit: () => void;
}

const feedbackStatusOptions = [
  {
    label: "推荐进入下一阶段",
    value: "recommend",
  },
  {
    label: "保持观望",
    value: "pending",
  },
  {
    label: "不予推荐",
    value: "reject",
  },
];

type TFormValue = {
  interviewer_name: string;
  result: "recommend" | "pending" | "reject";
  feedback: string;
  next_round_concern: string;
};
const FeedbackSummary = (props: IProps) => {
  const { jobId, talentId, interviewPlan, interviewFeedback, onSubmit } = props;

  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm<TFormValue>();

  const navigate = useNavigate();

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
        message.success("更新成功");
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
        <span className={styles.primary}>{interviewFeedback.round}面</span>
        <span className={styles.interviewer}>{mergedInterviewerName}</span>
        <span className={styles.updatedAt}>
          {dayjs(interviewFeedback.updated_at).format("YYYY-MM-DD HH:mm:ss")}
        </span>
        <Button
          icon={<CopyOutlined />}
          onClick={async () => {
            await copy(
              `## 总体推荐\n\n${
                feedbackStatusOptions.find(
                  (item) => item.value === interviewFeedbackDetail.result
                )?.label
              }\n\n## 本轮小结\n\n${
                interviewFeedbackDetail.feedback
              }\n\n## 下一轮可操作性建议\n\n${
                interviewFeedbackDetail.next_round_concern
              }`
            );
            message.success("已复制");
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
          与 Viona 对话
        </Button>
      </div>

      <div>
        {isEditing ? (
          <>
            <div className={styles.feedbackBlock}>
              <Form form={form} layout="vertical">
                <Form.Item
                  label="面试官"
                  name="interviewer_name"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="总体推荐"
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
                  label="本轮小结"
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
                  label="下轮可操作性建议"
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
                提交
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                style={{ marginLeft: 12 }}
              >
                取消
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.feedbackBlock}>
              <div className={styles.primary} style={{ marginTop: 20 }}>
                总体推荐
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
              本轮小结
            </div>

            <div style={{ marginTop: 12 }}>
              <MarkdownContainer content={interviewFeedbackDetail.feedback} />
            </div>

            <div className={styles.primary} style={{ marginTop: 20 }}>
              下一轮可操作性建议
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
