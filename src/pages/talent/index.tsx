import { useEffect, useState } from "react";
import { useParams } from "react-router";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import { EyeOutlined } from "@ant-design/icons";
import { Get, Post } from "../../utils/request";
import { TTalent } from "./type";
import { formatInterviewMode, parseJSON, parseMarkdown } from "../../utils";

import styles from "./style.module.less";
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popover,
  Select,
} from "antd";
import MarkdownContainer from "../../components/MarkdownContainer";
import TimeRangePicker from "@/components/TimeRangePicker";
import dayjs from "dayjs";
import EvaluateResult from "@/components/TalentDetail/components/EvaluateResult";

const Talent = () => {
  const { jobId, talentId } = useParams();

  const [form] = Form.useForm<IInterviewRequest>();
  const [talent, setTalent] = useState<TTalent>();
  const [interviewers, setInterviewers] = useState<IInterviewer[]>([]);
  const [interviews, setInterviews] = useState<IInterview[]>([]);
  const [feedbackReasonModalOpen, setFeedbackReasonModalOpen] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState("");
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  // const [meta, setMeta] = useState<{ rank: number; total: number }>();

  const { t: originalT } = useTranslation();

  const t = (key: string) => originalT(`talent.${key}`);

  useEffect(() => {
    fetchTalent();
    fetchInterviewers();
    fetchInterviews();
  }, []);

  const fetchTalent = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}/talents/${talentId}`);

    if (code === 0) {
      setTalent({
        ...data.talent,
        evaluate_result: parseJSON(data.talent.evaluate_result),
        parsed_content: parseMarkdown(data.talent.parsed_content),
      });
      // setMeta(data.meta);
    }
  };

  const fetchInterviewers = async () => {
    const { code, data } = await Get(`/api/interviewers`);

    if (code === 0) {
      setInterviewers(data.interviewers);
    }
  };

  const fetchInterviews = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobId}/talents/${talentId}/interviews`
    );

    if (code === 0) {
      setInterviews(data.interviews);
    }
  };

  const createInterview = async () => {
    form.validateFields().then(async (values) => {
      const { code } = await Post(
        `/api/jobs/${talent?.job_id}/talents/${talent?.id}/interviews`,
        {
          name: values.name,
          mode: values.mode,
          duration: values.duration,
          interviewer_ids: [values.interviewer_id],
          time_slots: values.timeSlots,
        }
      );
      if (code === 0) {
        message.success(originalT("submit_succeed"));
        fetchTalent();
      }
    });
  };

  const feedback = async (action: "accept" | "reject", reason?: string) => {
    const { code } = await Post(
      `/api/jobs/${jobId}/talents/${talentId}/feedback/${action}`,
      {
        feedback: reason,
      }
    );

    if (code === 0) {
      message.success(originalT("submit_succeed"));
      fetchTalent();
    } else {
      message.error(originalT("submit_failed"));
    }
  };

  if (!talent) {
    return <div>{originalT("loading")}</div>;
  }

  const result = talent.evaluate_result;

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.resumeHeader}>
          <div className={styles.resumeTitle}>{t("resume_body")}</div>
          <div>
            {talent.status === "evaluate_succeed" && (
              <>
                <Button
                  type="primary"
                  shape="round"
                  onClick={() => feedback("accept")}
                >
                  {t("accept")}
                </Button>
                <Button
                  type="primary"
                  danger
                  shape="round"
                  style={{ marginLeft: 10 }}
                  onClick={() => setFeedbackReasonModalOpen(true)}
                >
                  {t("reject")}
                </Button>
              </>
            )}
            {talent.status === "accepted" && (
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
              >
                <div className={classnames(styles.status, styles.accepted)}>
                  {t("accepted")}
                </div>
                <Button
                  type="primary"
                  shape="round"
                  onClick={() => setInterviewModalOpen(true)}
                >
                  {t("arrange_interview")}
                </Button>
                <Popover
                  title={<span style={{ fontSize: 16 }}>{t("scheduled_interviews")}</span>}
                  content={
                    <div style={{ width: 400 }}>
                      {interviews.map((item) => {
                        const interviewMember = item.interview_members.find(
                          (item) => item.interviewer_id != 0
                        );

                        return (
                          <div key={item.id} className={styles.interviewPanel}>
                            <div className={styles.interviewItem}>
                              <div>{t("interview_name")}:</div>
                              <div>{item.name}</div>
                            </div>
                            <div className={styles.interviewItem}>
                              <div>{t("interview_type")}:</div>
                              <div>{formatInterviewMode(item.mode)}</div>
                            </div>
                            <div className={styles.interviewItem}>
                              <div>{t("interview_duration")}:</div>
                              <div>{item.duration} {t("minutes")}</div>
                            </div>
                            <div className={styles.interviewItem}>
                              <div>{t("interviewer")}:</div>
                              <div>
                                {
                                  interviewers.find(
                                    (i) =>
                                      i.id === interviewMember?.interviewer_id
                                  )?.name
                                }
                              </div>
                            </div>
                            <div className={styles.interviewItem}>
                              <div>{t("interview_time")}:</div>
                              <div>
                                {item.scheduled_at
                                  ? dayjs(item.scheduled_at).format(
                                      t("date_format")
                                    )
                                  : t("waiting_candidate_choice")}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  }
                >
                  <EyeOutlined
                    style={{ color: "#1FAC6A", cursor: "pointer" }}
                  />
                </Popover>
              </div>
            )}
            {talent.status === "rejected" && (
              <div className={classnames(styles.status, styles.rejected)}>
                {t("rejected")}
              </div>
            )}
          </div>
        </div>
        <MarkdownContainer content={talent.parsed_content} />
      </div>
      <div className={styles.right}>
        <div className={styles.title}>{t("evaluate_report")}</div>
        <EvaluateResult result={result} />
      </div>

      <Modal
        open={feedbackReasonModalOpen}
        title={t("feedback")}
        onCancel={() => setFeedbackReasonModalOpen(false)}
        onOk={async () => {
          await feedback("reject", feedbackReason);
          setFeedbackReasonModalOpen(false);
          setFeedbackReason("");
        }}
        okButtonProps={{
          disabled: !feedbackReason,
        }}
        okText={originalT("submit")}
        cancelText={originalT("cancel")}
      >
        <Input.TextArea
          value={feedbackReason}
          onChange={(e) => setFeedbackReason(e.target.value)}
          rows={4}
          style={{ marginTop: 10 }}
        />
      </Modal>

      <Modal
        open={interviewModalOpen}
        title={t("add_interview")}
        onCancel={() => setInterviewModalOpen(false)}
        onOk={async () => {
          await createInterview();
          await fetchInterviews();
          setInterviewModalOpen(false);
          form.resetFields();
        }}
      >
        <Form form={form} labelCol={{ span: 4 }}>
          <Form.Item label={t("name")} name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t("type")} name="mode" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "ONLINE", label: t("online_interview") },
                { value: "ONSITE", label: t("offline_interview") },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={t("duration_minutes")}
            name="duration"
            rules={[{ required: true }]}
          >
            <InputNumber />
          </Form.Item>
          <Form.Item
            label={t("interviewer_field")}
            name="interviewer_id"
            rules={[{ required: true }]}
          >
            <Select
              options={interviewers.map((interviewer) => ({
                value: interviewer.id,
                label: interviewer.name,
              }))}
            />
          </Form.Item>
          <Form.Item
            label={t("available_times")}
            name="timeSlots"
            rules={[{ required: true }]}
          >
            <TimeRangePicker />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Talent;
