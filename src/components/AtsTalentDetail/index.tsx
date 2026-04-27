import React, { useEffect, useReducer, useRef, useState } from "react";
import {
  Button,
  FloatButton,
  Spin,
  Collapse,
  Tabs,
  Modal,
  Radio,
  message,
  Tag,
  Select,
  Input,
} from "antd";
import classnames from "classnames";
import { v4 as uuidv4 } from "uuid";

import { ArrowLeftOutlined, FileOutlined } from "@ant-design/icons";
import useTalent from "@/hooks/useTalent";
import { Download, Get, Post } from "@/utils/request";
import {
  getEvaluateResultLevel,
  getQuery,
  getSourcingChannel,
  normalizeReport,
  parseJSON,
  buildTalentDetailUrl,
  DEFAULT_TRACKING_SOURCES,
  downloadMarkdownAsPDF,
} from "@/utils";
import { useNavigate, useParams } from "react-router";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { renderToStaticMarkup } from "react-dom/server";
import Icon from "@/components/Icon";
import DownloadIcon from "@/assets/icons/download";
import Phone from "@/assets/icons/phone";
import MailCheck from "@/assets/icons/mail-check";
import Link2 from "@/assets/icons/link2";
import MarkdownContainer from "@/components/MarkdownContainer";
import EvaluateResultBadge from "@/components/EvaluateResultBadge";
import { useTranslation } from "react-i18next";
import Resume from "./components/Resume";
import ChatMessagePreview from "@/components/ChatMessagePreview";
import { TTalentResume } from "@/components/NewTalentDetail/type";
import type { TTalentNote, TActiveLog } from "./type";
import styles from "./style.module.less";
import StrengthFilled from "@/assets/icons/strength-filled";
import GapsFilled from "@/assets/icons/gaps-filled";
import Empty from "../Empty";
import InterviewForm from "@/components/NewTalentDetail/components/InterviewForm";
import TalentEvaluateFeedbackWithReasonModal from "@/components/TalentEvaluateFeedbackWithReasonModal";
import TalentEvaluateFeedbackModal from "@/components/TalentEvaluateFeedbackModal";
import EvaluateFeedbackConversation from "@/components/EvaluateFeedbackConversation";
import EvaluateFeedback from "@/components/EvaluateFeedback";
import ScheduleInterview from "@/assets/icons/schedule-interview";
import ProbeFilled from "@/assets/icons/probe-filled";
import useJob from "@/hooks/useJob";
import RichTextWithVoice from "../RichTextWithVoice";
import {
  LogisticsFitKnownKeys,
  SkillsFitKnownKeys,
  TALENT_DETAIL_FROM,
} from "@/utils/consts";
import { tokenStorage } from "@/utils/storage";

type TCustomizedInterview = {
  id: string;
  name: string;
  created_at: string;
  feedback_records: TInterviewFeedbackRecord[];
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 1).toUpperCase();
};

const formatLastUpdated = (dateStr?: string) => {
  if (!dateStr) return null;
  return dayjs(dateStr).format("MMM DD, YYYY");
};

const AtsTalentDetail: React.FC = () => {
  const { talentId: talentIdStr, jobId: jobIdStr } = useParams<{
    talentId: string;
    jobId: string;
  }>();

  const [_, forceUpdate] = useReducer((x) => x + 1, 0);
  const [talentsOfCandidate, setTalentsOfCandidate] = useState<TTalent[]>([]);
  const [talentChatMessages, setTalentChatMessages] = useState<
    TMessageFromApi[]
  >([]);
  const [interviewFeedbackRecords, setInterviewFeedbackRecords] = useState<
    TInterviewFeedbackRecord[]
  >([]);
  const [notes, setNotes] = useState<TTalentNote[]>([]);
  const [activeLogs, setActiveLogs] = useState<TActiveLog[]>([]);

  const [isAddFeedbackModalOpen, setIsAddFeedbackModalOpen] = useState(false);
  const [addFeedbackForInterviewId, setAddFeedbackForInterviewId] = useState<
    number | string
  >();
  const [newFeedbackContent, setNewFeedbackContent] = useState("");
  const [newFeedbackAdvanceStatus, setNewFeedbackAdvanceStatus] = useState<
    "advance" | "hold" | "reject"
  >("hold");
  const [newFeedbackRound, setNewFeedbackRound] = useState("");
  const [isMoveStageModalOpen, setIsMoveStageModalOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | undefined>();
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [openEvaluateFeedbackReason, setOpenEvaluateFeedbackReason] =
    useState(false);
  const [
    openEvaluateFeedbackConversation,
    setOpenEvaluateFeedbackConversation,
  ] = useState(false);
  const [
    needConfirmEvaluateFeedbackConversation,
    setNeedConfirmEvaluateFeedbackConversation,
  ] = useState(false);
  const [activeInterviewKeys, setActiveInterviewKeys] = useState<string[]>([
    "round0",
  ]);
  const pdfReportRef = useRef<HTMLDivElement>(null);

  const { job } = useJob();
  const { talent, interviews, fetchTalent } = useTalent();
  const navigate = useNavigate();
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`talent_details.${key}`);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const canOpenJobApplyInternalDocuments = isSystemAdmin && !!talentIdStr;

  useEffect(() => {
    const checkIsSystemAdmin = async () => {
      const token = tokenStorage.getToken("staff");
      if (!token) {
        setIsSystemAdmin(false);
        return;
      }

      const { code, data } = await Get("/api/settings");
      setIsSystemAdmin(code === 0 && data?.is_admin === 1);
    };

    checkIsSystemAdmin();
  }, []);

  useEffect(() => {
    fetchTalentsOfCandidate();
    fetchTalentChatMessages();
    fetchTalentNotes();
    fetchActiveLogs();
    fetchInterviewFeedbackRecords();
  }, [talentIdStr, jobIdStr]);

  const fetchTalentsOfCandidate = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobIdStr}/talents/${talentIdStr}/all_talents`,
    );
    if (code === 0) {
      setTalentsOfCandidate(data.talents);
    }
  };

  const fetchTalentChatMessages = async () => {
    const { data } = await Get(
      `/api/jobs/${jobIdStr}/talents/${talentIdStr}/messages`,
    );
    setTalentChatMessages(data.messages ?? []);
  };

  const fetchInterviewFeedbackRecords = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobIdStr}/talents/${talentIdStr}/feedback_records`,
    );
    if (code === 0) {
      setInterviewFeedbackRecords(
        (data.interview_feedback_records ?? []).filter(
          (record: TInterviewFeedbackRecord) => !record.interview_id,
        ),
      );
    } else {
      setInterviewFeedbackRecords([]);
    }
  };

  const fetchTalentNotes = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobIdStr}/talents/${talentIdStr}/notes`,
    );
    if (code === 0) {
      setNotes(data.talent_notes ?? []);
    } else {
      setNotes([]);
    }
  };

  const fetchActiveLogs = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobIdStr}/talents/${talentIdStr}/active_logs`,
    );
    if (code === 0) {
      setActiveLogs(data.active_logs ?? []);
    } else {
      setActiveLogs([]);
    }
  };

  if (!job || !talent) {
    return <Spin />;
  }

  const resumeDetail: TTalentResume | null = talent.resume_detail_json
    ? (parseJSON(talent.resume_detail_json) as TTalentResume)
    : null;

  const report = normalizeReport(parseJSON(talent.evaluate_json));

  const contact = resumeDetail?.contact_information;
  const lastUpdated =
    talent.evaluate_result_updated_at ||
    talent.viewed_at ||
    talent.feedback_updated_at;

  const downloadReportPdf = async () => {
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
                    <p className={styles.avoidBreak}>{snapshot.details}</p>
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
    const dateText = dayjs().format("YYYYMMDD");
    const pdfFilename = `CandidateReport_${candidateNameNoSpace}_${jobTitleNoSpace}_${dateText}`;

    await downloadMarkdownAsPDF({
      name: pdfFilename,
      element: pdfReportRef.current,
      options: {
        skipWrapper: true,
        skipAutoSplit: true,
      },
    });
  };

  const downloadResume = async () => {
    await Download(
      `/api/jobs/${job?.id}/talents/${talent?.id}/download_resume`,
      `${talent.name}_resume`,
    );
  };

  const handleBack = () => {
    const from = getQuery("from");
    if (from === TALENT_DETAIL_FROM.local) {
      navigate(-1);
      return;
    }
    navigate(
      from === TALENT_DETAIL_FROM.talents
        ? `/app/talents`
        : `/app/jobs/${job.id}/standard-board?tab=talents`,
    );
  };

  const handleMoveStage = async () => {
    if (!job || !talent || !selectedStageId) return;
    const { code } = await Post(
      `/api/jobs/${job.id}/talents/${talent.id}/stage`,
      { stage_id: selectedStageId },
    );
    if (code === 0) {
      message.success(originalT("job_details.saveSuccess"));
      setIsMoveStageModalOpen(false);
      fetchTalent();
      fetchActiveLogs();
    }
  };

  const updateTalentStatus = async (feedback?: string) => {
    const { code } = await Post(`/api/jobs/${job?.id}/talents/${talent?.id}`, {
      status: "rejected",
      feedback,
    });
    if (code === 0) {
      fetchTalent();
      setIsRejectModalOpen(false);
      message.success(t("update_success"));
    }
  };

  const updateTalentEvaluateFeedback = async (feedback: TEvaluateFeedback) => {
    setOpenEvaluateFeedbackReason(true);
    const { code } = await Post(
      `/api/jobs/${job?.id}/talents/${talent?.id}/evaluate_feedback`,
      { evaluate_feedback: feedback },
    );
    if (code === 0) fetchTalent();
  };

  const updateTalentEvaluateFeedbackReason = async (reason: string) => {
    if (!job || !talent) return;
    const { code } = await Post(
      `/api/jobs/${job.id}/talents/${talent.id}/evaluate_feedback`,
      { evaluate_feedback_reason: reason },
    );
    if (code === 0) {
      fetchTalent();
      setOpenEvaluateFeedbackConversation(true);
      setNeedConfirmEvaluateFeedbackConversation(true);
      message.success(t("update_success"));
    }
  };

  const requirementsSummaryMappings: Record<
    "p0" | "p1" | "p2",
    {
      level: "p0" | "p1" | "p2";
      description: string;
      assessment: string;
      reasoning: string;
    }[]
  > = {
    p0: [],
    p1: [],
    p2: [],
  };

  (report.requirements ?? []).forEach((item) => {
    requirementsSummaryMappings[item.level].push(item);
  });

  const moveStageOptions: { id: string; name: string }[] = job?.pipeline_stages
    ? JSON.parse(job.pipeline_stages)
    : [];

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

  const interviewButtonArea =
    interviews.length === 0 ? (
      <Button
        type="primary"
        onClick={() => setIsInterviewModalOpen(true)}
        className={styles.scheduleInterviewBtn}
        icon={<Icon icon={<ScheduleInterview />} style={{ fontSize: 16 }} />}
      >
        {t("schedule_interview")}
      </Button>
    ) : interviews[0].mode === "written" || interviews[0].scheduled_at ? (
      <Button onClick={() => setIsInterviewModalOpen(true)}>
        {t("interview_scheduled")}
      </Button>
    ) : (
      <Button onClick={() => setIsInterviewModalOpen(true)}>
        {t("awaiting_candidate_confirm")}
      </Button>
    );

  const groupedInterviewFeedbackRecordsMap = interviewFeedbackRecords.reduce(
    (acc, record) => {
      const roundKey = record.customized_round_key || record.customized_round;
      if (!acc[roundKey]) {
        acc[roundKey] = [];
      }
      acc[roundKey].push(record);
      return acc;
    },
    {} as Record<string, TInterviewFeedbackRecord[]>,
  );

  const customizedInterviews: TCustomizedInterview[] = Object.keys(
    groupedInterviewFeedbackRecordsMap,
  ).map((roundKey) => {
    const records = groupedInterviewFeedbackRecordsMap[roundKey];
    return {
      id: roundKey,
      name: records[0]?.customized_round,
      created_at: records[0]?.created_at,
      feedback_records: records,
    };
  });

  const formattedLinkedinUrl = contact?.linkedin
    ? contact?.linkedin?.startsWith("http")
      ? contact.linkedin
      : `https://${contact.linkedin}`
    : null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <ArrowLeftOutlined className={styles.backIcon} onClick={handleBack} />
        <div className={styles.avatar}>{getInitials(talent.name)}</div>
        <div className={styles.headerMain}>
          <h1 className={styles.candidateName}>{talent.name}</h1>
        </div>
        <div className={styles.headerMeta}>
          {lastUpdated && (
            <span className={styles.lastUpdated}>
              Last updated: {formatLastUpdated(lastUpdated)}
            </span>
          )}
        </div>
      </header>

      <div className={styles.contactRow}>
        {contact?.phone && (
          <a href={`tel:${contact.phone}`} className={styles.contactLink}>
            <Icon icon={<Phone />} />
            {contact.phone}
          </a>
        )}
        {contact?.email && (
          <a href={`mailto:${contact.email}`} className={styles.contactLink}>
            <Icon icon={<MailCheck />} />
            {contact.email}
          </a>
        )}
        {formattedLinkedinUrl && (
          <a
            href={formattedLinkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contactLink}
          >
            <Icon icon={<Link2 />} />
            {formattedLinkedinUrl}
          </a>
        )}
      </div>

      <section className={styles.snapshotSection}>
        <div className={styles.snapshotSectionBg} />
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Profile Snapshot</h2>
        </div>
        <div className={styles.snapshotGrid}>
          {(report.profile_snapshot ?? []).map((snapshot) => (
            <div className={styles.snapshotItem}>
              <span className={styles.snapshotLabel}>{snapshot.title}</span>
              <span className={styles.snapshotValue}>
                {typeof snapshot.details === "string"
                  ? snapshot.details
                  : snapshot.details.map((detail, index) => (
                      <div key={index}>{detail}</div>
                    ))}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.mainRow}>
        <div className={styles.resumeColumn}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Resume</h2>
            <Button
              type="primary"
              icon={<Icon icon={<DownloadIcon />} />}
              onClick={downloadResume}
              className={styles.downloadPdfBtn}
            >
              Download PDF
            </Button>
          </div>
          <div className={styles.resumeContent}>
            {resumeDetail?.contact_information ? (
              <Resume resume={resumeDetail} />
            ) : (
              <MarkdownContainer content={talent.parsed_content || ""} />
            )}
          </div>
        </div>

        <div className={styles.keyInfoColumn}>
          <div className={styles.sectionHead} style={{ height: 49 }}>
            <h2 className={styles.sectionTitle}>Key Information</h2>
          </div>
          <div className={styles.bgWrap}>
            <div className={styles.keyInfoCards}>
              {(report.key_information ?? []).map((information) => (
                <div className={styles.keyInfoCard}>
                  <span className={styles.keyInfoLabel}>
                    {information.title}
                  </span>
                  <span className={styles.keyInfoValue}>
                    {information.details}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.jobApplySection}>
        <h2 className={styles.sectionTitle}>Jobs Applied</h2>
        <Tabs
          items={talentsOfCandidate.map((talent) => ({
            key: talent.id.toString(),
            label: (
              <div className={styles.jobApplyLabel}>
                <div className={styles.jobName}>{talent.job?.name}</div>
                {talent.job?.posted_at ? (
                  <div className={styles.active}>Active</div>
                ) : (
                  <div className={styles.closed}>Closed</div>
                )}
              </div>
            ),
          }))}
          activeKey={talent.id.toString()}
          onChange={(key) => {
            const talent = talentsOfCandidate.find(
              (t) => t.id.toString() === key,
            );

            if (talent?.job) {
              navigate(
                buildTalentDetailUrl(
                  talent.job.id,
                  talent.id,
                  TALENT_DETAIL_FROM.local,
                ),
              );
              forceUpdate();
            }
          }}
        />
        <div className={styles.jobApplyActions}>
          {talent?.status === "rejected" ? (
            <Tag color="red">{t("status_rejected")}</Tag>
          ) : (
            <>
              {interviewButtonArea}
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setIsMoveStageModalOpen(true);
                }}
              >
                Move Stage
              </Button>
              <Button
                danger
                onClick={() => {
                  if (talent?.evaluate_feedback) {
                    updateTalentStatus();
                  } else {
                    setIsRejectModalOpen(true);
                  }
                }}
                className={styles.rejectBtn}
              >
                {t("action_reject")}
              </Button>
            </>
          )}

          <Button
            type="primary"
            icon={<Icon icon={<DownloadIcon />} />}
            onClick={downloadReportPdf}
            className={styles.downloadReportBtn}
          >
            Download Report
          </Button>
        </div>
        <section className={styles.interviewsSection}>
          <h2 className={styles.sectionTitle}>Interviews</h2>
          <Collapse
            activeKey={activeInterviewKeys}
            onChange={(keys) => {
              setActiveInterviewKeys(keys);
            }}
            expandIconPosition="end"
            ghost
            className={styles.interviewsCollapse}
          >
            <Collapse.Panel
              key="round0"
              header={
                <div className={styles.interviewHeader}>
                  <div className={styles.interviewRound}>
                    Round 0: AI Prescreening
                  </div>
                  <EvaluateResultBadge
                    size="small"
                    withTitle
                    result={getEvaluateResultLevel(report)}
                  />
                </div>
              }
              className={styles.interviewPanel}
            >
              <div className={styles.evalSummaryCard}>
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
                    onChange={updateTalentEvaluateFeedback}
                    onOpen={() => {
                      setNeedConfirmEvaluateFeedbackConversation(false);
                      setOpenEvaluateFeedbackConversation(true);
                    }}
                  />
                </div>
                <div className={styles.evalSummaryContent}>
                  <div className={styles.evalOverallText}>
                    <div className={styles.evalOverallLabel}>
                      <span>Worth Interviewing?</span>
                      <EvaluateResultBadge
                        result={getEvaluateResultLevel(report)}
                      />
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
                      {
                        report.overall_recommendation?.logistics_fit
                          ?.explanation
                      }
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

              <div className={styles.candidateEvalSection}>
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

                <div className={styles.candidateEvalLayout}>
                  <div className={styles.candidateEvalLeft}>
                    <div className={styles.evalBlock}>
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
                              <div
                                className={styles.requirementsSummaryAssessment}
                              >
                                <span>{meetCount}&nbsp;</span>/&nbsp;
                                {items.length}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className={styles.evalBlock}>
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
                        {(report.requirements ?? []).map((item, index) => {
                          return (
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
                                  {originalT(
                                    `assessment_options.${item.assessment}`,
                                  )}
                                </div>
                              </div>
                              <div>{item.reasoning}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className={styles.candidateEvalRight}>
                    {(report.key_strengths ?? []).length > 0 && (
                      <div
                        className={`${styles.evalBlock} ${styles.strengthsBlock}`}
                      >
                        <div className={styles.evalBlockTitle}>
                          <Icon icon={<StrengthFilled />} />
                          Strengths
                        </div>
                        <div className={styles.evalList}>
                          {(report.key_strengths ?? []).map(
                            (strength, index) => {
                              return (
                                <div key={index} className={styles.listItem}>
                                  <span className={styles.listTitle}>
                                    {strength.title}:
                                  </span>
                                  <span className={styles.snapshotContent}>
                                    {strength.details}
                                  </span>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}

                    {(report.potential_gaps ?? []).length > 0 && (
                      <div
                        className={`${styles.evalBlock} ${styles.gapsBlock}`}
                      >
                        <div className={styles.evalBlockTitle}>
                          <Icon icon={<GapsFilled />} />
                          Potential Gaps
                        </div>
                        <div className={styles.evalList}>
                          {(report.potential_gaps ?? []).map((gap, index) => {
                            return (
                              <div key={index} className={styles.listItem}>
                                <span className={styles.listTitle}>
                                  {gap.title}:
                                </span>
                                <span className={styles.gapContent}>
                                  {gap.details}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(report.areas_to_probe_further ?? []).length > 0 && (
                      <div
                        className={`${styles.evalBlock} ${styles.areasBlock}`}
                      >
                        <div className={styles.evalBlockTitle}>
                          <Icon icon={<ProbeFilled />} />
                          Areas to Probe in Next Rounds
                        </div>
                        <div className={styles.evalList}>
                          {(report.areas_to_probe_further ?? []).map(
                            (area, index) => {
                              return (
                                <div key={index} className={styles.listItem}>
                                  <span className={styles.listTitle}>
                                    {area.title}:
                                  </span>
                                  <span className={styles.areaContent}>
                                    {area.details}
                                  </span>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.aiSummarySection}>
                <div className={styles.aiSummaryLayout}>
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
                        {report.ai_interview_summary && (
                          <>
                            {(report.ai_interview_summary?.topics_covered
                              ?.narrative ||
                              (
                                report.ai_interview_summary?.topics_covered
                                  ?.topics ?? []
                              ).length > 0) && (
                              <div className={styles.aiSummaryCard}>
                                <div className={styles.aiSummaryTitle}>
                                  Topics Covered
                                </div>
                                {!!report.ai_interview_summary?.topics_covered
                                  ?.narrative && (
                                  <p className={styles.aiSummaryNarrative}>
                                    {
                                      report.ai_interview_summary
                                        ?.topics_covered?.narrative
                                    }
                                  </p>
                                )}
                                <ul className={styles.aiSummaryList}>
                                  {(
                                    report.ai_interview_summary?.topics_covered
                                      ?.topics ?? []
                                  ).map((item, index) => (
                                    <li key={index}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {(
                              report.ai_interview_summary?.key_revelations ?? []
                            ).length > 0 && (
                              <div className={styles.aiSummaryCard}>
                                <div className={styles.aiSummaryTitle}>
                                  Key Revelations
                                </div>
                                <ul className={styles.aiSummaryList}>
                                  {(
                                    report.ai_interview_summary
                                      ?.key_revelations ?? []
                                  ).map((item, index) => (
                                    <li key={index}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {(
                              report.ai_interview_summary
                                ?.interview_observations ?? []
                            ).length > 0 && (
                              <div className={styles.aiSummaryCard}>
                                <div className={styles.aiSummaryTitle}>
                                  Interview Observations
                                </div>
                                <ul className={styles.aiSummaryList}>
                                  {(
                                    report.ai_interview_summary
                                      ?.interview_observations ?? []
                                  ).map((item, index) => (
                                    <li key={index}>
                                      <span
                                        className={styles.aiSummaryItemTitle}
                                      >
                                        {item.title}:
                                      </span>{" "}
                                      {item.details}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.aiSummaryRight}>
                    <div className={styles.aiTranscriptHeader}>
                      AI Interview Transcript
                    </div>
                    <div className={styles.aiTranscriptBody}>
                      <ChatMessagePreview
                        messages={talentChatMessages}
                        job={job as any}
                        talent={talent}
                        fontSize={14}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Collapse.Panel>
            {(interviews.length > 0 || customizedInterviews.length > 0) &&
              [...interviews, ...customizedInterviews].map((interview) => {
                return (
                  <Collapse.Panel
                    key={interview.id}
                    header={
                      <div className={styles.interviewHeader}>
                        <div className={styles.interviewRound}>
                          {(interview as TCustomizedInterview).name
                            ? `Interview Round: ${(interview as TCustomizedInterview).name}`
                            : `Round 1: Interview`}
                        </div>
                        <div className={styles.interviewMeta}>
                          {dayjs(interview.created_at).format("MMM DD, YYYY")}
                        </div>
                      </div>
                    }
                    className={styles.interviewPanel}
                  >
                    <div className={styles.roundFeedbackSection}>
                      {interview.feedback_records.length > 0 ? (
                        <div className={styles.roundFeedbackList}>
                          {interview.feedback_records.map((record) => (
                            <div
                              key={record.id}
                              className={styles.roundFeedbackItem}
                            >
                              <div className={styles.roundFeedbackHeader}>
                                <span
                                  className={styles.roundFeedbackInterviewer}
                                >
                                  {record.staff?.name || "-"}
                                </span>
                                <span className={styles.roundFeedbackDate}>
                                  {dayjs(record.created_at).format(
                                    "MMM DD, YYYY",
                                  )}
                                </span>
                              </div>
                              <div className={styles.roundFeedbackContent}>
                                <MarkdownContainer content={record.content} />
                              </div>
                              <div className={styles.roundFeedbackFooter}>
                                <span
                                  className={classnames(
                                    styles.advanceBadge,
                                    record.advance_status === "advance" &&
                                      styles.advanceYes,
                                    record.advance_status === "hold" &&
                                      styles.advanceHold,
                                    record.advance_status === "reject" &&
                                      styles.advanceNo,
                                  )}
                                >
                                  {record.advance_status === "advance"
                                    ? "Advance"
                                    : record.advance_status === "hold"
                                      ? "Hold"
                                      : "Reject"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Empty style={{ marginTop: 60 }} />
                      )}
                      <div className={styles.roundFeedbackActions}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => {
                            setAddFeedbackForInterviewId(interview.id);
                            setIsAddFeedbackModalOpen(true);
                          }}
                        >
                          + Add Feedback
                        </Button>
                      </div>
                    </div>
                  </Collapse.Panel>
                );
              })}
          </Collapse>

          <div
            className={classnames(
              styles.roundFeedbackSection,
              styles.customizedFeedbackSection,
            )}
          >
            <div className={styles.roundFeedbackActions}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setAddFeedbackForInterviewId(undefined);
                  setIsAddFeedbackModalOpen(true);
                }}
              >
                + Create New Interview Round
              </Button>
            </div>
          </div>
        </section>
      </div>

      <div className={styles.notesSection}>
        <h2 className={styles.sectionTitle}>Notes</h2>

        <div className={styles.notesContainer}>
          {notes.length > 0 ? (
            <div className={styles.notesList}>
              {notes.map((note) => (
                <div key={note.id} className={styles.noteItem}>
                  <div className={styles.noteHeader}>
                    <span className={styles.noteAuthor}>
                      {note.staff?.name || "-"}
                    </span>
                    <span className={styles.noteDate}>
                      {dayjs(note.created_at).format("MMM DD, YYYY")}
                    </span>
                  </div>
                  <div className={styles.noteContent}>
                    <MarkdownContainer content={note.content} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
          <div className={styles.notesActions}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setIsAddNoteModalOpen(true)}
            >
              + Add Note
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.activitiesSection}>
        <h2 className={styles.sectionTitle}>Activity Log</h2>
        {activeLogs.length > 0 ? (
          <div className={styles.activityList}>
            {activeLogs.map((log) => {
              let description = "";
              const content = (() => {
                try {
                  return JSON.parse(log.content || "{}") as any;
                } catch {
                  return {};
                }
              })();
              let color: "red" | "blue" | "green" | "yellow";

              if (log.event_type === "update_stage") {
                // 更新阶段
                description = `Moved to ${content.stage_name} stage`;
                color = "green";
              } else if (log.event_type === "add_feedback") {
                // 添加反馈
                description = `${log.staff?.name ?? ""} added interview feedback`;
                color = "blue";
              } else if (log.event_type === "add_note") {
                // 添加备注
                description = `${log.staff?.name ?? ""} added a note`;
                color = "yellow";
              } else if (log.event_type === "start_interview") {
                // 开始AI预筛
                description = "AI prescreening started";
                color = "red";
              } else if (log.event_type === "finish_interview") {
                // 完成AI预筛
                description = "AI prescreening completed";
                color = "red";
              } else if (log.event_type === "create") {
                // 创建候选人
                const sourceChannel = getSourcingChannel(talent.source_channel);
                const sourceChannelText = DEFAULT_TRACKING_SOURCES.includes(
                  sourceChannel as any,
                )
                  ? originalT(`sourcing_channel.${sourceChannel}`)
                  : sourceChannel;
                description = `Application received via ${sourceChannelText}`;
                color = "red";
              } else if (log.event_type === "notify_email") {
                description = "Reminded to complete Screening via Email";
                color = "yellow";
              } else if (log.event_type === "notify_whatsapp_and_email") {
                description =
                  "Reminded to complete Screening via WhatsApp and Email";
                color = "yellow";
              } else {
                description = "Activity";
                color = "green";
              }

              return (
                <div key={log.id} className={styles.activityItem}>
                  <div className={styles.activityDotWrapper}>
                    <span
                      className={classnames(styles.activityDot, styles[color])}
                    />
                    <span className={styles.activityLine} />
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityTitle}>{description}</div>
                    <div className={styles.activityDate}>
                      {dayjs(log.created_at).format("YYYY/MM/DD HH:mm:ss")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty />
        )}
      </div>

      <div className={styles.pdfHiddenLayer}>
        <div ref={pdfReportRef} />
      </div>

      <Modal
        title="Add Feedback"
        open={isAddFeedbackModalOpen}
        centered
        onCancel={() => {
          setIsAddFeedbackModalOpen(false);
          setNewFeedbackContent("");
          setNewFeedbackAdvanceStatus("hold");
          setNewFeedbackRound("");
          setAddFeedbackForInterviewId(undefined);
        }}
        onOk={async () => {
          if (!addFeedbackForInterviewId && !newFeedbackRound.trim()) {
            message.error("Please enter interview round.");
            return;
          }

          if (!newFeedbackContent.trim()) {
            message.error("Please enter feedback.");
            return;
          }

          const isForRealInterview =
            addFeedbackForInterviewId &&
            typeof addFeedbackForInterviewId === "number";
          const newUuid = uuidv4();

          const { code } = await Post(
            isForRealInterview
              ? `/api/jobs/${jobIdStr}/talents/${talentIdStr}/interviews/${addFeedbackForInterviewId}/feedback_records`
              : `/api/jobs/${jobIdStr}/talents/${talentIdStr}/feedback_records`,
            {
              content: newFeedbackContent.trim(),
              advance_status: newFeedbackAdvanceStatus,
              customized_round: newFeedbackRound,
              customized_round_key: isForRealInterview
                ? undefined
                : (addFeedbackForInterviewId ?? newUuid),
            },
          );

          if (code === 0) {
            message.success("Feedback added");
            if (!addFeedbackForInterviewId) {
              setActiveInterviewKeys([...activeInterviewKeys, newUuid]);
            }
            setIsAddFeedbackModalOpen(false);
            setNewFeedbackContent("");
            setNewFeedbackAdvanceStatus("hold");
            setNewFeedbackRound("");
            setAddFeedbackForInterviewId(undefined);
            fetchInterviewFeedbackRecords();
            fetchTalent();
            fetchActiveLogs();
          }
        }}
        okText="Save"
      >
        <div className={styles.addFeedbackModal}>
          {!addFeedbackForInterviewId && (
            <div className={styles.addFeedbackField}>
              <div className={styles.addFeedbackLabel}>Interview Round</div>
              <div className={styles.addFeedbackContent}>
                <Input
                  className={styles.roundInput}
                  value={newFeedbackRound}
                  onChange={(e) => setNewFeedbackRound(e.target.value)}
                  placeholder="e.g. Round 1, Round 2"
                />
              </div>
            </div>
          )}
          <div className={styles.addFeedbackField}>
            <div className={styles.addFeedbackLabel}>Feedback</div>
            <div className={styles.addFeedbackContent}>
              <RichTextWithVoice
                value={newFeedbackContent}
                onChange={setNewFeedbackContent}
                minHeight={300}
              />
            </div>
          </div>
          <div className={styles.addFeedbackField}>
            <div className={styles.addFeedbackLabel}>Advance</div>
            <div className={styles.addFeedbackContent}>
              <Radio.Group
                value={newFeedbackAdvanceStatus}
                onChange={(e) => setNewFeedbackAdvanceStatus(e.target.value)}
                options={[
                  { label: "Advance", value: "advance" },
                  { label: "Hold", value: "hold" },
                  { label: "Reject", value: "reject" },
                ]}
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title="Move Stage"
        open={isMoveStageModalOpen}
        centered
        onCancel={() => {
          setIsMoveStageModalOpen(false);
        }}
        onOk={handleMoveStage}
        okButtonProps={{ disabled: !selectedStageId }}
        destroyOnClose
      >
        <div className={styles.addFeedbackModal}>
          <div className={styles.addFeedbackField}>
            <Select
              value={selectedStageId}
              onChange={(val) => setSelectedStageId(val)}
              options={moveStageOptions.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              style={{ width: "100%" }}
              placeholder="Select stage"
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Add Note"
        open={isAddNoteModalOpen}
        centered
        onCancel={() => {
          setIsAddNoteModalOpen(false);
          setNewNoteContent("");
        }}
        onOk={async () => {
          if (!newNoteContent.trim()) {
            message.error("Please enter note.");
            return;
          }
          const { code } = await Post(
            `/api/jobs/${jobIdStr}/talents/${talentIdStr}/notes`,
            { content: newNoteContent.trim() },
          );
          if (code === 0) {
            message.success("Note added");
            setIsAddNoteModalOpen(false);
            setNewNoteContent("");
            fetchTalentNotes();
            fetchActiveLogs();
          }
        }}
        okText="Save"
      >
        <div className={styles.addFeedbackModal}>
          <div className={styles.addFeedbackField}>
            <div className={styles.addFeedbackLabel}>Note</div>
            <div className={styles.addFeedbackContent}>
              <RichTextWithVoice
                value={newNoteContent}
                onChange={setNewNoteContent}
                minHeight={300}
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={isInterviewModalOpen}
        onCancel={() => setIsInterviewModalOpen(false)}
        width="fit-content"
        centered
        title={t("schedule_interview")}
        footer={null}
      >
        <InterviewForm
          talent={talent}
          jobName={job?.name ?? ""}
          interview={interviews[0]}
          interviewDefaults={
            job?.interview_defaults_json
              ? JSON.parse(job.interview_defaults_json)
              : undefined
          }
          onClose={() => setIsInterviewModalOpen(false)}
          onSubmit={() => {
            if (interviews[0]) {
              setIsInterviewModalOpen(false);
            } else {
              fetchTalent();
              setIsInterviewModalOpen(false);
            }
          }}
        />
      </Modal>

      {!!talent && (
        <TalentEvaluateFeedbackWithReasonModal
          jobId={talent.job_id ?? 0}
          talentId={talent.id ?? 0}
          open={isRejectModalOpen}
          onOk={() => {
            setIsRejectModalOpen(false);
            setNeedConfirmEvaluateFeedbackConversation(true);
            setOpenEvaluateFeedbackConversation(true);
            fetchTalent();
          }}
          onCancel={() => setIsRejectModalOpen(false)}
        />
      )}

      <TalentEvaluateFeedbackModal
        open={openEvaluateFeedbackReason}
        onOk={(value) => {
          updateTalentEvaluateFeedbackReason(value);
          setOpenEvaluateFeedbackReason(false);
        }}
        onCancel={() => setOpenEvaluateFeedbackReason(false)}
      />

      {!!talent && (
        <EvaluateFeedbackConversation
          open={openEvaluateFeedbackConversation}
          jobId={talent.job_id ?? 0}
          talentId={talent.id ?? 0}
          needConfirm={needConfirmEvaluateFeedbackConversation}
          onCancel={() => setOpenEvaluateFeedbackConversation(false)}
        />
      )}
      {canOpenJobApplyInternalDocuments && (
        <FloatButton
          icon={<FileOutlined />}
          onClick={() => {
            window.open(
              `/app/talents/${talentIdStr}/internal-documents`,
              "_blank",
            );
          }}
        />
      )}
    </div>
  );
};

export default observer(AtsTalentDetail);
