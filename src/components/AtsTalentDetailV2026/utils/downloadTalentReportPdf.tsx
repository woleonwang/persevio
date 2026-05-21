import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import classnames from "classnames";
import dayjs from "dayjs";
import { message } from "antd";

import { downloadMarkdownAsPDF, getEvaluateResultLevel } from "@/utils";
import { LogisticsFitKnownKeys } from "@/utils/consts";
import { SkillsFitKnownKeys } from "@/utils/consts";
import { Post } from "@/utils/request";

import { trPdf } from "./talentReportPdfClassNames";
import "./talentReportPdf.less";

export type TReportDownloadLocale = "en" | "zh";

export type DownloadTalentReportPdfArgs = {
  pdfReportRef: React.RefObject<HTMLDivElement | null>;
  talent: TTalent;
  job: { name: string; invitation_token: string };
  report: TReport;
  lastUpdated?: string;
  originalT: (key: string) => string;
  locale?: TReportDownloadLocale;
  jobId: string;
  talentId: string;
};

export async function downloadTalentReportPdf({
  pdfReportRef,
  talent,
  job,
  report,
  lastUpdated,
  originalT,
  locale = "en",
  jobId,
  talentId,
}: DownloadTalentReportPdfArgs) {
  if (!pdfReportRef.current) {
    message.error("Report is not ready yet.");
    return;
  }

  const pdfReqByLevel: Record<
    "p0" | "p1" | "p2",
    { assessment?: string; assessment_type?: string }[]
  > = { p0: [], p1: [], p2: [] };
  (report.requirements ?? []).forEach((item) => {
    pdfReqByLevel[item.level].push({
      assessment: item.assessment,
    });
  });

  const evalLevel = getEvaluateResultLevel(report);
  const overallFitLabel = originalT(
    `job_talents.evaluate_result_options.${evalLevel}`,
  );

  const pdfRawSkillsFitLevel = report.overall_recommendation?.skills_fit?.level;
  const pdfIsKnownSkillsFit = (
    level: string | undefined,
  ): level is TSkillsFitKey =>
    !!level && SkillsFitKnownKeys.includes(level as TSkillsFitKey);
  const pdfSkillsFitLabels: Record<TSkillsFitKey, string> = {
    ideal: "Ideal",
    good: "Good",
    overqualified: "Overqualified",
    near_fit: "Near Fit",
    uncertain: "Uncertain",
    poor: "Poor",
  };
  const pdfSkillsFitLabel =
    pdfRawSkillsFitLevel && pdfIsKnownSkillsFit(pdfRawSkillsFitLevel)
      ? pdfSkillsFitLabels[pdfRawSkillsFitLevel]
      : pdfRawSkillsFitLevel || "";

  const skillsFitBadgeClass =
    pdfRawSkillsFitLevel === "poor"
      ? trPdf.badgeRed
      : pdfRawSkillsFitLevel === "uncertain" ||
          pdfRawSkillsFitLevel === "near_fit"
        ? trPdf.badgeOrange
        : pdfRawSkillsFitLevel === "overqualified"
          ? trPdf.badgeBlue
          : trPdf.badgeGray;

  const logisticsLevelsRaw =
    report.overall_recommendation?.logistics_fit?.level;
  const logisticsLevels = Array.isArray(logisticsLevelsRaw)
    ? logisticsLevelsRaw
    : logisticsLevelsRaw
      ? [logisticsLevelsRaw]
      : [];

  const pdfRawInterestLevel = report.summary?.interest_level?.level;
  type TPdfInterestKey = "high" | "moderate" | "low" | "unclear";
  const pdfInterestKnown: TPdfInterestKey[] = [
    "high",
    "moderate",
    "low",
    "unclear",
  ];
  const pdfIsKnownInterest = (
    level: string | undefined,
  ): level is TPdfInterestKey =>
    !!level && pdfInterestKnown.includes(level as TPdfInterestKey);
  const pdfInterestLabels: Record<TPdfInterestKey, string> = {
    high: "High",
    moderate: "Moderate",
    low: "Low",
    unclear: "Unclear",
  };
  const pdfInterestLabel =
    pdfRawInterestLevel && pdfIsKnownInterest(pdfRawInterestLevel)
      ? pdfInterestLabels[pdfRawInterestLevel]
      : pdfRawInterestLevel || "";

  const interestBadgeClass =
    pdfRawInterestLevel === "high"
      ? trPdf.badgeGreen
      : pdfRawInterestLevel === "moderate" || pdfRawInterestLevel === "low"
        ? trPdf.badgeOrange
        : trPdf.badgeGray;

  const headerFitStatusClass =
    evalLevel === "no"
      ? trPdf.fitStatusNegative
      : evalLevel === "maybe" || evalLevel === "yes_but"
        ? trPdf.fitStatusWarning
        : trPdf.fitStatusPositive;

  const fitPillToneClass =
    evalLevel === "no"
      ? trPdf.fitPillNegative
      : evalLevel === "maybe" || evalLevel === "yes_but"
        ? trPdf.fitPillWarning
        : trPdf.fitPillPositive;

  const generatedOn = lastUpdated
    ? dayjs(lastUpdated).format("YYYY/MM/DD")
    : dayjs().format("YYYY/MM/DD");

  const keyInfoCardTone = ["blue", "cyan", "blue", "lavender", "blue"] as const;
  const keyInfoToneClass = (i: number) => {
    const t = keyInfoCardTone[i % keyInfoCardTone.length];
    if (t === "blue") return trPdf.keyCardBlue;
    if (t === "cyan") return trPdf.keyCardCyan;
    return trPdf.keyCardLavender;
  };

  const assessmentPillClass = (a?: string) => {
    if (a === "meets") return trPdf.assessmentMeets;
    if (a === "does_not_meet") return trPdf.assessmentNo;
    return trPdf.assessmentPartial;
  };

  const pdfPriorityToneClass = (level: "p0" | "p1" | "p2") => {
    if (level === "p0") return trPdf.priorityP0;
    if (level === "p1") return trPdf.priorityP1;
    return trPdf.priorityP2;
  };

  const areasToProbe = report.areas_to_probe_further ?? [];
  const hiringManagerQuestions = report.hiring_manager_questions ?? [];

  const pdfHtml = renderToStaticMarkup(
    <main className={trPdf.page}>
      <div className={trPdf.reportStack}>
        <header className={trPdf.pageHeader}>
          <div>
            <div className={trPdf.eyebrow}>Candidate Report</div>
            <h1 className={trPdf.headerTitle}>{talent.name}</h1>
            <p className={trPdf.headerSubtitle}>
              {job.name.replace(/\s*-\s*/g, " – ")}
            </p>
          </div>
          <div className={trPdf.headerMeta}>
            <div className={trPdf.metaLabel}>Generated On</div>
            <div className={trPdf.metaValue}>{generatedOn}</div>
            <p className={trPdf.headerSubtitleBy}>by Persevio</p>
          </div>
        </header>

        <section
          className={classnames(
            trPdf.sectionCard,
            trPdf.profileSnapshot,
          )}
          aria-labelledby="pdf-profile-snapshot"
        >
          <div className={trPdf.sectionInner}>
            <div className={trPdf.sectionHeadingRow}>
              <h2
                className={trPdf.sectionHeading}
                id="pdf-profile-snapshot"
              >
                Profile Snapshot
              </h2>
            </div>
            <div className={classnames(trPdf.snapshotGrid)}>
              {(report.profile_snapshot ?? []).map((snapshot, index) => (
                <div
                  className={classnames(
                    trPdf.snapshotItem,
                    trPdf.avoidBreak,
                  )}
                  key={`${snapshot.title}-${index}`}
                >
                  <h3>{snapshot.title}</h3>
                  {Array.isArray(snapshot.details) ? (
                    <ul className={trPdf.avoidBreak}>
                      {snapshot.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={trPdf.avoidBreak}>{snapshot.details}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className={trPdf.sectionCard}
          aria-labelledby="pdf-key-info"
        >
          <div className={trPdf.sectionInner}>
            <div className={trPdf.sectionHeadingRow}>
              <h2 className={trPdf.sectionHeading} id="pdf-key-info">
                Key Information
              </h2>
            </div>
            <div className={trPdf.keyGrid}>
              {(report.key_information ?? [])
                .filter((information) => information.title !== "Compensation")
                .map((information, index) => (
                  <article
                    className={classnames(
                      trPdf.keyCard,
                      trPdf.avoidBreak,
                      keyInfoToneClass(index),
                    )}
                    key={`${information.title}-${index}`}
                  >
                    <h3>{information.title}</h3>
                    <p>{information.details}</p>
                  </article>
                ))}
            </div>
          </div>
        </section>

        <section
          className={trPdf.sectionCard}
          aria-labelledby="pdf-interview-report"
        >
          <div className={trPdf.reportHead}>
            <h2 className={trPdf.roundTitle} id="pdf-interview-report">
              Interview Report: Round 0 - AI Prescreening
            </h2>
            <span
              className={classnames(trPdf.fitStatus, headerFitStatusClass)}
            >
              <span style={{ color: "#666" }}>Interview?</span>{" "}
              {overallFitLabel}
            </span>
          </div>

          <div className={trPdf.reportBody}>
            <div className={trPdf.requiredQuestionsWrap}>
              <div className={trPdf.subsectionTitle}>
                <span className={trPdf.dot} aria-hidden />
                <span>Required Questions</span>
              </div>
              <div className={trPdf.requiredQuestionsCard}>
                {hiringManagerQuestions.length > 0 ? (
                  hiringManagerQuestions.map((item, index) => (
                    <div
                      key={index}
                      className={classnames(
                        trPdf.hmQuestionBlock,
                        trPdf.avoidBreak,
                      )}
                    >
                      <div className={trPdf.hmQuestionRow}>
                        <span className={trPdf.hmQuestionIndex}>
                          Q{index + 1}
                        </span>
                        <div className={trPdf.hmQuestionText}>
                          {item.question}
                        </div>
                      </div>
                      <div className={trPdf.responseContextBox}>
                        <div className={trPdf.responseContextLabel}>
                          Response Context
                        </div>
                        <div className={trPdf.responseContextBody}>
                          {item.response_context?.trim()
                            ? item.response_context
                            : "—"}
                        </div>
                      </div>
                      <div className={trPdf.candidateAnswerBox}>
                        <div className={trPdf.candidateAnswerLabel}>
                          Candidate Answer
                        </div>
                        <div className={trPdf.candidateAnswerBody}>
                          {item.candidate_answer ?? ""}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={trPdf.requiredQuestionsEmpty}>
                    No required questions for this evaluation.
                  </div>
                )}
              </div>
            </div>

            <div className={trPdf.subsectionTitle}>
              <span className={trPdf.dot} aria-hidden />
              <span>Evaluation Summary</span>
            </div>

            <section
              className={classnames(
                trPdf.evaluationCard,
                trPdf.avoidBreak,
              )}
              aria-labelledby="pdf-overall-fit"
            >
              <div className={trPdf.fitRow}>
                <h4 id="pdf-overall-fit">Interview Recommendation</h4>
                <span
                  className={classnames(trPdf.fitPill, fitPillToneClass)}
                >
                  {overallFitLabel}
                </span>
              </div>
              <p className={trPdf.fitCopy}>
                {report.summary?.description || report.thumbnail_summary}
              </p>

              <div className={trPdf.metricRow}>
                <div className={trPdf.metricHead}>
                  <h5>Skills Fit</h5>
                  {!!pdfSkillsFitLabel && (
                    <span
                      className={classnames(
                        trPdf.badge,
                        skillsFitBadgeClass,
                      )}
                    >
                      {pdfSkillsFitLabel}
                    </span>
                  )}
                </div>
                <p className={trPdf.metricCopy}>
                  {report.overall_recommendation?.skills_fit?.explanation}
                </p>
              </div>

              <div className={trPdf.metricRow}>
                <div className={trPdf.metricHead}>
                  <h5>Logistics Fit</h5>
                  <div className={trPdf.metricBadgeWrap}>
                    {logisticsLevels.map((level) => (
                      <span
                        className={classnames(
                          trPdf.badge,
                          level === "no_issues"
                            ? trPdf.badgeGreen
                            : trPdf.badgeOrange,
                        )}
                        key={level}
                      >
                        {LogisticsFitKnownKeys.includes(
                          level as TLogisticsFitKey,
                        )
                          ? originalT(
                              `job_talents.logistics_fit_options.${level}`,
                            )
                          : level}
                      </span>
                    ))}
                  </div>
                </div>
                <p className={trPdf.metricCopy}>
                  {report.overall_recommendation?.logistics_fit?.explanation}
                </p>
              </div>

              <div className={trPdf.metricRow}>
                <div className={trPdf.metricHead}>
                  <h5>Interest Level</h5>
                  {!!pdfInterestLabel && (
                    <span
                      className={classnames(
                        trPdf.badge,
                        interestBadgeClass,
                      )}
                    >
                      {pdfInterestLabel}
                    </span>
                  )}
                </div>
                <p className={trPdf.metricCopy}>
                  {report.summary?.interest_level?.explanation}
                </p>
              </div>
            </section>

            <div className={trPdf.reportSection}>
              <div className={trPdf.subsectionTitle}>
                <span className={trPdf.dot} aria-hidden />
                <span>Candidate Evaluation Report</span>
              </div>

              <div className={trPdf.reportGrid}>
                <div className={trPdf.sideColumn}>
                  {(report.key_strengths ?? []).length > 0 && (
                    <section
                      className={classnames(
                        trPdf.sideCard,
                        trPdf.sideCardGreen,
                        trPdf.avoidBreak,
                      )}
                    >
                      <h4>
                        <span
                          className={classnames(
                            trPdf.iconChip,
                            trPdf.iconChipGreen,
                          )}
                        >
                          ✓
                        </span>
                        <span>Strengths</span>
                      </h4>
                      <ul className={trPdf.bullets}>
                        {(report.key_strengths ?? []).map((item, index) => (
                          <li key={`s-${index}`}>
                            <strong>{item.title}: </strong>
                            {item.details}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {(report.potential_gaps ?? []).length > 0 && (
                    <section
                      className={classnames(
                        trPdf.sideCard,
                        trPdf.sideCardRed,
                        trPdf.avoidBreak,
                      )}
                    >
                      <h4>
                        <span
                          className={classnames(
                            trPdf.iconChip,
                            trPdf.iconChipRed,
                          )}
                        >
                          !
                        </span>
                        <span>Potential Gaps</span>
                      </h4>
                      <ul className={trPdf.bullets}>
                        {(report.potential_gaps ?? []).map((item, index) => (
                          <li key={`g-${index}`}>
                            <strong>{item.title}: </strong>
                            {item.details}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {areasToProbe.length > 0 && (
                    <section
                      className={classnames(
                        trPdf.sideCard,
                        trPdf.sideCardOrange,
                        trPdf.avoidBreak,
                      )}
                    >
                      <h4>
                        <span
                          className={classnames(
                            trPdf.iconChip,
                            trPdf.iconChipOrange,
                          )}
                        >
                          ?
                        </span>
                        <span>Areas to Probe in Next Rounds</span>
                      </h4>
                      <ul className={trPdf.bullets}>
                        {areasToProbe.map((item, index) => (
                          <li key={`a-${index}`}>
                            <strong>{item.title}: </strong>
                            {item.details}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>

                <div style={{ marginTop: 12 }}>
                  <section
                    className={classnames(
                      trPdf.tableCard,
                      trPdf.requirementsSummary,
                    )}
                  >
                    <h4>Requirements Summary</h4>
                    <table className={trPdf.summaryTable}>
                      <thead>
                        <tr>
                          <th>Requirement Priorities</th>
                          <th>No. of Requirements Met</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(["p0", "p1", "p2"] as const).map((level) => {
                          const items = pdfReqByLevel[level];
                          if (!items.length) return null;
                          const meetCount = items.filter(
                            (item) =>
                              item.assessment === "meets" ||
                              item.assessment_type === "meets",
                          ).length;
                          return (
                            <tr key={level}>
                              <td>
                                <span
                                  className={classnames(
                                    trPdf.priorityPill,
                                    pdfPriorityToneClass(level),
                                  )}
                                >
                                  {level.toUpperCase()}
                                </span>
                              </td>
                              <td>
                                {meetCount} / {items.length}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </section>

                  <section
                    className={classnames(
                      trPdf.tableCard,
                      trPdf.analysisCard,
                    )}
                  >
                    <h4>Detailed Requirements Analysis</h4>
                    <table className={trPdf.analysisTable}>
                      <thead>
                        <tr>
                          <th>Priority</th>
                          <th>Requirement</th>
                          <th>Assessment</th>
                          <th>Reasoning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(report.requirements ?? []).map((item, index) => {
                          const assessKey = item.assessment;
                          const prio = item.level as "p0" | "p1" | "p2";
                          return (
                            <tr key={index} className={trPdf.avoidBreak}>
                              <td>
                                <span
                                  className={classnames(
                                    trPdf.priorityPill,
                                    pdfPriorityToneClass(prio),
                                  )}
                                >
                                  {item.level.toUpperCase()}
                                </span>
                              </td>
                              <td>{item.description}</td>
                              <td>
                                <span
                                  className={classnames(
                                    trPdf.assessmentPill,
                                    assessmentPillClass(assessKey),
                                  )}
                                >
                                  {originalT(`assessment_options.${assessKey}`)}
                                </span>
                              </td>
                              <td>{item.reasoning}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>,
  );

  let reportHtml = pdfHtml;

  if (locale === "zh") {
    const hideLoading = message.loading(
      originalT("talent_details.download_report_translating"),
      0,
    );
    try {
      const { code, data } = await Post<{ html: string }>(
        `/api/jobs/${jobId}/talents/${talentId}/translate_html`,
        { html: pdfHtml },
      );
      if (code !== 0 || !data?.html) {
        message.error(
          originalT("talent_details.download_report_translate_failed"),
        );
        return;
      }
      reportHtml = data.html;
    } finally {
      hideLoading();
    }
  }

  pdfReportRef.current.innerHTML = reportHtml;
  const candidateNameNoSpace = talent.name.replace(/\s+/g, "");
  const jobTitleNoSpace = job.name.replace(/\s+/g, "");
  const localeSuffix = locale === "zh" ? "_zh" : "";
  const pdfFilename = `CandidateReport_${candidateNameNoSpace}_${jobTitleNoSpace}_${dayjs().format("YYYYMMDD")}${localeSuffix}`;

  await downloadMarkdownAsPDF({
    name: pdfFilename,
    element: pdfReportRef.current,
    options: {
      skipWrapper: true,
      skipAutoSplit: true,
    },
  });
}
