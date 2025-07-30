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
import useJob from "@/hooks/useJob";
import useTalent from "@/hooks/useTalent";
import { Get, Post } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import MarkdownEditor from "@/components/MarkdownEditor";
import dayjs from "dayjs";
import { backOrDirect, copy, parseJSON } from "@/utils";
import { useNavigate } from "react-router";

import styles from "./style.module.less";
import FeedbackSummary from "./components/FeedbackSummary";
import FeedbackSignal from "./components/FeedbackSignal";
import FeedbackCustomizeSignal from "./components/FeedbackCustomizeSignal";

const { Title, Text } = Typography;

const talentStatusOptions = [
  {
    label: "强烈推荐：超出标准。高度自信。",
    value: "strong_recommend",
  },
  {
    label: "推荐：符合标准。有信心。",
    value: "recommend",
  },
  {
    label:
      "保留：优秀候选人，但可能在时间、级别或特定职位需求上存在不匹配。未来职位可再次考虑。",
    value: "pending",
  },
  {
    label: "不予录用（资历不足）：未达到核心技能或经验水平要求。",
    value: "reject_insufficient_skill",
  },
  {
    label:
      "不予录用（不匹配）：具备所需技能，但特质、工作方式或动机与职位/公司不匹配。",
    value: "reject_mismatch",
  },
];

const signalLevelMappings = {
  must_have: "必须具备",
  good_to_have: "加分项",
};

const TalentDetail: React.FC = () => {
  const { job } = useJob();
  const { talent, fetchTalent } = useTalent();

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

  useEffect(() => {
    // 初始化
    if (job && talent) {
      const urlParams = new URLSearchParams(window.location.search);
      const initTab = (urlParams.get("tab") ??
        "interview_designer") as TTalentChatType;
      setTabKey(initTab);
      if (initTab === "interview_designer") {
        const initRound = urlParams.get("round") ?? "1";
        setRoundKey(initRound);
      }
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
      `/api/jobs/${job.id}/talents/${talent.id}/interview_designer?round=${roundKey}`
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
      `/api/jobs/${job.id}/talents/${talent.id}/interview_feedbacks`
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
      message.success("Update succeed");
    } else {
      message.success("Update failed");
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
    a.download = `Round ${roundKey} - 推荐面试问题.md`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!interviewDesignerReady) return;

    try {
      await copy(interviewDesigner.interview_game_plan_doc || "");
      message.success("已复制到剪贴板");
    } catch {
      message.error("复制失败");
    }
  };

  const handleShare = async () => {
    await copy(
      `${window.origin}/app/jobs/${job?.id}/talents/${
        talent?.id
      }/detail?token=${localStorage.getItem(
        "token"
      )}&share=1&round=${roundKey}&tab=interview_designer&round=${roundKey}`
    );
    message.success("链接已复制");
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
        message.success("更新成功");
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
                key: "interview_designer",
                label: "推荐面试问题",
              },
              {
                key: "interview_feedback",
                label: "面试评分卡",
              },
            ]}
          />
        </div>
        {/* 右侧内容区 */}
        <div className={styles.right}>
          {tabKey === "interview_designer" && (
            <>
              <Title level={4} style={{ marginBottom: 24 }}>
                推荐面试问题
              </Title>
              <div className={styles.designerHeader}>
                <div className={styles.headerLeft}>
                  <Tabs
                    activeKey={roundKey}
                    onChange={setRoundKey}
                    items={new Array(totalRound).fill(0).map((_, index) => ({
                      key: `${index + 1}`,
                      label: `Round ${index + 1}`,
                    }))}
                    style={{ flex: "none" }}
                  />
                  {interviewDesignerReady && (
                    <Text type="secondary" className={styles.updatedAt}>
                      更新时间：
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
                    <EditOutlined onClick={handleEdit} />
                    <Button
                      type="primary"
                      onClick={handleDesignerChat}
                      style={{ marginLeft: "12px" }}
                    >
                      与 Viona 对话
                    </Button>
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
                          保存
                        </Button>
                        <Button
                          onClick={() => setIsEditingInterviewDesigner(false)}
                          style={{ marginLeft: 12 }}
                        >
                          取消
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
                        请先与Viona对话获取推荐面试计划
                        <Button
                          type="primary"
                          onClick={handleDesignerChat}
                          style={{ marginLeft: "12px" }}
                        >
                          与 Viona 对话
                        </Button>
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
                  面试评分卡
                </Title>
                <ShareAltOutlined
                  onClick={async () => {
                    await copy(
                      `${window.origin}/app/jobs/${job.id}/talents/${
                        talent.id
                      }/detail?tab=interview_feedback&token=${localStorage.getItem(
                        "token"
                      )}&share=1`
                    );
                    message.success("链接已复制");
                  }}
                />
              </div>

              <div className={styles.feedbackBody}>
                <div>
                  <div>
                    <Title level={5}>
                      最终决定与理由{" "}
                      {!isEditingTalent && (
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
                        label="总体招聘委员会推荐"
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
                        label="最终理由"
                        name="feedback"
                        rules={[{ required: true }]}
                      >
                        <Input.TextArea rows={4} />
                      </Form.Item>
                      <div>
                        <Button type="primary" onClick={() => submitTalent()}>
                          提交
                        </Button>
                        <Button
                          onClick={() => setIsEditingTalent(false)}
                          style={{ marginLeft: 12 }}
                        >
                          取消
                        </Button>
                      </div>
                    </Form>
                  ) : (
                    <div className={styles.feedbackBlock}>
                      <div className={styles.primary} style={{ marginTop: 12 }}>
                        总体招聘委员会推荐
                      </div>
                      <div style={{ marginTop: 6 }}>
                        {
                          talentStatusOptions.find(
                            (item) => item.value === talent?.status
                          )?.label
                        }
                      </div>
                      <div className={styles.primary} style={{ marginTop: 12 }}>
                        最终理由
                      </div>
                      <div style={{ marginTop: 6 }}> {talent?.feedback}</div>
                    </div>
                  )}
                </div>

                <div>
                  <Title level={5}>面试反馈</Title>
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
                                {currentRound}面{" "}
                              </span>
                              <span className={styles.interviewer}>
                                {interviewPlan.rounds[index].interviewer}
                              </span>
                            </div>
                            <Empty
                              description={
                                <>
                                  请先与Viona对话填写面试评分卡
                                  <Button
                                    type="primary"
                                    onClick={() => {
                                      navigate(
                                        `/app/jobs/${job?.id}/talents/${talent?.id}/chat/?chatType=interview_feedback&round=${currentRound}`
                                      );
                                    }}
                                    style={{ marginLeft: 12 }}
                                  >
                                    与Viona对话
                                  </Button>
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
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Title level={4} style={{ marginBottom: 24 }}>
                    待评估信号
                  </Title>
                  <div>
                    {(interviewPlan.signals ?? [])
                      .sort((a, b) =>
                        a.level === "good_to_have" && b.level === "must_have"
                          ? 1
                          : -1
                      )
                      .map((signal) => {
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
                                        onSubmit={() =>
                                          fetchInterviewFeedbacks()
                                        }
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
                      其它观察到的信号
                    </Title>
                    <span
                      style={{
                        color: "#aaaaaa",
                        fontSize: 14,
                        position: "relative",
                        top: 4,
                      }}
                    >
                      用于记录观察到的、不属于主要评估信号的重要行为
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
                      主要顾虑/红线问题
                    </Title>
                    <span
                      style={{
                        color: "#aaaaaa",
                        fontSize: 14,
                        position: "relative",
                        top: 4,
                      }}
                    >
                      对观察到的最重要风险或负面信号的总结
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
