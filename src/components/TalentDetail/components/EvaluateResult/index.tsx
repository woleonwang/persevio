import classnames from "classnames";
import { useTranslation } from "react-i18next";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  QuestionCircleFilled,
} from "@ant-design/icons";
import MarkdownContainer from "@/components/MarkdownContainer";

import styles from "./style.module.less";
import { Empty, Popover } from "antd";

interface IProps {
  result: TEvaluationResult;
}
const EvaluateResult = (props: IProps) => {
  const { result } = props;

  const { t: originalT } = useTranslation();

  const t = (key: string) => originalT(`talent.${key}`);

  const groupedEvaluations = [
    {
      title: originalT(`ideal_profile.minimum`),
      items: (result.evaluation ?? []).filter(
        (item) => item.priority === "minimum"
      ),
    },
    {
      title: originalT(`ideal_profile.big_plus`),
      items: (result.evaluation ?? []).filter(
        (item) => item.priority === "big_plus"
      ),
    },
    {
      title: originalT(`ideal_profile.plus`),
      items: (result.evaluation ?? []).filter(
        (item) => item.priority === "plus"
      ),
    },
  ];

  const getReasoning = (result: TEvaluationResult) => {
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
  return (
    <div className={styles.body}>
      {result.evaluation_summary ? (
        <>
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
        </>
      ) : (
        <Empty />
      )}
    </div>
  );
};

export default EvaluateResult;
