import React, { useEffect, useState } from "react";
import {
  Tabs,
  Button,
  Typography,
  Space,
  Tooltip,
  message,
  Empty,
  Radio,
  Form,
  Input,
} from "antd";
import {
  DownloadOutlined,
  ShareAltOutlined,
  CopyOutlined,
  EditOutlined,
} from "@ant-design/icons";
import VionaAvatar from "@/assets/viona-avatar.png";
import useJob from "@/hooks/useJob";
import useTalent from "@/hooks/useTalent";
import { Get, Post } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import MarkdownEditor from "@/components/MarkdownEditor";
import dayjs from "dayjs";
import { parseJSON } from "@/utils";
import { useNavigate } from "react-router";

const { Title, Text } = Typography;

const scoreCardContent = `
# 面试评分卡

| 维度         | 评分（1-5） | 评语           |
| ------------ | ----------- | -------------- |
| 专业能力     |             |                |
| 沟通表达     |             |                |
| 团队协作     |             |                |
| 解决问题能力 |             |                |
| 综合评价     |             |                |
`;

type TInterviewPlanDetail = {
  rounds: {
    interviewer: string;
  }[];
  signals: [
    {
      title: string;
      description: string;
      level: "must_have" | "good_to_have";
    }
  ];
};

type TInterviewFeedbackDetail = {
  result: "recommend" | "pending" | "reject";
  feedback: string;
  next_round_concern: string;

  predefine_signals: [
    {
      title: string;
      evaluation:
        | "exceeds"
        | "meets"
        | "likely_meets"
        | "likely_does_not_meets"
        | "does_not_meets"
        | "not_assessed";
      basis: string;
      evidences: string;
    }
  ];

  other_signals: [
    {
      title: string;
      basis: string;
      evidences: string;
    }
  ];

  dangers: [
    {
      title: string;
      basis: string;
      evidences: string;
    }
  ];
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
      setTabKey("interview_designer");
      setRoundKey("1");
    }
  }, [job, talent]);

  useEffect(() => {
    if (tabKey === "interview_designer") {
      fetchInterviewDesignerDetail();
    } else {
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
    const blob = new Blob(
      [
        tabKey === "interview_designer"
          ? interviewDesigner?.interview_game_plan_doc || ""
          : scoreCardContent,
      ],
      { type: "text/markdown" }
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      tabKey === "interview_designer"
        ? `Round ${roundKey} - 推荐面试问题.md`
        : "面试评分卡.md";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        tabKey === "interview_designer"
          ? interviewDesigner?.interview_game_plan_doc || ""
          : scoreCardContent
      );
      message.success("已复制到剪贴板");
    } catch {
      message.error("复制失败");
    }
  };

  const handleShare = () => {
    message.info("分享功能待实现");
  };

  const handleEdit = () => {
    if (!interviewDesigner) return;

    setIsEditingInterviewDesigner(true);
    setEditingInterviewDesignerValue(interviewDesigner.interview_game_plan_doc);
  };

  const handleChat = () => {
    message.info("与 Viona 对话功能待实现");
  };

  const submitTalent = () => {};

  const interviewPlan = parseJSON(
    job?.interview_plan_json
  ) as TInterviewPlanDetail;

  const totalRound = (interviewPlan.rounds ?? []).length;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#fff" }}>
      {/* 左侧垂直Tab */}
      <div
        style={{
          width: 180,
          borderRight: "1px solid #f0f0f0",
          paddingTop: 32,
          background: "#fafbfc",
        }}
      >
        <Tabs
          tabPosition="left"
          activeKey={tabKey}
          onChange={(type) => setTabKey(type as TTalentChatType)}
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
      <div style={{ flex: 1, padding: "40px 48px", overflow: "auto" }}>
        {tabKey === "interview_designer" && (
          <>
            <Title level={4} style={{ marginBottom: 24 }}>
              推荐面试问题
            </Title>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              {/* 横向Tab */}
              <Tabs
                activeKey={roundKey}
                onChange={setRoundKey}
                items={new Array(totalRound).fill(0).map((_, index) => ({
                  key: `${index + 1}`,
                  label: `Round ${index + 1}`,
                }))}
                style={{ flex: "none" }}
              />
              {/* 更新时间 */}
              <Text
                type="secondary"
                style={{
                  marginLeft: 16,
                  fontSize: 12,
                  whiteSpace: "nowrap",
                  flex: "none",
                }}
              >
                更新时间：
                {!!interviewDesigner &&
                  dayjs(interviewDesigner.updated_at).format(
                    "YYYY-MM-DD HH:mm:ss"
                  )}
              </Text>
              {!!interviewDesigner && (
                <>
                  <Space size="middle" style={{ marginLeft: "auto" }}>
                    <Tooltip title="下载">
                      <Button
                        type="text"
                        icon={<DownloadOutlined />}
                        onClick={handleDownload}
                      />
                    </Tooltip>
                    <Tooltip title="分享">
                      <Button
                        type="text"
                        icon={<ShareAltOutlined />}
                        onClick={handleShare}
                      />
                    </Tooltip>
                    <Tooltip title="复制">
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={handleCopy}
                      />
                    </Tooltip>
                    <Tooltip title="编辑">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={handleEdit}
                      />
                    </Tooltip>
                  </Space>
                  <Button
                    type="primary"
                    style={{
                      marginLeft: 24,
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={handleChat}
                  >
                    <img
                      src={VionaAvatar}
                      alt="Viona"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        marginRight: 8,
                      }}
                    />
                    与 Viona 对话
                  </Button>
                </>
              )}
            </div>
            <div
              style={{
                border: "1px solid #f0f0f0",
                borderRadius: 8,
                padding: 24,
                background: "#fcfcfc",
                maxHeight: "60vh",
                overflow: "auto",
              }}
            >
              {!!interviewDesigner ? (
                isEditingInterviewDesigner ? (
                  <div>
                    <MarkdownEditor
                      value={editingInterviewDesignerValue}
                      onChange={(val) => setEditingInterviewDesignerValue(val)}
                    />
                    <div>
                      <Button
                        onClick={() => setIsEditingInterviewDesigner(false)}
                      >
                        取消
                      </Button>
                      <Button
                        onClick={() => updateInterviewDesignerDoc()}
                        type="primary"
                      >
                        保存
                      </Button>
                    </div>
                  </div>
                ) : (
                  <MarkdownContainer
                    content={interviewDesigner.interview_game_plan_doc}
                  />
                )
              ) : (
                <Empty />
              )}
            </div>
          </>
        )}
        {tabKey === "interview_feedback" && (
          <>
            <Title level={4} style={{ marginBottom: 24 }}>
              面试评分卡
            </Title>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  whiteSpace: "nowrap",
                  flex: "none",
                }}
              >
                更新时间：2024-06-05 11:00
              </Text>
              <Space size="middle" style={{ marginLeft: "auto" }}>
                <Tooltip title="下载">
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                  />
                </Tooltip>
                <Tooltip title="分享">
                  <Button
                    type="text"
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                  />
                </Tooltip>
                <Tooltip title="复制">
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={handleCopy}
                  />
                </Tooltip>
                <Tooltip title="编辑">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                  />
                </Tooltip>
              </Space>
              <Button
                type="primary"
                style={{
                  marginLeft: 24,
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={handleChat}
              >
                <img
                  src={VionaAvatar}
                  alt="Viona"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    marginRight: 8,
                  }}
                />
                与 Viona 对话
              </Button>
            </div>
            <div
              style={{
                border: "1px solid #f0f0f0",
                borderRadius: 8,
                padding: 24,
                background: "#fcfcfc",
                maxHeight: "60vh",
                overflow: "auto",
              }}
            >
              <div>
                <div>最终决定与理由</div>
                {isEditingTalent ? (
                  <Form form={form}>
                    <Form.Item name="status" label="总体招聘委员会推荐">
                      <Radio.Group
                        options={[
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
                            label:
                              "不予录用（资历不足）：未达到核心技能或经验水平要求。",
                            value: "reject_insufficient_skill",
                          },
                          {
                            label:
                              "不予录用（不匹配）：具备所需技能，但特质、工作方式或动机与职位/公司不匹配。",
                            value: "reject_mismatch",
                          },
                        ]}
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
                      <Button onClick={() => setIsEditingTalent(false)}>
                        取消
                      </Button>
                    </div>
                  </Form>
                ) : (
                  <div>
                    <div>总体招聘委员会推荐: {talent?.status}</div>
                    <div>最终理由: {talent?.feedback}</div>
                    <Button
                      onClick={() => {
                        form.setFieldsValue({
                          status: talent?.status,
                          feedback: talent?.feedback,
                        });
                        setIsEditingTalent(true);
                      }}
                    >
                      编辑
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <div>面试反馈</div>
                <div>
                  {new Array(totalRound).fill(0).map((_, index) => {
                    const currentRound = index + 1;
                    const interviewFeedback = interviewFeedbacks?.find(
                      (item) => item.round === currentRound
                    );

                    if (!interviewFeedback?.feedback_json) {
                      return (
                        <div key={index}>
                          <div>
                            {currentRound}面{" "}
                            {interviewPlan.rounds[index].interviewer}
                          </div>
                          <Empty
                            description={
                              <Button
                                onClick={() => {
                                  navigate(
                                    `/app/jobs/${job?.id}/talents/${talent?.id}/chat/?chatType=interview_feedback&round=${currentRound}`
                                  );
                                }}
                              >
                                请先反馈
                              </Button>
                            }
                          />
                        </div>
                      );
                    }

                    const interviewFeedbackDetail = parseJSON(
                      interviewFeedback.feedback_json
                    ) as TInterviewFeedbackDetail;

                    return (
                      <div key={interviewFeedback.id}>
                        <div>
                          {currentRound}面{" "}
                          {interviewPlan.rounds[index].interviewer} -{" "}
                          {dayjs(interviewFeedback.updated_at).format(
                            "YYYY-MM-DD HH:mm:ss"
                          )}
                        </div>

                        <div>
                          <div>总体推荐: {interviewFeedbackDetail.result}</div>
                          <div>
                            <MarkdownContainer
                              content={interviewFeedbackDetail.feedback}
                            />
                          </div>
                          <div>下一轮可操作性建议</div>
                          <div>
                            <MarkdownContainer
                              content={
                                interviewFeedbackDetail.next_round_concern
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div>待评估信号</div>
                <div>
                  {interviewPlan.signals.map((signal) => {
                    return (
                      <div key={signal.title}>
                        <div>
                          <div>{signal.level}</div>
                          <div>{signal.title}</div>
                        </div>
                        <div>{signal.description}</div>
                        <div>
                          {(interviewPlan.rounds ?? []).map((round, index) => {
                            const interviewFeedbackDetail = parseJSON(
                              interviewFeedbacks?.find(
                                (feedback) => feedback.round === index + 1
                              )?.feedback_json
                            ) as TInterviewFeedbackDetail;

                            const currentSingleFeedback =
                              interviewFeedbackDetail.predefine_signals?.find(
                                (signalFeedback) =>
                                  signalFeedback.title === signal.title
                              );

                            return (
                              <div key={index}>
                                <div>
                                  <div>
                                    <div>面试官</div>
                                    <div>{round.interviewer}</div>
                                  </div>
                                  <div>
                                    <Radio.Group
                                      value={currentSingleFeedback?.evaluation}
                                      optionType="button"
                                      options={[
                                        {
                                          label: "+++",
                                          value: "exceeds",
                                        },
                                        {
                                          label: "++",
                                          value: "meets",
                                        },
                                        {
                                          label: "+",
                                          value: "likely_meets",
                                        },
                                        {
                                          label: "-",
                                          value: "likely_does_not_meets",
                                        },
                                        {
                                          label: "--",
                                          value: "does_not_meets",
                                        },
                                        {
                                          label: "?",
                                          value: "not_assessed",
                                        },
                                      ]}
                                    />
                                  </div>
                                </div>
                                <div>{currentSingleFeedback?.basis ?? ""}</div>
                                <div>
                                  <Tooltip
                                    title={currentSingleFeedback?.evidences}
                                  >
                                    证据
                                  </Tooltip>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div>其它观察到的信号</div>
                <div>
                  {interviewFeedbacks.map((feedback) => {
                    const interviewFeedbackDetail = parseJSON(
                      feedback.feedback_json
                    ) as TInterviewFeedbackDetail;

                    const round = interviewPlan.rounds[feedback.round - 1];

                    const otherSignals =
                      interviewFeedbackDetail.other_signals ?? [];
                    return otherSignals.map((signal) => {
                      return (
                        <div key={signal.title}>
                          <div>
                            <div>{signal.title}</div>
                          </div>
                          <div>
                            <div>
                              <div>面试官</div>
                              <div>{round.interviewer}</div>
                            </div>
                            <div>{signal?.basis ?? ""}</div>
                            <div>
                              <Tooltip title={signal?.evidences}>证据</Tooltip>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })}
                </div>
              </div>

              <div>
                <div>主要顾虑/红线问题</div>
                <div>
                  {interviewFeedbacks.map((feedback) => {
                    const interviewFeedbackDetail = parseJSON(
                      feedback.feedback_json
                    ) as TInterviewFeedbackDetail;

                    const round = interviewPlan.rounds[feedback.round - 1];

                    const dangers = interviewFeedbackDetail.dangers ?? [];
                    return dangers.map((danger) => {
                      return (
                        <div key={danger.title}>
                          <div>
                            <div>{danger.title}</div>
                          </div>
                          <div>
                            <div>
                              <div>面试官</div>
                              <div>{round.interviewer}</div>
                            </div>
                            <div>{danger?.basis ?? ""}</div>
                            <div>
                              <Tooltip title={danger?.evidences}>证据</Tooltip>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TalentDetail;
