import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import classnames from "classnames";
import dayjs from "dayjs";
import { message } from "antd";

import { downloadMarkdownAsPDF, getEvaluateResultLevel } from "@/utils";
import { LogisticsFitKnownKeys } from "@/utils/consts";
import { SkillsFitKnownKeys } from "@/utils/consts";

export type DownloadTalentReportPdfArgs = {
  pdfReportRef: React.RefObject<HTMLDivElement | null>;
  talent: TTalent;
  job: { name: string; invitation_token: string };
  report: TReport;
  lastUpdated?: string;
  originalT: (key: string) => string;
  styles: Record<string, string>;
};

export async function downloadTalentReportPdf({
  pdfReportRef,
  talent,
  job,
  report,
  lastUpdated,
  originalT,
  styles,
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

  const pdfRawSkillsFitLevel =
    report.overall_recommendation?.skills_fit?.level;
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
      ? styles.pdfBadgeRed
      : pdfRawSkillsFitLevel === "uncertain" ||
          pdfRawSkillsFitLevel === "near_fit"
        ? styles.pdfBadgeOrange
        : pdfRawSkillsFitLevel === "overqualified"
          ? styles.pdfBadgeBlue
          : styles.pdfBadgeGray;

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
      ? styles.pdfBadgeGreen
      : pdfRawInterestLevel === "moderate" || pdfRawInterestLevel === "low"
        ? styles.pdfBadgeOrange
        : styles.pdfBadgeGray;

  const headerFitStatusClass =
    evalLevel === "no"
      ? styles.pdfFitStatusNegative
      : evalLevel === "maybe" || evalLevel === "yes_but"
        ? styles.pdfFitStatusWarning
        : styles.pdfFitStatusPositive;

  const fitPillToneClass =
    evalLevel === "no"
      ? styles.pdfFitPillNegative
      : evalLevel === "maybe" || evalLevel === "yes_but"
        ? styles.pdfFitPillWarning
        : styles.pdfFitPillPositive;

  const generatedOn = lastUpdated
    ? dayjs(lastUpdated).format("YYYY/MM/DD")
    : dayjs().format("YYYY/MM/DD");

  const keyInfoCardTone = [
    "blue",
    "cyan",
    "blue",
    "lavender",
    "blue",
  ] as const;
  const keyInfoToneClass = (i: number) => {
    const t = keyInfoCardTone[i % keyInfoCardTone.length];
    if (t === "blue") return styles.pdfKeyCardBlue;
    if (t === "cyan") return styles.pdfKeyCardCyan;
    return styles.pdfKeyCardLavender;
  };

  const assessmentPillClass = (a?: string) => {
    if (a === "meets") return styles.pdfAssessmentMeets;
    if (a === "does_not_meet") return styles.pdfAssessmentNo;
    return styles.pdfAssessmentPartial;
  };

  const pdfPriorityToneClass = (level: "p0" | "p1" | "p2") => {
    if (level === "p0") return styles.pdfPriorityP0;
    if (level === "p1") return styles.pdfPriorityP1;
    return styles.pdfPriorityP2;
  };

  const areasToProbe = report.areas_to_probe_further ?? [];

  const pdfHtml = renderToStaticMarkup(
    <main className={styles.pdfPage}>
      <div className={styles.pdfReportStack}>
        <header className={styles.pdfPageHeader}>
          <div>
            <div className={styles.pdfEyebrow}>Candidate Report</div>
            <h1 className={styles.pdfHeaderTitle}>{talent.name}</h1>
            <p className={styles.pdfHeaderSubtitle}>
              {job.name.replace(/\s*-\s*/g, " – ")}
            </p>
          </div>
          <div className={styles.pdfHeaderMeta}>
            <div className={styles.pdfMetaLabel}>Generated On</div>
            <div className={styles.pdfMetaValue}>{generatedOn}</div>
            <p className={styles.pdfHeaderSubtitleBy}>by Persevio</p>
          </div>
        </header>

        <section
          className={classnames(
            styles.pdfSectionCard,
            styles.pdfProfileSnapshot,
          )}
          aria-labelledby="pdf-profile-snapshot"
        >
          <div className={styles.pdfSectionInner}>
            <div className={styles.pdfSectionHeadingRow}>
              <h2
                className={styles.pdfSectionHeading}
                id="pdf-profile-snapshot"
              >
                Profile Snapshot
              </h2>
            </div>
            <div className={classnames(styles.pdfSnapshotGrid)}>
              {(report.profile_snapshot ?? []).map((snapshot, index) => (
                <div
                  className={classnames(
                    styles.pdfSnapshotItem,
                    styles.avoidBreak,
                  )}
                  key={`${snapshot.title}-${index}`}
                >
                    <h3>{snapshot.title}</h3>
                    {Array.isArray(snapshot.details) ? (
                      <ul className={styles.avoidBreak}>
                        {snapshot.details.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.avoidBreak}>{snapshot.details}</p>
                    )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className={styles.pdfSectionCard}
          aria-labelledby="pdf-key-info"
        >
          <div className={styles.pdfSectionInner}>
            <div className={styles.pdfSectionHeadingRow}>
              <h2 className={styles.pdfSectionHeading} id="pdf-key-info">
                Key Information
              </h2>
            </div>
            <div className={styles.pdfKeyGrid}>
              {(report.key_information ?? []).map((information, index) => (
                <article
                  className={classnames(
                    styles.pdfKeyCard,
                    styles.avoidBreak,
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
          className={styles.pdfSectionCard}
          aria-labelledby="pdf-interview-report"
        >
          <div className={styles.pdfReportHead}>
            <h2 className={styles.pdfRoundTitle} id="pdf-interview-report">
              Interview Report: Round 0 - AI Prescreening
            </h2>
            <span
              className={classnames(
                styles.pdfFitStatus,
                headerFitStatusClass,
              )}
            >
              <span style={{ color: "#666" }}>Interview?</span>{" "}
              {overallFitLabel}
            </span>
          </div>

          <div className={styles.pdfReportBody}>
            <div className={styles.pdfSubsectionTitle}>
              <span className={styles.pdfDot} aria-hidden />
              <span>Evaluation Summary</span>
            </div>

            <section
              className={classnames(
                styles.pdfEvaluationCard,
                styles.avoidBreak,
              )}
              aria-labelledby="pdf-overall-fit"
            >
              <div className={styles.pdfFitRow}>
                <h4 id="pdf-overall-fit">Interview Recommendation</h4>
                <span
                  className={classnames(styles.pdfFitPill, fitPillToneClass)}
                >
                  {overallFitLabel}
                </span>
              </div>
              <p className={styles.pdfFitCopy}>
                {report.summary?.description || report.thumbnail_summary}
              </p>

              <div className={styles.pdfMetricRow}>
                <div className={styles.pdfMetricHead}>
                  <h5>Skills Fit</h5>
                  {!!pdfSkillsFitLabel && (
                    <span
                      className={classnames(
                        styles.pdfBadge,
                        skillsFitBadgeClass,
                      )}
                    >
                      {pdfSkillsFitLabel}
                    </span>
                  )}
                </div>
                <p className={styles.pdfMetricCopy}>
                  {report.overall_recommendation?.skills_fit?.explanation}
                </p>
              </div>

              <div className={styles.pdfMetricRow}>
                <div className={styles.pdfMetricHead}>
                  <h5>Logistics Fit</h5>
                  <div className={styles.pdfMetricBadgeWrap}>
                    {logisticsLevels.map((level) => (
                      <span
                        className={classnames(
                          styles.pdfBadge,
                          level === "no_issues"
                            ? styles.pdfBadgeGreen
                            : styles.pdfBadgeOrange,
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
                <p className={styles.pdfMetricCopy}>
                  {report.overall_recommendation?.logistics_fit?.explanation}
                </p>
              </div>

              <div className={styles.pdfMetricRow}>
                <div className={styles.pdfMetricHead}>
                  <h5>Interest Level</h5>
                  {!!pdfInterestLabel && (
                    <span
                      className={classnames(
                        styles.pdfBadge,
                        interestBadgeClass,
                      )}
                    >
                      {pdfInterestLabel}
                    </span>
                  )}
                </div>
                <p className={styles.pdfMetricCopy}>
                  {report.summary?.interest_level?.explanation}
                </p>
              </div>
            </section>

            <div className={styles.pdfReportSection}>
              <div className={styles.pdfSubsectionTitle}>
                <span className={styles.pdfDot} aria-hidden />
                <span>Candidate Evaluation Report</span>
              </div>

              <div className={styles.pdfReportGrid}>
                <div className={styles.pdfSideColumn}>
                  {(report.key_strengths ?? []).length > 0 && (
                    <section
                      className={classnames(
                        styles.pdfSideCard,
                        styles.pdfSideCardGreen,
                        styles.avoidBreak,
                      )}
                    >
                      <h4>
                        <span
                          className={classnames(
                            styles.pdfIconChip,
                            styles.pdfIconChipGreen,
                          )}
                        >
                          ✓
                        </span>
                        <span>Strengths</span>
                      </h4>
                      <ul className={styles.pdfBullets}>
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
                        styles.pdfSideCard,
                        styles.pdfSideCardRed,
                        styles.avoidBreak,
                      )}
                    >
                      <h4>
                        <span
                          className={classnames(
                            styles.pdfIconChip,
                            styles.pdfIconChipRed,
                          )}
                        >
                          !
                        </span>
                        <span>Potential Gaps</span>
                      </h4>
                      <ul className={styles.pdfBullets}>
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
                        styles.pdfSideCard,
                        styles.pdfSideCardOrange,
                        styles.avoidBreak,
                      )}
                    >
                      <h4>
                        <span
                          className={classnames(
                            styles.pdfIconChip,
                            styles.pdfIconChipOrange,
                          )}
                        >
                          ?
                        </span>
                        <span>Areas to Probe in Next Rounds</span>
                      </h4>
                      <ul className={styles.pdfBullets}>
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
                      styles.pdfTableCard,
                      styles.pdfRequirementsSummary,
                    )}
                  >
                    <h4>Requirements Summary</h4>
                    <table className={styles.pdfSummaryTable}>
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
                                    styles.pdfPriorityPill,
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
                      styles.pdfTableCard,
                      styles.pdfAnalysisCard,
                    )}
                  >
                    <h4>Detailed Requirements Analysis</h4>
                    <table className={styles.pdfAnalysisTable}>
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
                            <tr key={index} className={styles.avoidBreak}>
                              <td>
                                <span
                                  className={classnames(
                                    styles.pdfPriorityPill,
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
                                    styles.pdfAssessmentPill,
                                    assessmentPillClass(assessKey),
                                  )}
                                >
                                  {originalT(
                                    `assessment_options.${assessKey}`,
                                  )}
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

  pdfReportRef.current.innerHTML = pdfHtml;
  const candidateNameNoSpace = talent.name.replace(/\s+/g, "");
  const jobTitleNoSpace = job.name.replace(/\s+/g, "");
  const pdfFilename = `CandidateReport_${candidateNameNoSpace}_${jobTitleNoSpace}_${dayjs().format("YYYYMMDD")}`;

  await downloadMarkdownAsPDF({
    name: pdfFilename,
    element: pdfReportRef.current,
    options: {
      skipWrapper: true,
      skipAutoSplit: true,
    },
  });
}
