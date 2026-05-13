import React, { useEffect, useMemo, useState } from "react";
import classnames from "classnames";
import { useTranslation } from "react-i18next";

import legacyStyles from "../AtsTalentDetail/style.module.less";
import Icon from "@/components/Icon";
import StrengthFilled from "@/assets/icons/strength-filled";
import GapsFilled from "@/assets/icons/gaps-filled";
import ProbeFilled from "@/assets/icons/probe-filled";
import ChatMessagePreview from "@/components/ChatMessagePreview";
import EvaluateFeedback from "@/components/EvaluateFeedback";
import EvaluateResultBadge from "@/components/EvaluateResultBadge";
import { getEvaluateResultLevel } from "@/utils";
import { LogisticsFitKnownKeys, SkillsFitKnownKeys } from "@/utils/consts";
import { Tabs } from "antd";

const styles = legacyStyles;

type TActiveKey =
  | "requiredQuestions"
  | "evaluationSummary"
  | "candidateEvaluationReport"
  | "aiInterviewSummary";
export interface IAiPrescreeningDrawerBodyProps {
  report: TReport;
  talent: TTalent;
  job: IJob;
  talentChatMessages: TMessageFromApi[];
  onEvaluateFeedbackChange: (feedback: TEvaluateFeedback) => void;
  onOpenEvaluateFeedbackConversation: () => void;
}

const AiPrescreeningDrawerBody: React.FC<IAiPrescreeningDrawerBodyProps> = ({
  report,
  talent,
  job,
  talentChatMessages,
  onEvaluateFeedbackChange,
  onOpenEvaluateFeedbackConversation,
}) => {
  const { t: originalT } = useTranslation();
  const [visibleSections, setVisibleSections] = useState<TActiveKey[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id.split("-")[0];
          if (!id) return;

          if (entry.isIntersecting) {
            setVisibleSections((prev) => {
              if (!prev.includes(id as TActiveKey)) {
                return [...prev, id as TActiveKey];
              } else {
                return prev;
              }
            });
          } else {
            setVisibleSections((prev) => {
              return prev.filter((item) => item !== (id as TActiveKey));
            });
          }
        }
      },
      {
        root: document.getElementById("scroll-container"),
      },
    );

    [
      "requiredQuestions-section",
      "evaluationSummary-section",
      "candidateEvaluationReport-section",
      "aiInterviewSummary-section",
    ].forEach((key) => {
      const el = document.getElementById(key);
      if (el) {
        io.observe(el);
      }
    });

    return () => {
      io.disconnect();
    };
  }, []);

  const requirementsSummaryMappings = useMemo(() => {
    const m: Record<
      "p0" | "p1" | "p2",
      {
        level: "p0" | "p1" | "p2";
        description: string;
        assessment: string;
        reasoning: string;
      }[]
    > = { p0: [], p1: [], p2: [] };
    (report.requirements ?? []).forEach((item) => {
      m[item.level].push(item);
    });
    return m;
  }, [report.requirements]);

  const rawSkillsFitLevel = report.overall_recommendation?.skills_fit?.level;
  const skillsFitLabelMap: Record<TSkillsFitKey, string> = {
    ideal: "Ideal",
    good: "Good",
    overqualified: "Overqualified",
    near_fit: "Near Fit",
    uncertain: "Uncertain",
    poor: "Poor",
  };
  const skillsFitClassMap: Record<TSkillsFitKey, string> = {
    ideal: "evalDetailLevelIdeal",
    good: "evalDetailLevelGood",
    overqualified: "evalDetailLevelOverqualified",
    near_fit: "evalDetailLevelNearFit",
    uncertain: "evalDetailLevelUncertain",
    poor: "evalDetailLevelPoor",
  };
  const isKnownSkillsFitLevel = (
    level: string | undefined,
  ): level is TSkillsFitKey =>
    !!level && SkillsFitKnownKeys.includes(level as TSkillsFitKey);
  const skillsFitMeta =
    rawSkillsFitLevel && isKnownSkillsFitLevel(rawSkillsFitLevel)
      ? {
          label: skillsFitLabelMap[rawSkillsFitLevel],
          className: styles[skillsFitClassMap[rawSkillsFitLevel]],
        }
      : rawSkillsFitLevel
        ? {
            label: rawSkillsFitLevel,
            className: styles.evalDetailLevelNeutral,
          }
        : null;

  const logisticsLevelsRaw =
    report.overall_recommendation?.logistics_fit?.level;
  const logisticsLevels = Array.isArray(logisticsLevelsRaw)
    ? logisticsLevelsRaw
    : logisticsLevelsRaw
      ? [logisticsLevelsRaw]
      : [];
  const logisticsLevelMeta = logisticsLevels.map((level) => ({
    label: LogisticsFitKnownKeys.includes(level as TLogisticsFitKey)
      ? originalT(`job_talents.logistics_fit_options.${level}`)
      : level,
    className:
      level === "no_issues"
        ? styles.evalDetailLevelGood
        : styles.evalDetailLevelNeutral,
  }));

  const rawInterestLevel = report.summary?.interest_level?.level;
  type TInterestLevelKey = "high" | "moderate" | "low" | "unclear";
  const interestLabelMap: Record<TInterestLevelKey, string> = {
    high: "High",
    moderate: "Moderate",
    low: "Low",
    unclear: "Unclear",
  };
  const interestClassMap: Record<TInterestLevelKey, string> = {
    high: "evalDetailLevelHigh",
    moderate: "evalDetailLevelModerate",
    low: "evalDetailLevelLow",
    unclear: "evalDetailLevelUnclear",
  };
  const isKnownInterestLevel = (
    level: string | undefined,
  ): level is TInterestLevelKey =>
    !!level && Object.keys(interestClassMap).includes(level);
  const interestLevelMeta =
    rawInterestLevel && isKnownInterestLevel(rawInterestLevel)
      ? {
          label: interestLabelMap[rawInterestLevel],
          className: styles[interestClassMap[rawInterestLevel]],
        }
      : rawInterestLevel
        ? {
            label: rawInterestLevel,
            className: styles.evalDetailLevelUnclear,
          }
        : null;

  const scrollToSection = (key: TActiveKey) => {
    const element = document.getElementById(`${key}-section`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const activeKey = useMemo(() => {
    const visibles = [
      "requiredQuestions",
      "evaluationSummary",
      "candidateEvaluationReport",
      "aiInterviewSummary",
    ].filter((key) => {
      return visibleSections.includes(key as TActiveKey);
    });
    return visibles.length > 0
      ? visibles[visibles.length - 1]
      : "requiredQuestions";
  }, [visibleSections]);

  return (
    <div
      className={styles.interviewsSection}
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        marginTop: 0,
      }}
    >
      <Tabs
        style={{
          margin: "0 15px",
        }}
        activeKey={activeKey}
        onChange={(key) => scrollToSection(key as TActiveKey)}
        items={[
          {
            key: "requiredQuestions",
            label: "Required Questions",
          },
          {
            key: "evaluationSummary",
            label: "Evaluation Summary",
          },
          {
            key: "candidateEvaluationReport",
            label: "Candidate Evaluation Report",
          },
          {
            key: "aiInterviewSummary",
            label: "AI Interview Summary",
          },
        ]}
      />
      <div style={{ flex: 1, overflow: "auto" }} id="scroll-container">
        <div id="requiredQuestions-section"></div>
        <div className={styles.evalSummaryCard} id="evaluationSummary-section">
          <div
            className={classnames(
              styles.evalSummaryHeader,
              styles.bluePoint,
              styles.evalSummaryHeaderRow,
            )}
          >
            <span>Evaluation Summary</span>
            <EvaluateFeedback
              value={talent.evaluate_feedback}
              onChange={onEvaluateFeedbackChange}
              onOpen={onOpenEvaluateFeedbackConversation}
            />
          </div>
          <div className={styles.evalSummaryContent}>
            <div className={styles.evalOverallText}>
              <div className={styles.evalOverallLabel}>
                <span>Worth Interviewing?</span>
                <EvaluateResultBadge result={getEvaluateResultLevel(report)} />
              </div>
              <div className={styles.evalOverallDescription}>
                {report.summary?.description || report.thumbnail_summary}
              </div>
            </div>
            <div className={styles.evalDetailItem}>
              <div className={styles.evalDetailTitle}>
                <span>Skills Fit</span>
                {skillsFitMeta && (
                  <div
                    className={classnames(
                      styles.evalDetailLevel,
                      skillsFitMeta.className,
                    )}
                  >
                    {skillsFitMeta.label}
                  </div>
                )}
              </div>
              <div className={styles.evalDetailDesc}>
                {report.overall_recommendation?.skills_fit?.explanation}
              </div>
            </div>
            <div className={styles.evalDetailItem}>
              <div className={styles.evalDetailTitle}>
                <span>Logistics Fit</span>
                <div className={styles.evalDetailTags}>
                  {logisticsLevelMeta.map((item) => (
                    <div
                      className={classnames(
                        styles.evalDetailLevel,
                        item.className,
                      )}
                      key={item.label}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.evalDetailDesc}>
                {report.overall_recommendation?.logistics_fit?.explanation}
              </div>
            </div>
            <div className={styles.evalDetailItem}>
              <div className={styles.evalDetailTitle}>
                <span>Interest Level</span>
                {interestLevelMeta && (
                  <div
                    className={classnames(
                      styles.evalDetailLevel,
                      interestLevelMeta.className,
                    )}
                  >
                    {interestLevelMeta.label}
                  </div>
                )}
              </div>
              <div className={styles.evalDetailDesc}>
                {report.summary?.interest_level?.explanation}
              </div>
            </div>
          </div>
        </div>

        <div
          className={styles.candidateEvalSection}
          id="candidateEvaluationReport-section"
        >
          <div className={styles.candidateEvalHeader}>
            <div
              className={classnames(
                styles.candidateEvalTitle,
                styles.bluePoint,
              )}
            >
              Candidate Evaluation Report
            </div>
          </div>
          <div className={classnames(styles.candidateEvalLayout, styles.block)}>
            <div className={styles.candidateEvalLeft}>
              <div className={styles.evalBlock} style={{ padding: 0 }}>
                <div className={styles.evalBlockTitle}>
                  Requirements Summary
                </div>
                <div className={styles.requirementsSummaryTableWrap}>
                  <div
                    className={`${styles.requirementsSummarySummaryRow} ${styles.requirementsSummarySummaryHeader}`}
                  >
                    <div>Requirement Priorities</div>
                    <div>No. of Requirements Met</div>
                  </div>
                  {(["p0", "p1", "p2"] as const).map((level) => {
                    const items = requirementsSummaryMappings[level];
                    if (!items.length) return null;
                    const meetCount = items.filter(
                      (item) => item.assessment === "meets",
                    ).length;
                    return (
                      <div
                        key={level}
                        className={styles.requirementsSummarySummaryRow}
                      >
                        <div>
                          <div
                            className={classnames(
                              styles.levelTag,
                              styles[level],
                            )}
                          >
                            {level.toUpperCase()}
                          </div>
                        </div>
                        <div className={styles.requirementsSummaryAssessment}>
                          <span>{meetCount}&nbsp;</span>/&nbsp;
                          {items.length}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className={styles.evalBlock} style={{ padding: 0 }}>
                <div className={styles.evalBlockTitle}>
                  Detailed Requirements Analysis
                </div>
                <div className={styles.requirementsSummaryTable}>
                  <div
                    className={`${styles.requirementsSummaryRow} ${styles.requirementsSummaryHeader}`}
                  >
                    <div>Priority</div>
                    <div>Requirement</div>
                    <div>Assessment</div>
                    <div>Reasoning</div>
                  </div>
                  {(report.requirements ?? []).map((item, index) => (
                    <div
                      key={index}
                      className={`${styles.requirementsSummaryRow} ${styles.requirementsSummaryItem} ${styles[item.level]}`}
                    >
                      <div>
                        <div
                          className={classnames(
                            styles.levelTag,
                            styles[item.level],
                          )}
                        >
                          {item.level.toUpperCase()}
                        </div>
                      </div>
                      <div>{item.description}</div>
                      <div>
                        <div
                          className={classnames(
                            styles[item.assessment],
                            styles.assessmentText,
                          )}
                        >
                          {originalT(`assessment_options.${item.assessment}`)}
                        </div>
                      </div>
                      <div>{item.reasoning}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.candidateEvalRight}>
              {(report.key_strengths ?? []).length > 0 && (
                <div className={`${styles.evalBlock} ${styles.strengthsBlock}`}>
                  <div className={styles.evalBlockTitle}>
                    <Icon icon={<StrengthFilled />} />
                    Strengths
                  </div>
                  <div className={styles.evalList}>
                    {(report.key_strengths ?? []).map((strength, index) => (
                      <div key={index} className={styles.listItem}>
                        <span className={styles.listTitle}>
                          {strength.title}:
                        </span>
                        <span className={styles.snapshotContent}>
                          {strength.details}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(report.potential_gaps ?? []).length > 0 && (
                <div className={`${styles.evalBlock} ${styles.gapsBlock}`}>
                  <div className={styles.evalBlockTitle}>
                    <Icon icon={<GapsFilled />} />
                    Potential Gaps
                  </div>
                  <div className={styles.evalList}>
                    {(report.potential_gaps ?? []).map((gap, index) => (
                      <div key={index} className={styles.listItem}>
                        <span className={styles.listTitle}>{gap.title}:</span>
                        <span className={styles.gapContent}>{gap.details}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(report.areas_to_probe_further ?? []).length > 0 && (
                <div className={`${styles.evalBlock} ${styles.areasBlock}`}>
                  <div className={styles.evalBlockTitle}>
                    <Icon icon={<ProbeFilled />} />
                    Areas to Probe in Next Rounds
                  </div>
                  <div className={styles.evalList}>
                    {(report.areas_to_probe_further ?? []).map(
                      (area, index) => (
                        <div key={index} className={styles.listItem}>
                          <span className={styles.listTitle}>
                            {area.title}:
                          </span>
                          <span className={styles.areaContent}>
                            {area.details}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={styles.aiSummarySection}
          id="aiInterviewSummary-section"
        >
          <div className={styles.aiSummaryLayout} style={{ display: "block" }}>
            <div className={styles.aiSummaryLeft}>
              <div className={styles.aiSummaryGrid}>
                <div
                  className={classnames(
                    styles.aiSummaryTitle,
                    styles.bluePoint,
                  )}
                  style={{ margin: "0 12px" }}
                >
                  AI Interview Summary
                </div>
                <div className={styles.aiSummaryBg}>
                  {(report.ai_interview_summary?.topics_covered?.narrative ||
                    (report.ai_interview_summary?.topics_covered?.topics ?? [])
                      .length > 0) && (
                    <div className={styles.aiSummaryCard}>
                      <div className={styles.aiSummaryTitle}>
                        Topics Covered
                      </div>
                      {!!report.ai_interview_summary?.topics_covered
                        ?.narrative && (
                        <p className={styles.aiSummaryNarrative}>
                          {
                            report.ai_interview_summary?.topics_covered
                              ?.narrative
                          }
                        </p>
                      )}
                      <ul className={styles.aiSummaryList}>
                        {(
                          report.ai_interview_summary?.topics_covered?.topics ??
                          []
                        ).map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(report.ai_interview_summary?.key_revelations ?? []).length >
                    0 && (
                    <div className={styles.aiSummaryCard}>
                      <div className={styles.aiSummaryTitle}>
                        Key Revelations
                      </div>
                      <ul className={styles.aiSummaryList}>
                        {(
                          report.ai_interview_summary?.key_revelations ?? []
                        ).map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(report.ai_interview_summary?.interview_observations ?? [])
                    .length > 0 && (
                    <div className={styles.aiSummaryCard}>
                      <div className={styles.aiSummaryTitle}>
                        Interview Observations
                      </div>
                      <ul className={styles.aiSummaryList}>
                        {(
                          report.ai_interview_summary?.interview_observations ??
                          []
                        ).map((item, index) => (
                          <li key={index}>
                            <span className={styles.aiSummaryItemTitle}>
                              {item.title}:
                            </span>{" "}
                            {item.details}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.aiSummaryRight}>
              <div className={classnames(styles.aiTranscriptHeader)}>
                AI Interview Transcript
              </div>
              <div className={styles.aiTranscriptBody}>
                <ChatMessagePreview
                  messages={talentChatMessages}
                  job={job}
                  talent={talent}
                  fontSize={14}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiPrescreeningDrawerBody;
