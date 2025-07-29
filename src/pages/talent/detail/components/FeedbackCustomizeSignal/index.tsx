import { useState } from "react";
import { Button, Empty, Form, Input, message, Tooltip } from "antd";
import { parseJSON } from "@/utils";
import { Post } from "@/utils/request";

import styles from "./style.module.less";
import MarkdownContainer from "@/components/MarkdownContainer";

interface IProps {
  jobId: number;
  interviewerName: string;
  signalTitle: string;
  interviewFeedback: TInterviewFeedback;
  type: "others" | "dangers";
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
    onSubmit,
  } = props;

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
        message.success("更新成功");
        onSubmit();
        setIsEditing(false);
      }
    });
  };

  if (!currentSignalFeedback) return <Empty description="暂无数据" />;

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
            <Form.Item name="title" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item
              name="basis"
              label="判断依据"
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
            <div>{currentSignalFeedback.title}</div>
            <div style={{ marginTop: 8 }}>
              <MarkdownContainer content={currentSignalFeedback?.basis ?? ""} />
            </div>
            <div style={{ marginTop: 8 }}>
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
                编辑
              </Button>
              <Tooltip
                title={currentSignalFeedback.evidences}
                trigger={"click"}
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

export default FeedbackCustomizeSignal;
