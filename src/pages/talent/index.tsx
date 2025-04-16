import { useEffect, useState } from "react";
import { useParams } from "react-router";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { Get } from "../../utils/request";
import { TTalent } from "../job/components/Profile/type";
import { parseJSON } from "../../utils";

import styles from "./style.module.less";

const Talent = () => {
  const { jobId, talentId } = useParams();

  const [talent, setTalent] = useState<TTalent>();

  const { t: originalT } = useTranslation();

  const t = (key: string) => originalT(`talent.${key}`);

  useEffect(() => {
    fetchTalent();
  }, []);

  const fetchTalent = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}/talents/${talentId}`);

    if (code === 0) {
      setTalent({
        ...data.talent,
        evaluate_result: parseJSON(data.talent.evaluate_result),
      });
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
      <div className={styles.left}>简历正文</div>
      <div className={styles.right}>
        <div>
          <div>简历评估报告</div>
          <div>
            <div>评估总结</div>
            <div>{result.summary.reasoning}</div>
          </div>
        </div>
        <div>
          <div>
            <div>总体评估结果</div>
            <div>{result.summary.overall}</div>
          </div>
          <div>
            <div>
              <div>能力适合度</div>
              <div>{result.summary.competency}</div>
            </div>
            <div>
              <div>其它指标适合度</div>
              <div>{result.summary.logistics}</div>
            </div>
          </div>
        </div>
        <div>候选人排名: 1/1 processed so far</div>
        <div>
          <div>详细分析</div>
          <div>
            <div>具体职位要求分析</div>
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
                            group.items.filter((item) => item.judgement === key)
                              .length
                          }
                          /{group.items.length}
                          &nbsp;{t(key)}
                        </div>
                      ))}
                    </div>
                  </div>
                  {group.items.map((item) => {
                    return (
                      <div key={item.criterion} style={{ marginBottom: 32 }}>
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
                              {t("confidence_level")}:{t(item.confidence_level)}
                            </div>
                          )}
                        </div>
                        {/* <div>Points awarded: {item.points_awarded}</div> */}
                        <div className={styles.reasonRow}>
                          <div className={styles.reason}>{t("reason")}</div>
                          <div className={styles.evidence}>{t("evidence")}</div>
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
        </div>
      </div>
    </div>
  );
};

export default Talent;
