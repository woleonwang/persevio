import { useState } from "react";
import { Button, Empty, Form, Input, message, Radio, Tooltip } from "antd";
import { parseJSON } from "@/utils";
import { Post } from "@/utils/request";

import styles from "./style.module.less";

interface IProps {
  jobId: number;
  talentId: number;
  interviewerName: string;
  signalTitle: string;
  interviewFeedback: TInterviewFeedback;
  onSubmit: () => void;
}

const signalEvaluationOptions: { label: string; value: TEvaluation }[] = [
  {
    label: "超出预期",
    value: "exceeds",
  },
  {
    label: "达标",
    value: "meets",
  },
  {
    label: "大概率达标",
    value: "likely_meets",
  },
  {
    label: "大概率不达标",
    value: "likely_does_not_meets",
  },
  {
    label: "不达标",
    value: "does_not_meets",
  },
  {
    label: "不确定",
    value: "uncertain",
  },
  {
    label: "本次面试未涉及",
    value: "not_assessed",
  },
];

type TFormValue = {
  evaluation: TEvaluation;
  basis: string;
};

const FeedbackSignal = (props: IProps) => {
  const { jobId, signalTitle, interviewerName, interviewFeedback, onSubmit } =
    props;

  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm<TFormValue>();

  const interviewFeedbackDetail = parseJSON(
    interviewFeedback.feedback_json
  ) as TInterviewFeedbackDetail;

  const currentSingleFeedback = interviewFeedbackDetail.predefine_signals?.find(
    (signalFeedback) => signalFeedback.title === signalTitle
  );

  const submitSignalFeedback = () => {
    form.validateFields().then(async (values) => {
      const newInterviewFeedbackDetail: TInterviewFeedbackDetail = JSON.parse(
        JSON.stringify(interviewFeedbackDetail)
      );

      newInterviewFeedbackDetail.predefine_signals.forEach((signalFeedback) => {
        if (signalFeedback.title === signalTitle) {
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
        message.success("更新成功");
        onSubmit();
        setIsEditing(false);
      }
    });
  };

  if (!currentSingleFeedback) return <Empty description="暂无数据" />;

  return (
    <div>
      <div>
        <div>
          <div className={styles.interviewer}>
            面试官{interviewFeedback.round}
          </div>
          <div className={styles.name}>{interviewerName}</div>
        </div>
        {isEditing ? (
          <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
            <Form.Item
              name="evaluation"
              label="评估结果"
              rules={[{ required: true }]}
            >
              <Radio.Group options={signalEvaluationOptions} size="small" />
            </Form.Item>

            <Form.Item name="basis" label="依据" rules={[{ required: true }]}>
              <Input.TextArea rows={4} />
            </Form.Item>

            <div style={{ marginTop: 8 }}>
              <Button
                type="primary"
                onClick={() => submitSignalFeedback()}
                shape="round"
              >
                保存
              </Button>
              <Button
                shape="round"
                style={{ marginLeft: 8 }}
                onClick={() => setIsEditing(false)}
              >
                取消
              </Button>
            </div>
          </Form>
        ) : (
          <>
            <div style={{ marginTop: 8 }}>
              评估结果:{" "}
              {
                signalEvaluationOptions.find(
                  (item) => item.value === currentSingleFeedback.evaluation
                )?.label
              }
            </div>
            <div style={{ marginTop: 8 }}>
              {currentSingleFeedback?.basis ?? ""}
            </div>
            <div style={{ marginTop: 8 }}>
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
                编辑
              </Button>
              <Tooltip
                title={currentSingleFeedback.evidences}
                trigger={"click"}
                styles={{ body: { whiteSpace: "pre-wrap" } }}
              >
                <Button shape="round" style={{ marginLeft: 8 }}>
                  证据
                </Button>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackSignal;
