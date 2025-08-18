import React, { useEffect, useState } from "react";
import {
  Tabs,
  Button,
  Typography,
  message,
  Empty,
  Radio,
  Form,
  Input,
  Spin,
} from "antd";
import {
  DownloadOutlined,
  ShareAltOutlined,
  CopyOutlined,
  EditOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import classnames from "classnames";
import useTalent from "@/hooks/useTalent";
import { Get, Post } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import MarkdownEditor from "@/components/MarkdownEditor";
import dayjs from "dayjs";
import { backOrDirect, copy, parseJSON } from "@/utils";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import globalStore from "@/store/global";

import styles from "./style.module.less";
import FeedbackSummary from "./components/FeedbackSummary";
import FeedbackSignal from "./components/FeedbackSignal";
import FeedbackCustomizeSignal from "./components/FeedbackCustomizeSignal";
import usePublicJob from "@/hooks/usePublicJob";
import EvaluateResult from "./components/EvaluateResult";

const { Title, Text } = Typography;

interface IProps {
  isPreview?: boolean;
}

const TalentDetail: React.FC<IProps> = (props) => {
  const { job } = usePublicJob();
  const { talent, fetchTalent } = useTalent();
  const { t: originalT, i18n } = useTranslation();
  const t = (key: string) => originalT(`talent.${key}`);

  const { isPreview } = props;

  const [tabKey, setTabKey] = useState<TTalentChatType>();
  const [roundKey, setRoundKey] = useState("");
  const [interviewDesigner, setInterviewDesigner] =
    useState<TInterviewDesigner>();
  const [isEditingInterviewDesigner, setIsEditingInterviewDesigner] =
    useState(false);
  const [editingInterviewDesignerValue, setEditingInterviewDesignerValue] =
    useState("");

  const [interviewFeedbacks, setInterviewFeedbacks] = useState<
    TInterviewFeedback[]
  >([]);
  const [isEditingTalent, setIsEditingTalent] = useState(false);
  const [form] = Form.useForm<{ status: string; feedback: string }>();

  const navigate = useNavigate();

  // 动态生成状态选项，使用国际化
  const talentStatusOptions = [
    {
      label: t("talent_status.strong_hire"),
      value: "strong_hire",
    },
    {
      label: t("talent_status.hire"),
      value: "hire",
    },
    {
      label: t("talent_status.hold"),
      value: "hold",
    },
    {
      label: t("talent_status.no_hire_underqualified"),
      value: "no_hire_underqualified",
    },
    {
      label: t("talent_status.no_hire_not_a_fit"),
      value: "no_hire_not_a_fit",
    },
  ];

  const signalLevelMappings = {
    must_have: t("signal_level.must_have"),
    good_to_have: t("signal_level.good_to_have"),
  };

  useEffect(() => {
    // 初始化
    if (job && talent) {
      const urlParams = new URLSearchParams(window.location.search);
      const initTab = (urlParams.get("tab") ?? "resume") as TTalentChatType;
      setTabKey(initTab);
      if (initTab === "interview_designer") {
        const initRound = urlParams.get("round") ?? "1";
        setRoundKey(initRound);
      }

      if (isPreview) {
        i18n.changeLanguage(job.language);
      }

      // 刷新未读候选人状态
      globalStore.refreshUnreadTalentsCount();
    }
  }, [job, talent]);

  useEffect(() => {
    if (tabKey === "interview_designer") {
      fetchInterviewDesignerDetail();
    } else if (tabKey === "interview_feedback") {
      fetchInterviewFeedbacks();
    }
  }, [tabKey, roundKey]);

  const fetchInterviewDesignerDetail = async () => {
    if (!job || !talent) return;

    const { code, data } = await Get(
      `/api/public/jobs/${job.id}/talents/${talent.id}/interview_designer?round=${roundKey}`
    );
    if (code === 0) {
      setInterviewDesigner(data.interview_designer);
    } else {
      setInterviewDesigner(undefined);
    }
  };

  const fetchInterviewFeedbacks = async () => {
    if (!job || !talent) return;

    const { code, data } = await Get(
      `/api/public/jobs/${job.id}/talents/${talent.id}/interview_feedbacks`
    );
    if (code === 0) {
      setInterviewFeedbacks(data.interview_feedbacks);
    }
  };

  const updateInterviewDesignerDoc = async () => {
    if (!job || !interviewDesigner) return;

    const { code } = await Post(
      `/api/jobs/${job.id}/interview_designers/${interviewDesigner.id}/doc`,
      {
        content: editingInterviewDesignerValue,
      }
    );

    if (code === 0) {
      fetchInterviewDesignerDetail();
      setIsEditingInterviewDesigner(false);
      message.success(t("update_success"));
    } else {
      message.error(t("update_failed"));
    }
  };

  const handleDownload = () => {
    if (!interviewDesignerReady) return;

    const blob = new Blob([interviewDesigner.interview_game_plan_doc], {
      type: "text/markdown",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = t("download_filename").replace("{{round}}", roundKey);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!interviewDesignerReady) return;

    try {
      await copy(interviewDesigner.interview_game_plan_doc || "");
      message.success(t("copy_success"));
    } catch {
      message.error(t("copy_failed"));
    }
  };

  const handleShare = async () => {
    await copy(
      `${window.origin}/jobs/${job?.id}/talents/${talent?.id}/detail?round=${roundKey}&tab=interview_designer&round=${roundKey}`
    );
    message.success(t("link_copied"));
  };

  const handleEdit = () => {
    if (!interviewDesignerReady) return;

    setIsEditingInterviewDesigner(true);
    setEditingInterviewDesignerValue(interviewDesigner.interview_game_plan_doc);
  };

  const handleDesignerChat = () => {
    navigate(
      `/app/jobs/${job?.id}/talents/${talent?.id}/chat?chatType=interview_designer&round=${roundKey}`
    );
  };

  const submitTalent = () => {
    form.validateFields().then(async (values) => {
      const { status, feedback } = values;
      const { code } = await Post(
        `/api/jobs/${job?.id}/talents/${talent?.id}`,
        {
          status,
          feedback,
        }
      );

      if (code === 0) {
        fetchTalent();
        setIsEditingTalent(false);
        message.success(t("update_success"));
      }
    });
  };

  const interviewPlan = parseJSON(
    job?.interview_plan_json
  ) as TInterviewPlanDetail;

  const totalRound = (interviewPlan.rounds ?? []).length;

  const interviewDesignerReady = !!interviewDesigner?.interview_game_plan_doc;

  if (!job || !talent) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {!isPreview && (
          <ArrowLeftOutlined
            style={{
              fontSize: 20,
              cursor: "pointer",
            }}
            onClick={async () => {
              backOrDirect(
                navigate,
                `/app/jobs/${job.id}/talents/${talent.id}/chat`
              );
            }}
          />
        )}
        <div>
          {talent.name} - {job.name}
        </div>
      </div>
      <div className={styles.main}>
        <div className={styles.left}>
          <Tabs
            tabPosition="left"
            activeKey={tabKey}
            onChange={(type) => setTabKey(type as TTalentChatType)}
            style={{ height: "100%" }}
            items={[
              {
                key: "resume",
                label: t("tabs.resume_detail"),
              },
              {
                key: "interview_designer",
                label: t("tabs.recommended_interview_questions"),
              },
              {
                key: "interview_feedback",
                label: t("tabs.interview_scorecard"),
              },
            ]}
          />
        </div>
        {/* 右侧内容区 */}
        <div className={styles.right}>
          {tabKey === "resume" && (
            <div className={styles.resumeContainer}>
              <div
                style={{
                  flex: "auto",
                  overflow: "auto",
                  padding: "0 24px",
                }}
              >
                <MarkdownContainer content={talent.parsed_content || ""} />
              </div>
              {talent.evaluate_result.evaluation_summary && (
                <div className={styles.evaluateResultContainer}>
                  <div className={styles.evaluateResultTitle}>
                    {t("candidate_evaluation_report")}
                  </div>
                  <EvaluateResult result={talent.evaluate_result} />
                </div>
              )}
            </div>
          )}
          {tabKey === "interview_designer" && (
            <>
              <Title level={4} style={{ marginBottom: 24 }}>
                {t("recommended_interview_questions_title")}
              </Title>
              <div className={styles.designerHeader}>
                <div className={styles.headerLeft}>
                  <Tabs
                    activeKey={roundKey}
                    onChange={setRoundKey}
                    items={new Array(totalRound).fill(0).map((_, index) => ({
                      key: `${index + 1}`,
                      label: t("round_label").replace(
                        "{{round}}",
                        `${index + 1}`
                      ),
                    }))}
                    style={{ flex: "none" }}
                  />
                  {interviewDesignerReady && (
                    <Text type="secondary" className={styles.updatedAt}>
                      {t("update_time")}
                      {dayjs(interviewDesigner.updated_at).format(
                        "YYYY-MM-DD HH:mm:ss"
                      )}
                    </Text>
                  )}
                </div>
                {interviewDesignerReady && (
                  <div className={styles.headerRight}>
                    <DownloadOutlined onClick={handleDownload} />
                    <ShareAltOutlined onClick={handleShare} />
                    <CopyOutlined onClick={handleCopy} />
                    {!isPreview && (
                      <>
                        <EditOutlined onClick={handleEdit} />
                        <Button
                          type="primary"
                          onClick={handleDesignerChat}
                          style={{ marginLeft: "12px" }}
                        >
                          {t("chat_with_viona")}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className={styles.designerBody}>
                {!!interviewDesignerReady ? (
                  isEditingInterviewDesigner ? (
                    <>
                      <MarkdownEditor
                        value={editingInterviewDesignerValue}
                        onChange={(val) =>
                          setEditingInterviewDesignerValue(val)
                        }
                        style={{
                          flex: "auto",
                          overflow: "hidden",
                          display: "flex",
                        }}
                      />
                      <div>
                        <Button
                          onClick={() => updateInterviewDesignerDoc()}
                          type="primary"
                        >
                          {t("save")}
                        </Button>
                        <Button
                          onClick={() => setIsEditingInterviewDesigner(false)}
                          style={{ marginLeft: 12 }}
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        flex: "auto",
                        overflow: "auto",
                        padding: "0 24px",
                      }}
                    >
                      <MarkdownContainer
                        content={interviewDesigner.interview_game_plan_doc}
                      />
                    </div>
                  )
                ) : (
                  <Empty
                    style={{ marginTop: 120 }}
                    description={
                      <div>
                        {t("no_interview_plan")}
                        {!isPreview && (
                          <Button
                            type="primary"
                            onClick={handleDesignerChat}
                            style={{ marginLeft: "12px" }}
                          >
                            {t("chat_with_viona")}
                          </Button>
                        )}
                      </div>
                    }
                  />
                )}
              </div>
            </>
          )}
          {tabKey === "interview_feedback" && (
            <>
              <div className={styles.feedbackHeader}>
                <Title level={4} style={{ marginBottom: 24 }}>
                  {t("interview_scorecard_title")}
                </Title>
                {!isPreview && (
                  <ShareAltOutlined
                    onClick={async () => {
                      await copy(
                        `${window.origin}/jobs/${job.id}/talents/${talent.id}/detail?tab=interview_feedback`
                      );
                      message.success(t("link_copied"));
                    }}
                  />
                )}
              </div>

              <div className={styles.feedbackBody}>
                <div>
                  <div>
                    <Title level={5}>
                      {t("final_decision_and_reason")}{" "}
                      {!isEditingTalent && !isPreview && (
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => {
                            form.setFieldsValue({
                              status: talent?.status,
                              feedback: talent?.feedback,
                            });
                            setIsEditingTalent(true);
                          }}
                          style={{ marginLeft: 12 }}
                        />
                      )}
                    </Title>
                  </div>

                  {isEditingTalent ? (
                    <Form form={form} layout="vertical">
                      <Form.Item
                        name="status"
                        label={t(
                          "overall_recruitment_committee_recommendation"
                        )}
                        rules={[{ required: true }]}
                      >
                        <Radio.Group
                          options={talentStatusOptions}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        />
                      </Form.Item>
                      <Form.Item
                        label={t("final_reason")}
                        name="feedback"
                        rules={[{ required: true }]}
                      >
                        <Input.TextArea rows={4} />
                      </Form.Item>
                      <div>
                        <Button type="primary" onClick={() => submitTalent()}>
                          {t("submit")}
                        </Button>
                        <Button
                          onClick={() => setIsEditingTalent(false)}
                          style={{ marginLeft: 12 }}
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    </Form>
                  ) : (
                    <div className={styles.feedbackBlock}>
                      <div className={styles.primary} style={{ marginTop: 12 }}>
                        {t("overall_recruitment_committee_recommendation")}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        {
                          talentStatusOptions.find(
                            (item) => item.value === talent?.status
                          )?.label
                        }
                      </div>
                      <div className={styles.primary} style={{ marginTop: 12 }}>
                        {t("final_reason")}
                      </div>
                      <div style={{ marginTop: 6 }}> {talent?.feedback}</div>
                    </div>
                  )}
                </div>

                <div>
                  <Title level={5}>{t("interview_feedback")}</Title>
                  <div>
                    {new Array(totalRound).fill(0).map((_, index) => {
                      const currentRound = index + 1;
                      const interviewFeedback = interviewFeedbacks?.find(
                        (item) => item.round === currentRound
                      );

                      if (!interviewFeedback?.feedback_json) {
                        return (
                          <div key={index} className={styles.feedbackItem}>
                            <div className={styles.feedbackTitle}>
                              <span className={styles.primary}>
                                {currentRound} {t("round_suffix")}{" "}
                              </span>
                              <span className={styles.interviewer}>
                                {interviewPlan.rounds[index].interviewer}
                              </span>
                            </div>
                            <Empty
                              description={
                                <>
                                  {t("no_scorecard_filled")}
                                  {!isPreview && (
                                    <Button
                                      type="primary"
                                      onClick={() => {
                                        navigate(
                                          `/app/jobs/${job?.id}/talents/${talent?.id}/chat/?chatType=interview_feedback&round=${currentRound}`
                                        );
                                      }}
                                      style={{ marginLeft: 12 }}
                                    >
                                      {t("chat_with_viona")}
                                    </Button>
                                  )}
                                </>
                              }
                              style={{ margin: "60px 0" }}
                            />
                          </div>
                        );
                      }

                      return (
                        <FeedbackSummary
                          jobId={job.id}
                          talentId={talent.id}
                          interviewPlan={interviewPlan}
                          interviewFeedback={interviewFeedback}
                          onSubmit={() => fetchInterviewFeedbacks()}
                          isPreview={isPreview}
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Title level={4} style={{ marginBottom: 24 }}>
                    {t("pending_evaluation_signals")}
                  </Title>
                  <div>
                    {[
                      ...(interviewPlan.signals ?? []).filter(
                        (item) => item.level === "must_have"
                      ),
                      ...(interviewPlan.signals ?? []).filter(
                        (item) => item.level === "good_to_have"
                      ),
                    ].map((signal) => {
                      return (
                        <div
                          key={signal.title}
                          className={styles.signalContainer}
                        >
                          <div className={styles.signalHeader}>
                            <div
                              className={classnames(
                                styles.signalLevel,
                                styles[signal.level]
                              )}
                            >
                              {signalLevelMappings[signal.level]}
                            </div>
                            <div className={styles.signalTitle}>
                              {signal.title}
                            </div>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            {signal.description}
                          </div>
                          <div className={styles.interviewPanelContainer}>
                            {(interviewPlan.rounds ?? []).map(
                              (round, index) => {
                                const interviewFeedback =
                                  interviewFeedbacks?.find(
                                    (feedback) => feedback.round === index + 1
                                  );

                                if (!interviewFeedback) return <></>;

                                const interviewFeedbackDetail = parseJSON(
                                  interviewFeedback.feedback_json
                                ) as TInterviewFeedbackDetail;

                                return (
                                  <div
                                    className={styles.card}
                                    key={interviewFeedback.id}
                                  >
                                    <FeedbackSignal
                                      jobId={job.id}
                                      talentId={talent.id}
                                      interviewerName={
                                        interviewFeedbackDetail.interviewer_name ??
                                        round.interviewer
                                      }
                                      signalTitle={signal.title}
                                      interviewFeedback={interviewFeedback}
                                      onSubmit={() => fetchInterviewFeedbacks()}
                                      isPreview={isPreview}
                                    />
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <Title level={4} style={{ marginBottom: 24 }}>
                      {t("other_observed_signals")}
                    </Title>
                    <span
                      style={{
                        color: "#aaaaaa",
                        fontSize: 14,
                        position: "relative",
                        top: 4,
                      }}
                    >
                      {t("other_observed_signals_hint")}
                    </span>
                  </div>
                  <div>
                    {interviewFeedbacks.map((feedback) => {
                      const interviewFeedbackDetail = parseJSON(
                        feedback.feedback_json
                      ) as TInterviewFeedbackDetail;

                      return (interviewFeedbackDetail.other_signals ?? []).map(
                        (signal) => {
                          return (
                            <div
                              className={styles.signalContainer}
                              key={signal.title}
                            >
                              <FeedbackCustomizeSignal
                                jobId={job.id}
                                interviewerName={
                                  interviewFeedbackDetail.interviewer_name ??
                                  interviewPlan.rounds[feedback.round - 1]
                                    .interviewer
                                }
                                signalTitle={signal.title}
                                type="others"
                                interviewFeedback={feedback}
                                onSubmit={() => fetchInterviewFeedbacks()}
                                isPreview={isPreview}
                              />
                            </div>
                          );
                        }
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <Title level={4} style={{ marginBottom: 24 }}>
                      {t("main_concerns_red_flags")}
                    </Title>
                    <span
                      style={{
                        color: "#aaaaaa",
                        fontSize: 14,
                        position: "relative",
                        top: 4,
                      }}
                    >
                      {t("main_concerns_red_flags_hint")}
                    </span>
                  </div>
                  <div>
                    {interviewFeedbacks.map((feedback) => {
                      const interviewFeedbackDetail = parseJSON(
                        feedback.feedback_json
                      ) as TInterviewFeedbackDetail;
                      return (interviewFeedbackDetail.dangers ?? []).map(
                        (signal) => {
                          return (
                            <div
                              className={classnames(
                                styles.signalContainer,
                                styles.danger
                              )}
                              key={signal.title}
                            >
                              <FeedbackCustomizeSignal
                                jobId={job.id}
                                interviewerName={
                                  interviewFeedbackDetail.interviewer_name ??
                                  interviewPlan.rounds[feedback.round - 1]
                                    .interviewer
                                }
                                signalTitle={signal.title}
                                type="dangers"
                                interviewFeedback={feedback}
                                onSubmit={() => fetchInterviewFeedbacks()}
                                isPreview={isPreview}
                              />
                            </div>
                          );
                        }
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TalentDetail;
