import { useEffect, useState } from "react";
import { useParams } from "react-router";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  EyeOutlined,
  QuestionCircleFilled,
} from "@ant-design/icons";
import { Get, Post } from "../../utils/request";
import { TEvaluation, TTalent } from "./type";
import { parseJSON, parseMarkdown } from "../../utils";

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

  const getReasoning = (result: TEvaluation) => {
    let reasoning = `Minimum Requirements: ${result.job_requirements_met?.minimum_requirements}; 
Big Plus Requirements: ${result.job_requirements_met?.big_plus_requirements}; 
Plus Requirements: ${result.job_requirements_met?.plus_requirements}`;

    if (result.evaluation_summary?.strengths?.length > 0) {
      reasoning += "\n\nStrengths:";
      result.evaluation_summary.strengths.forEach((strength: string) => {
        reasoning += `\n- ${strength}`;
      });
    }

    if (result.evaluation_summary?.potential_gaps?.length > 0) {
      reasoning += "\n\nPotential Gaps:";
      result.evaluation_summary.potential_gaps.forEach((gap: string) => {
        reasoning += `\n- ${gap}`;
      });
    }

    if (result.evaluation_summary?.career_motivations?.length > 0) {
      reasoning += "\n\nCareer Motivations:";
      result.evaluation_summary.career_motivations.forEach(
        (motivation: string) => {
          reasoning += `\n- ${motivation}`;
        }
      );
    }

    return reasoning;
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
    return <div>loading...</div>;
  }

  const result = talent.evaluate_result;

  const groupedEvaluations = [
    {
      title: originalT(`ideal_profile.minimum`),
      items: result.evaluation.filter((item) => item.priority === "minimum"),
    },
    {
      title: originalT(`ideal_profile.big_plus`),
      items: result.evaluation.filter((item) => item.priority === "big_plus"),
    },
    {
      title: originalT(`ideal_profile.plus`),
      items: result.evaluation.filter((item) => item.priority === "plus"),
    },
  ];

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
                  安排面试
                </Button>
                <Popover
                  title="Interviews"
                  content={
                    <div>
                      {interviews.map((item) => {
                        const interviewMember = item.interview_members.find(
                          (item) => item.interviewer_id != 0
                        );
                        return (
                          <div key={item.id}>
                            <div>
                              <div>面试名称</div>
                              <div>{item.name}</div>
                            </div>
                            <div>
                              <div>面试类型</div>
                              <div>{item.mode}</div>
                            </div>
                            <div>
                              <div>面试时长</div>
                              <div>{item.duration}</div>
                            </div>
                            <div>
                              <div>面试官</div>
                              <div>
                                {
                                  interviewers.find(
                                    (i) => i.id === interviewMember?.id
                                  )?.name
                                }
                              </div>
                            </div>
                            <div>
                              <div>面试时间</div>
                              <div>
                                {item.scheduled_at
                                  ? dayjs(item.scheduled_at).format(
                                      "YYYY-MM-DD HH:mm"
                                    )
                                  : "待定"}
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
        <div className={styles.body}>
          <div className={styles.summaryMatch}>
            <div className={styles.summaryMatchTitle}>
              <div>{t("overall")}</div>
              <div
                className={classnames(
                  styles.summaryMatchTitleHint,
                  styles[result.overall_match_level]
                )}
              >
                {t(result.overall_match_level)}
              </div>
            </div>
            <div className={styles.summaryMeet}>
              <div className={styles.summaryMeetItem}>
                <div className={styles.summaryMeetItemName}>
                  {t("compensation")}
                </div>
                <div className={styles.summaryMeetItemValue}>
                  {t(result.competency_match)}
                </div>
              </div>
              <div className={styles.summaryMeetItem}>
                <div className={styles.summaryMeetItemName}>{t("other")}</div>
                <div className={styles.summaryMeetItemValue}>
                  {t(result.logistic_other_match)}
                </div>
              </div>
            </div>
          </div>

          {/* {meta && (
            <div className={styles.rank}>
              <DoubleRightOutlined style={{ marginRight: 4, fontSize: 12 }} />
              {t("rank")}:{" "}
              <span style={{ fontWeight: "bold", marginLeft: 8 }}>
                {`${meta.rank}/${meta.total} processed so far`}
              </span>
              <DoubleLeftOutlined style={{ marginLeft: 4, fontSize: 12 }} />
            </div>
          )} */}

          <div className={styles.blockTitle}>{t("summary")}</div>
          <div className={styles.summary}>
            <MarkdownContainer content={getReasoning(result)} />
          </div>

          <div className={styles.blockTitle}>{t("details")}</div>

          <div>
            <div style={{ paddingLeft: 12 }}>
              {groupedEvaluations.map((group) => {
                if (group.items.length === 0) return null;

                return (
                  <div key={group.title} style={{ marginBottom: 20 }}>
                    <div className={styles.detailItemTitle}>{group.title}</div>
                    {group.items.map((item) => {
                      const levelStyle = {
                        VH: {
                          width: "100%",
                          background:
                            "linear-gradient(90deg, #B7FFA1 0%, #1FAC6A 100%)",
                        },
                        H: {
                          width: "80%",
                          background:
                            "linear-gradient(90deg, #B7FFA1 0%, #1FAC6A 100%)",
                        },
                        N: {
                          width: "60%",
                          background:
                            "linear-gradient(90deg, #FFE5CA 0%, #FF8215 229.09%)",
                        },
                        L: {
                          width: "40%",
                          background:
                            "linear-gradient(90deg, #FFE5CA 0%, #FF8215 229.09%)",
                        },
                        VL: {
                          width: "20%",
                          background:
                            "linear-gradient(90deg, #FFE5CA 0%, #FF8215 229.09%)",
                        },
                      };

                      return (
                        <div key={item.criterion} style={{ marginBottom: 32 }}>
                          <div>
                            <div className={classnames(styles.criterionTitle)}>
                              {item.criterion}
                            </div>
                            <div className={styles.progress}>
                              {new Array(4).fill(0).map((_, index) => {
                                return (
                                  <div
                                    key={index}
                                    className={styles.progressItem}
                                  />
                                );
                              })}
                              <div
                                className={styles.progressBar}
                                style={levelStyle[item.confidence_level ?? "N"]}
                              />
                            </div>
                            <div className={styles.confidence}>
                              <div
                                className={classnames(
                                  styles.tag,
                                  styles[item.judgement]
                                )}
                              >
                                {
                                  {
                                    met: (
                                      <CheckCircleFilled
                                        style={{ color: "white" }}
                                      />
                                    ),
                                    not_sure: (
                                      <QuestionCircleFilled
                                        style={{ color: "white" }}
                                      />
                                    ),
                                    not_met: (
                                      <CloseCircleFilled
                                        style={{ color: "white" }}
                                      />
                                    ),
                                  }[item.judgement]
                                }
                                <div className={styles.tagText}>
                                  {t(item.judgement)}
                                </div>
                              </div>
                              <div className={styles.confidenceText}>
                                {t("confidence")}:
                                {["met", "not_met"].includes(item.judgement)
                                  ? t(item.confidence_level)
                                  : "N.A."}
                              </div>
                            </div>
                          </div>

                          {["met", "not_met"].includes(item.judgement) && (
                            <div className={styles.reason}>
                              <div className={styles.reasonHeader}>
                                <span className={styles.reasonTitle}>
                                  {t("reason")}
                                </span>
                                <Popover
                                  content={
                                    <div style={{ width: 400 }}>
                                      {item.reasons.map((reason) => (
                                        <div key={reason.reason}>
                                          {reason.evidences.map((evidence) => (
                                            <div key={evidence}>{evidence}</div>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  }
                                >
                                  <span className={styles.evidenceTrigger}>
                                    {t("evidence")}
                                  </span>
                                </Popover>
                              </div>
                              <div className={styles.reasonContent}>
                                {item.reasons.map((reason) => (
                                  <div
                                    key={reason.reason}
                                    style={{ marginBottom: 4 }}
                                  >
                                    {reason.reason}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
        title={"添加面试"}
        onCancel={() => setInterviewModalOpen(false)}
        onOk={async () => {
          await createInterview();
          await fetchInterviews();
          setInterviewModalOpen(false);
        }}
      >
        <Form form={form} labelCol={{ span: 4 }}>
          <Form.Item label="名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="类型" name="mode" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "ONLINE", label: "线上面试" },
                { value: "ONSITE", label: "线下面试" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="时长(分钟)"
            name="duration"
            rules={[{ required: true }]}
          >
            <InputNumber />
          </Form.Item>
          <Form.Item
            label="面试官"
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
            label="面试时间"
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
