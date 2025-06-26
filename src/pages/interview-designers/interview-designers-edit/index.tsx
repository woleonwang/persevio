import { Button, Form, Input, InputNumber, message } from "antd";
import { Get, Post } from "../../../utils/request";
import { useNavigate, useParams } from "react-router";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";

type TFormValue = {
  resume: string;
  round: number;
  last_feedback: string;
};
const InterviewDesignersEdit = () => {
  const { jobId, interviewDesignerId } = useParams();
  const [form] = Form.useForm<TFormValue>();

  const isSubmittingRef = useRef(false);

  const navigate = useNavigate();
  const { t } = useTranslation();
  // const t = (key: string) => originalT(`edit_interview_designer.${key}`);

  useEffect(() => {
    fetchInterviewDesginer();
  }, []);

  const fetchInterviewDesginer = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobId}/interview_designers/${interviewDesignerId}`
    );
    if (code === 0) {
      form.setFieldsValue(data.interview_designer);
    }
  };

  const createInterviewDesigner = () => {
    form.validateFields().then(async (values) => {
      const { resume, round, last_feedback } = values;
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      const { code } = await Post(
        `/api/jobs/${jobId}/interview_designers/${interviewDesignerId}`,
        {
          resume,
          round,
          last_feedback,
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
      <div className={styles.header}>{t("Edit Interview Design Context")}</div>
      <div className={styles.main}>
        <Form form={form} layout="vertical">
          <Form.Item
            label={t("Round")}
            name="round"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item
            label={t("Candidate Resume")}
            name="resume"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={10} />
          </Form.Item>
          <Form.Item label={t("Last Round Feedback")} name="last_feedback">
            <Input.TextArea rows={10} />
          </Form.Item>
          <div style={{ marginTop: 24 }}>
            <Button
              type="primary"
              onClick={createInterviewDesigner}
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

export default InterviewDesignersEdit;
