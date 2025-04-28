import { useEffect, useState } from "react";
import { useParams } from "react-router";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  QuestionCircleFilled,
} from "@ant-design/icons";
import { Get } from "../../utils/request";
import { TTalent } from "../job/components/Profile/type";
import { parseJSON } from "../../utils";

import styles from "./style.module.less";
import { Popover } from "antd";
import MarkdownContainer from "../../components/MarkdownContainer";

const Talent = () => {
  const { jobId, talentId } = useParams();

  const [talent, setTalent] = useState<TTalent>();
  const [meta, setMeta] = useState<{ rank: number; total: number }>();

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
        parsed_content: ((data.talent.parsed_content ?? "") as string).includes(
          "```markdown"
        )
          ? data.talent.parsed_content
              .replace(/^.*```markdown/s, "")
              .replace(/```$/, "")
          : data.talent.parsed_content,
      });
      setMeta(data.meta);
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
        <MarkdownContainer content={talent.parsed_content} />
      </div>
      <div className={styles.right}>
        <div className={styles.title}>{t("evaluate_report")}</div>
        <div className={styles.body}>
          <div className={styles.blockTitle}>{t("summary")}</div>
          <div className={styles.summary}>
            <MarkdownContainer content={result.summary.reasoning} />
          </div>
          <div className={styles.summaryMatch}>
            <div className={styles.summaryMatchTitle}>
              <div className={styles.summaryMatchTitleText}>{t("overall")}</div>
              <div className={styles.summaryMatchTitleHint}>
                {t(result.summary.overall)}
              </div>
            </div>
            <div className={styles.summaryMeet}>
              <div className={styles.summaryMeetItem}>
                <div className={styles.summaryMeetItemName}>
                  {t("compensation")}
                </div>
                <div className={styles.summaryMeetItemValue}>
                  {t(result.summary.competency)}
                </div>
              </div>
              <div className={styles.summaryMeetItem}>
                <div className={styles.summaryMeetItemName}>{t("other")}</div>
                <div className={styles.summaryMeetItemValue}>
                  {t(result.summary.logistics)}
                </div>
              </div>
            </div>
          </div>
          {meta && (
            <div className={styles.rank}>
              <DoubleRightOutlined style={{ marginRight: 4, fontSize: 12 }} />
              {t("rank")}:{" "}
              <span style={{ fontWeight: "bold", marginLeft: 8 }}>
                {`${meta.rank}/${meta.total} processed so far`}
              </span>
              <DoubleLeftOutlined style={{ marginLeft: 4, fontSize: 12 }} />
            </div>
          )}

          <div className={styles.blockTitle} style={{ marginTop: 20 }}>
            {t("details")}
          </div>

          <div>
            <div className={styles.detailItemTitle}>
              {t("details_requirement")}
            </div>
            <div style={{ paddingLeft: 12 }}>
              {groupedEvaluations.map((group) => {
                if (group.items.length === 0) return null;

                return (
                  <div key={group.title} style={{ marginBottom: 20 }}>
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
    </div>
  );
};

export default Talent;
