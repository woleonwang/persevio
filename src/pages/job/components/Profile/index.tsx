import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import classnames from "classnames";

import { Get } from "../../../../utils/request";
import { Button, Drawer, List } from "antd";
import styles from "./style.module.less";
import { TEvaluation } from "./type";
import { parseJSON } from "../../../../utils";

type TCandidate = {
  name: string;
};

type TTalent = {
  id: number;
  candidate_id: number;
  status: "evaluate_succeed" | "evaluate_failed";
  evaluate_result: TEvaluation;
  file_path: string;
  content: string;
  job_id: number;
  created_at: string;
  updated_at: string;
  candidate: TCandidate;
};

const Profile = (props: { jobId: number }) => {
  const { jobId } = props;
  const [talents, setTalents] = useState<TTalent[]>([]);
  const [job, setJob] = useState<IJob>();

  // const [modalShow, setModalShow] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<TTalent>();

  const { t: originalT } = useTranslation();

  const t = (key: string) => {
    return originalT(`profile.${key}`);
  };

  useEffect(() => {
    fetchJob();
    fetchTalents();
  }, [jobId]);

  const fetchJob = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}`);
    if (code === 0) {
      setJob(data.job);
    }
  };

  const fetchTalents = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}/talents`);
    if (code === 0) {
      setTalents(
        data.talents.map((talent: any) => {
          let evaluateResult;
          try {
            evaluateResult = parseJSON(talent.evaluate_result);
          } catch (e) {}

          return {
            ...talent,
            evaluate_result: evaluateResult,
          };
        })
      );
    }
  };

  const downloadFile = (id: number) => {
    window.open(`/api/public/jobs/${jobId}/talents/${id}/download`);
  };

  return (
    <div className={styles.listWrapper}>
      <List
        style={{ width: "100%" }}
        dataSource={talents}
        bordered
        itemLayout="horizontal"
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                size="small"
                type="primary"
                onClick={() => setSelectedTalent(item)}
                disabled={!item.evaluate_result}
              >
                {t("show_result")}
              </Button>,
              <Button
                size="small"
                type="primary"
                onClick={() => downloadFile(item.id)}
              >
                {t("download_resume")}
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <div style={{ fontSize: 18 }}>
                  {item.evaluate_result?.talent?.name ?? "-"}
                </div>
              }
            />
          </List.Item>
        )}
      />

      <Drawer
        open={!!selectedTalent}
        onClose={() => setSelectedTalent(undefined)}
        width={"800px"}
        title={`${job?.name} - ${selectedTalent?.evaluate_result?.talent?.name}`}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="primary">{originalT("close")}</Button>
          </div>
        }
      >
        {(() => {
          if (!selectedTalent) return null;

          const result = selectedTalent.evaluate_result;

          const groupedEvaluations = [
            {
              title: originalT(`ideal_profile.minimum`),
              items: result.evaluation.filter(
                (item) => item.priority === "minimum"
              ),
            },
            {
              title: originalT(`ideal_profile.big_plus`),
              items: result.evaluation.filter(
                (item) => item.priority === "big_plus"
              ),
            },
            {
              title: originalT(`ideal_profile.plus`),
              items: result.evaluation.filter(
                (item) => item.priority === "plus"
              ),
            },
          ];

          return (
            <div>
              <div>
                {groupedEvaluations.map((group) => {
                  if (group.items.length === 0) return null;

                  return (
                    <div key={group.title} style={{ marginBottom: 20 }}>
                      <div className={styles.groupTitle}>
                        <h3>{group.title}</h3>
                        <div className={styles.metSummary}>
                          {["met", "not_sure", "not_met"].map((key) => (
                            <div key={key} className={styles.metSummaryBlock}>
                              {
                                group.items.filter(
                                  (item) => item.judgement === key
                                ).length
                              }
                              /{group.items.length}
                              &nbsp;{t(key)}
                            </div>
                          ))}
                        </div>
                      </div>
                      {group.items.map((item) => {
                        return (
                          <div
                            key={item.criterion}
                            style={{ marginBottom: 32 }}
                          >
                            <div className={styles.criterionTitle}>
                              <div
                                className={classnames(
                                  styles.status,
                                  styles[`status-${item.judgement}`]
                                )}
                              >
                                {item.criterion}
                              </div>
                              <div>
                                {
                                  {
                                    met: (
                                      <CheckCircleOutlined
                                        style={{ color: "#1fac6a" }}
                                      />
                                    ),
                                    not_sure: (
                                      <QuestionCircleOutlined
                                        style={{ color: "orange" }}
                                      />
                                    ),
                                    not_met: (
                                      <CloseCircleOutlined
                                        style={{ color: "red" }}
                                      />
                                    ),
                                  }[item.judgement]
                                }
                              </div>
                              {item.confidence_level && (
                                <div style={{ flex: "none" }}>
                                  {t("confidence_level")}:
                                  {t(item.confidence_level)}
                                </div>
                              )}
                            </div>
                            {/* <div>Points awarded: {item.points_awarded}</div> */}
                            <div className={styles.reasonRow}>
                              <div className={styles.reason}>{t("reason")}</div>
                              <div className={styles.evidence}>
                                {t("evidence")}
                              </div>
                            </div>
                            {item.reasons.map((reason) => {
                              return (
                                <div
                                  key={reason.reason}
                                  className={styles.reasonRow}
                                >
                                  <div className={styles.reason}>
                                    {reason.reason}
                                  </div>
                                  <div className={styles.evidence}>
                                    {reason.evidences.map((evidence) => (
                                      <div key={evidence}>{evidence}</div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <div>
                <h2>Score</h2>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>
                    {originalT("ideal_profile.minimum")}:
                  </div>
                  <div>{result.summary.suitability_score.minimum}</div>
                </div>

                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>
                    {originalT("ideal_profile.big_plus")}:
                  </div>
                  <div>{result.summary.suitability_score.big_plus}</div>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>
                    {originalT("ideal_profile.plus")}:
                  </div>
                  <div>{result.summary.suitability_score.plus}</div>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>{t("bonus")}:</div>
                  <div>{result.summary.suitability_score.bonus}</div>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>{t("total")}:</div>
                  <div>{result.summary.suitability_score.total}</div>
                </div>
              </div>

              <div>
                {/* <div>
                  Status:{" "}
                  {selectedTalent?.status === "evaluate_succeed"
                    ? "Passed"
                    : "Failed"}
                </div> */}
                <h2>Summary</h2>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>{t("overall")}:</div>
                  <div className={styles.summaryValue}>
                    {t(result.summary.overall)}
                  </div>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>{t("competency")}:</div>
                  <div className={styles.summaryValue}>
                    {t(result.summary.competency)}
                  </div>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>{t("logistics")}:</div>
                  <div className={styles.summaryValue}>
                    {t(result.summary.logistics)}
                  </div>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>{t("reasoning")}:</div>
                  <div className={styles.summaryValue}>
                    {result.summary.reasoning}
                  </div>
                </div>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>{t("total")}:</div>
                  <div className={styles.summaryValue}>
                    {result.summary.calculated_rank}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
};

export default Profile;
