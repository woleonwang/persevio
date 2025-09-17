import { useState } from "react";
import { Input, Tag, Button, message, Modal, Checkbox, Drawer } from "antd";
import { Post } from "@/utils/request";
import styles from "./style.module.less";
import MarkdownContainer from "@/components/MarkdownContainer";

// 类型定义
export type TTargetCandidate = {
  id: number;
  name: string;
  avatar: string;
  position: string;
  company_name: string;
};

export type TCandidateConnectionForCandidate = {
  id: number;
  status: string;
  recommend_reason: string;
  recommend_report: string;
  interview_info: string;
  target_status: string;
  target_candidate: TTargetCandidate;
  created_at: string;
  updated_at: string;
};

// 状态常量
const CANDIDATE_CONNECTION_APPROVE_STATUS_PENDING = "pending";
const CANDIDATE_CONNECTION_APPROVE_STATUS_APPROVED = "approved";
const CANDIDATE_CONNECTION_APPROVE_STATUS_REJECTED = "rejected";
const CANDIDATE_CONNECTION_APPROVE_STATUS_STORED = "stored";

const REJECT_REASON_OPTIONS = [
  {
    value: "no_match",
    label: "专业领域不匹配",
  },
  {
    value: "different_industry",
    label: "想链接不同行业的人",
  },
  {
    value: "different_topic",
    label: "感兴趣的主题不一样",
  },
  {
    value: "other",
    label: "其他",
  },
];

export const getFinalStatus = (
  status: string,
  targetStatus: string
): "pending" | "matching" | "approved" | "rejected" | "stored" => {
  if (status === CANDIDATE_CONNECTION_APPROVE_STATUS_STORED) {
    return "stored";
  }

  if (status === CANDIDATE_CONNECTION_APPROVE_STATUS_REJECTED) {
    return "rejected";
  }

  if (status === CANDIDATE_CONNECTION_APPROVE_STATUS_PENDING) {
    return "pending";
  }

  if (status === CANDIDATE_CONNECTION_APPROVE_STATUS_APPROVED) {
    if (targetStatus === CANDIDATE_CONNECTION_APPROVE_STATUS_REJECTED) {
      return "rejected";
    } else if (targetStatus === CANDIDATE_CONNECTION_APPROVE_STATUS_APPROVED) {
      return "approved";
    } else {
      return "matching";
    }
  }

  return "matching";
};

const ConnectionsList = (props: {
  connections: TCandidateConnectionForCandidate[];
  onRefresh: () => void;
}) => {
  const { connections, onRefresh } = props;
  const [currentConnectionId, setCurrentConnectionId] = useState<number>(0);

  const [reconnectModalOpen, setReconnectModalOpen] = useState(false);
  const [rejectReasonModalOpen, setRejectReasonModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState<string[]>([]);
  const [rejectReasonOther, setRejectReasonOther] = useState("");
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false);

  const feedbackConnection = async (
    id: number,
    status: string,
    rejectReasons?: string[]
  ): Promise<boolean> => {
    if (
      !confirm(
        `确定要${
          status === CANDIDATE_CONNECTION_APPROVE_STATUS_REJECTED
            ? "拒绝"
            : status === CANDIDATE_CONNECTION_APPROVE_STATUS_STORED
            ? "暂存"
            : "接受"
        }该匹配吗？`
      )
    )
      return false;

    const { code } = await Post(
      `/api/candidate/network/candidate_connections/${id}/feedback`,
      {
        status,
        reject_reasons: rejectReasons ? JSON.stringify(rejectReasons) : "",
      }
    );

    if (code === 0) {
      onRefresh();
      if (status === CANDIDATE_CONNECTION_APPROVE_STATUS_APPROVED) {
        Modal.success({
          title: "匹配成功",
          content:
            "如果对方也接受匹配，我们会第一时间通知您并协助安排会议日程。",
        });
      } else if (status === CANDIDATE_CONNECTION_APPROVE_STATUS_REJECTED) {
        message.success("拒绝成功");
      } else if (status === CANDIDATE_CONNECTION_APPROVE_STATUS_STORED) {
        const connection = connections.find((conn) => conn.id === id);
        if (connection) {
          Modal.success({
            title: "暂存成功",
            content: `已将 ${connection.target_candidate.name} 加入暂存列表，等您后续有时间可以再次发起匹配，约对方一起沟通探讨。`,
          });
        }
      }
      return true;
    } else {
      message.error("反馈失败");
      return false;
    }
  };

  const currentConnection = connections.find(
    (conn) => conn.id === currentConnectionId
  );

  return (
    <>
      <div className={styles.cardsContainer}>
        {connections.map((connection) => {
          const finalStatus = getFinalStatus(
            connection.status,
            connection.target_status
          );
          const reasons = connection.recommend_reason
            ? connection.recommend_reason.split("\n").filter((r) => r.trim())
            : [];

          return (
            <div
              key={connection.id}
              className={`${styles.card} ${
                finalStatus === "approved" ? styles.successCard : ""
              }`}
            >
              <div className={styles.reasonsList}>
                {reasons.map((reason, index) => (
                  <div key={index} className={styles.reasonItem}>
                    {index + 1}. {reason}
                  </div>
                ))}
              </div>

              <div className={styles.candidateInfo}>
                <div className={styles.avatar}>
                  <img
                    src={`/api/avatar/${connection.target_candidate.avatar}`}
                    alt={connection.target_candidate.name}
                  />
                </div>

                <div className={styles.candidateDetails}>
                  <div className={styles.name}>
                    {connection.target_candidate.name}
                  </div>
                  <div className={styles.position}>
                    {connection.target_candidate.position}
                    <span className={styles.separator}>•</span>
                    {connection.target_candidate.company_name}
                  </div>
                </div>

                <div className={styles.actions}>
                  {finalStatus === "pending" && (
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <Button
                        variant="outlined"
                        color="red"
                        shape="round"
                        onClick={() => {
                          setRejectReasonModalOpen(true);
                          setCurrentConnectionId(connection.id);
                          setRejectReason([]);
                          setRejectReasonOther("");
                        }}
                      >
                        拒绝
                      </Button>
                      <Button
                        variant="outlined"
                        color="blue"
                        shape="round"
                        onClick={() =>
                          feedbackConnection(
                            connection.id,
                            CANDIDATE_CONNECTION_APPROVE_STATUS_STORED
                          )
                        }
                      >
                        暂存
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        shape="round"
                        onClick={() =>
                          feedbackConnection(
                            connection.id,
                            CANDIDATE_CONNECTION_APPROVE_STATUS_APPROVED
                          )
                        }
                      >
                        接受
                      </Button>
                    </div>
                  )}
                  {finalStatus === "matching" && (
                    <Tag color="blue">匹配中...</Tag>
                  )}
                  {finalStatus === "approved" && (
                    <Tag color="green">匹配成功</Tag>
                  )}
                  {finalStatus === "rejected" && (
                    <Tag color="red">匹配失败</Tag>
                  )}
                  {finalStatus === "stored" && (
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <Tag color="default">已暂存</Tag>
                      <Button
                        variant="outlined"
                        color="blue"
                        shape="round"
                        onClick={() => {
                          setReconnectModalOpen(true);
                          setCurrentConnectionId(connection.id);
                        }}
                      >
                        重新发起匹配
                      </Button>
                    </div>
                  )}

                  <Button
                    type="link"
                    className={styles.reportLink}
                    onClick={() => {
                      setReportDrawerOpen(true);
                      setCurrentConnectionId(connection.id);
                    }}
                  >
                    查看推荐报告 →
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={reconnectModalOpen}
        footer={false}
        title="重新发起匹配"
        onCancel={() => setReconnectModalOpen(false)}
      >
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <div style={{ fontSize: 16 }}>
            对方正在等待您的回应，快与 TA 一起沟通探讨吧！
          </div>
          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 12,
              justifyContent: "center",
            }}
          >
            <Button
              variant="outlined"
              color="red"
              shape="round"
              onClick={() => {
                setReconnectModalOpen(false);
                setRejectReasonModalOpen(true);
                setRejectReason([]);
                setRejectReasonOther("");
              }}
            >
              拒绝
            </Button>
            <Button
              variant="outlined"
              color="primary"
              shape="round"
              onClick={() => {
                setReconnectModalOpen(false);
                feedbackConnection(
                  currentConnectionId,
                  CANDIDATE_CONNECTION_APPROVE_STATUS_APPROVED
                );
              }}
            >
              接受
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={rejectReasonModalOpen}
        title={<div style={{ color: "#1fac6a" }}>帮助我们更好地为您推荐</div>}
        onCancel={() => setRejectReasonModalOpen(false)}
        onOk={() => {
          const finalRejectReasons: string[] = rejectReason.map((reasonKey) => {
            return reasonKey === "other"
              ? rejectReasonOther.trim()
              : REJECT_REASON_OPTIONS.find((r) => r.value === reasonKey)
                  ?.label ?? "";
          });

          if (finalRejectReasons.length === 0) {
            message.error("请选择拒绝理由");
            return;
          } else if (finalRejectReasons.includes("")) {
            message.error("请填写其它理由");
            return;
          }

          setRejectReasonModalOpen(false);
          feedbackConnection(
            currentConnectionId,
            CANDIDATE_CONNECTION_APPROVE_STATUS_REJECTED,
            finalRejectReasons
          );
        }}
      >
        <div style={{ marginTop: 16 }}>请问为什么拒绝 TA？</div>
        <Checkbox.Group
          options={REJECT_REASON_OPTIONS}
          value={rejectReason}
          onChange={(value) => setRejectReason(value)}
          className={styles.rejectReasonCheckboxGroup}
        />
        {rejectReason.includes("other") && (
          <Input.TextArea
            value={rejectReasonOther}
            onChange={(e) => setRejectReasonOther(e.target.value)}
            placeholder="请输入拒绝理由"
            style={{ marginTop: 8 }}
          />
        )}
      </Modal>

      <Drawer
        open={reportDrawerOpen}
        title={`${currentConnection?.target_candidate?.name} - 推荐报告`}
        onClose={() => setReportDrawerOpen(false)}
        width={1200}
      >
        <div>
          <MarkdownContainer
            content={currentConnection?.recommend_report ?? ""}
          />
        </div>
      </Drawer>
    </>
  );
};

export default ConnectionsList;
