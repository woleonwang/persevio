import { useEffect, useState } from "react";
import { useParams } from "react-router";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import {
  CheckCircleFilled,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { Get } from "../../utils/request";
import { TTalent } from "../job/components/Profile/type";
import { parseJSON } from "../../utils";

import styles from "./style.module.less";
import { Popover, Tooltip } from "antd";

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
        <div className={styles.title}>简历评估报告</div>
        <div className={styles.body}>
          <div className={styles.blockTitle}>评估总结</div>
          <div className={styles.summary}>{result.summary.reasoning}</div>
          <div className={styles.summaryMatch}>
            <div className={styles.summaryMatchTitle}>
              <div className={styles.summaryMatchTitleText}>总体评估结果</div>
              <div className={styles.summaryMatchTitleHint}>
                {originalT(`profile.${result.summary.overall}`)}
              </div>
            </div>
            <div className={styles.summaryMeet}>
              <div className={styles.summaryMeetItem}>
                <div className={styles.summaryMeetItemName}>能力适合度</div>
                <div className={styles.summaryMeetItemValue}>
                  {originalT(`profile.${result.summary.competency}`)}
                </div>
              </div>
              <div className={styles.summaryMeetItem}>
                <div className={styles.summaryMeetItemName}>其它指标适合度</div>
                <div className={styles.summaryMeetItemValue}>
                  {originalT(`profile.${result.summary.logistics}`)}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.rank}>
            <DoubleRightOutlined style={{ marginRight: 4, fontSize: 12 }} />
            候选人排名:{" "}
            <span style={{ fontWeight: "bold", marginLeft: 8 }}>
              1/1 processed so far
            </span>
            <DoubleLeftOutlined style={{ marginLeft: 4, fontSize: 12 }} />
          </div>

          <div className={styles.blockTitle} style={{ marginTop: 20 }}>
            详细分析
          </div>

          <div>
            <div className={styles.detailItemTitle}>具体职位要求分析</div>
            <div style={{ paddingLeft: 12 }}>
              {groupedEvaluations.map((group) => {
                if (group.items.length === 0) return null;

                return (
                  <div key={group.title} style={{ marginBottom: 20 }}>
                    {/* <div className={styles.groupTitle}>
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
                  </div> */}
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
                                      <QuestionCircleOutlined
                                        style={{ color: "white" }}
                                      />
                                    ),
                                    not_met: (
                                      <CloseCircleOutlined
                                        style={{ color: "white" }}
                                      />
                                    ),
                                  }[item.judgement]
                                }
                                <div className={styles.tagText}>
                                  {originalT(`profile.${item.judgement}`)}
                                </div>
                              </div>
                              <div className={styles.confidenceText}>
                                信心:
                                {item.judgement === "met"
                                  ? originalT(
                                      `profile.${item.confidence_level}`
                                    )
                                  : item.reasons?.[0]?.reason}
                              </div>
                            </div>
                          </div>

                          {item.judgement === "met" && (
                            <div className={styles.reason}>
                              <div className={styles.reasonHeader}>
                                <span className={styles.reasonTitle}>
                                  判断原因
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
                                    简历相关原文
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
    </div>
  );
};

export default Talent;
