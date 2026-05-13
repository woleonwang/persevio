import { useEffect, useReducer, useRef, useState } from "react";
import {
  Button,
  Drawer,
  Dropdown,
  FloatButton,
  Input,
  Modal,
  Radio,
  Spin,
  Tabs,
  Tooltip,
  message,
} from "antd";
import classnames from "classnames";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  DownOutlined,
  ExportOutlined,
  FileOutlined,
  RightOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";

import Icon from "@/components/Icon";
import Phone from "@/assets/icons/phone";
import MailCheck from "@/assets/icons/mail-check";
import Link2 from "@/assets/icons/link2";
import DownloadIcon from "@/assets/icons/download";
import ScheduleInterview from "@/assets/icons/schedule-interview";
import MarkdownContainer from "@/components/MarkdownContainer";
import Resume from "@/components/AtsTalentDetail/components/Resume";
import EvaluateResultBadge from "@/components/EvaluateResultBadge";
import RichTextWithVoice from "@/components/RichTextWithVoice";
import InterviewForm from "@/components/NewTalentDetail/components/InterviewForm";
import TalentEvaluateFeedbackWithReasonModal from "@/components/TalentEvaluateFeedbackWithReasonModal";
import TalentEvaluateFeedbackModal from "@/components/TalentEvaluateFeedbackModal";
import EvaluateFeedbackConversation from "@/components/EvaluateFeedbackConversation";
import useTalent from "@/hooks/useTalent";
import useJob from "@/hooks/useJob";
import { Download, Get, Post } from "@/utils/request";
import {
  buildTalentDetailUrl,
  getQuery,
  getSourcingChannel,
  normalizeReport,
  parseJSON,
  DEFAULT_TRACKING_SOURCES,
} from "@/utils";
import { TALENT_DETAIL_FROM } from "@/utils/consts";
import { tokenStorage } from "@/utils/storage";
import { getEvaluateResultLevel } from "@/utils";

import legacyPdfStyles from "../AtsTalentDetail/style.module.less";
import AiPrescreeningDrawerBody from "./AiPrescreeningDrawerBody";
import { downloadTalentReportPdf } from "./downloadTalentReportPdf";
import styles from "./style.module.less";
import {
  formatLastUpdated,
  getInitials,
  isStageMoveTargetLocked,
  portalGetPopupContainer,
} from "./utils/helpers";

import { type TCustomizedInterview } from "./types";
import {
  TActiveLog,
  TTalentNote,
  TTalentResume,
} from "../AtsTalentDetail/type";
import ListCard from "./components/TimelineCard";
import {
  getKeyInformationListRender,
  getProfileSnapshotListRender,
  parseTotalYearsOfExperience,
} from "./utils/snapshotListParsers";
import Bag from "@/assets/icons/bag";
function AtsTalentDetailV2026ViewBase() {
  const { talentId: talentIdStr, jobId: jobIdStr } = useParams<{
    talentId: string;
    jobId: string;
  }>();

  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const [talentsOfCandidate, setTalentsOfCandidate] = useState<TTalent[]>([]);
  const [talentChatMessages, setTalentChatMessages] = useState<
    TMessageFromApi[]
  >([]);
  const [interviewFeedbackRecords, setInterviewFeedbackRecords] = useState<
    TInterviewFeedbackRecord[]
  >([]);
  const [notes, setNotes] = useState<TTalentNote[]>([]);
  const [activeLogs, setActiveLogs] = useState<TActiveLog[]>([]);

  const [resumeExpanded, setResumeExpanded] = useState(false);
  const [rightTab, setRightTab] = useState<
    "interview_feedback" | "notes" | "activity"
  >("interview_feedback");
  const [openRoundIds, setOpenRoundIds] = useState<string[]>([]);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  const [editingFeedbackRoundKey, setEditingFeedbackRoundKey] = useState<
    string | null
  >(null);
  const [newFeedbackContent, setNewFeedbackContent] = useState("");
  const [newFeedbackAdvanceStatus, setNewFeedbackAdvanceStatus] = useState<
    "advance" | "hold" | "reject"
  >("hold");

  const [editingNote, setEditingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");

  const [isNewRoundModalOpen, setIsNewRoundModalOpen] = useState(false);
  const [newRoundName, setNewRoundName] = useState("");
  const [newRoundFeedback, setNewRoundFeedback] = useState("");
  const [newRoundAdvance, setNewRoundAdvance] = useState<
    "advance" | "hold" | "reject"
  >("hold");

  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
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

  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const pdfReportRef = useRef<HTMLDivElement>(null);

  const { job } = useJob();
  const { talent, interviews, fetchTalent } = useTalent();
  const navigate = useNavigate();
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`talent_details.${key}`);

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

  const formattedLinkedinUrl = contact?.linkedin
    ? contact.linkedin.startsWith("http")
      ? contact.linkedin
      : `https://${contact.linkedin}`
    : null;

  const moveStageOptions: { id: string; name: string }[] = job.pipeline_stages
    ? JSON.parse(job.pipeline_stages)
    : [];

  const handleBack = () => {
    const from = getQuery("from");
    if (from === TALENT_DETAIL_FROM.local) {
      navigate(-1);
      return;
    }
    navigate(
      from === TALENT_DETAIL_FROM.talents
        ? `/app/talents`
        : `/app/jobs/${job.invitation_token}/standard-board?tab=talents`,
    );
  };

  const handleMoveStageTo = async (stageId: string) => {
    if (!talent || stageId === talent.stage_id) return;
    const { code } = await Post(
      `/api/jobs/${job.invitation_token}/talents/${talent.id}/stage`,
      { stage_id: stageId },
    );
    if (code === 0) {
      message.success("Stage Moved");
      void fetchTalent();
      void fetchActiveLogs();
    }
  };

  const updateTalentEvaluateFeedback = async (feedback: TEvaluateFeedback) => {
    setOpenEvaluateFeedbackReason(true);
    const { code } = await Post(
      `/api/jobs/${job.invitation_token}/talents/${talent.id}/evaluate_feedback`,
      { evaluate_feedback: feedback },
    );
    if (code === 0) void fetchTalent();
  };

  const updateTalentEvaluateFeedbackReason = async (reason: string) => {
    if (!job || !talent) return;
    const { code } = await Post(
      `/api/jobs/${job.invitation_token}/talents/${talent.id}/evaluate_feedback`,
      { evaluate_feedback_reason: reason },
    );
    if (code === 0) {
      void fetchTalent();
      setOpenEvaluateFeedbackConversation(true);
      setNeedConfirmEvaluateFeedbackConversation(true);
      message.success(t("update_success"));
    }
  };

  const downloadReportPdf = async () => {
    await downloadTalentReportPdf({
      pdfReportRef,
      talent,
      job,
      report,
      lastUpdated,
      originalT,
      styles: legacyPdfStyles as Record<string, string>,
    });
  };

  const downloadResume = async () => {
    await Download(
      `/api/jobs/${job.invitation_token}/talents/${talent.id}/download_resume`,
      `${talent.name}_resume`,
    );
  };

  const groupedInterviewFeedbackRecordsMap = interviewFeedbackRecords.reduce(
    (acc, record) => {
      const roundKey = record.customized_round_key || record.customized_round;
      if (!acc[roundKey]) acc[roundKey] = [];
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

  const interviewRounds: (TInterviewWithFeedback | TCustomizedInterview)[] = [
    ...interviews,
    ...customizedInterviews,
  ];

  const toggleRoundOpen = (id: string) => {
    setOpenRoundIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const isInterviewScheduled =
    interviews.length > 0 &&
    (interviews[0].mode === "written" || !!interviews[0].scheduled_at);

  const isAwaitingCandidateConfirm =
    interviews.length > 0 &&
    interviews[0].mode !== "written" &&
    !interviews[0].scheduled_at;

  const scheduleButton = (
    <Tooltip
      title={
        isAwaitingCandidateConfirm
          ? "Awaiting candidate's confirmation of interview details"
          : undefined
      }
      getPopupContainer={portalGetPopupContainer}
    >
      <span>
        <Button
          type={interviews.length === 0 ? "primary" : "default"}
          onClick={() => setIsInterviewModalOpen(true)}
          className={
            isInterviewScheduled || isAwaitingCandidateConfirm
              ? styles.scheduleAwaiting
              : undefined
          }
          icon={<Icon icon={<ScheduleInterview />} style={{ fontSize: 16 }} />}
        >
          {interviews.length === 0
            ? t("schedule_interview")
            : isInterviewScheduled
              ? "Interview Information"
              : t("awaiting_candidate_confirm")}
        </Button>
      </span>
    </Tooltip>
  );

  const sourceChannel = getSourcingChannel(talent.source_channel);
  const sourceChannelText = DEFAULT_TRACKING_SOURCES.includes(
    sourceChannel as (typeof DEFAULT_TRACKING_SOURCES)[number],
  )
    ? originalT(`sourcing_channel.${sourceChannel}`)
    : sourceChannel;

  const applicationsMenu = {
    items: talentsOfCandidate.map((row) => ({
      key: String(row.id),
      label: (
        <div>
          <div className={styles.menuJobRow}>
            {row.id === talent.id && (
              <CheckOutlined style={{ color: "#3682fe", fontSize: 12 }} />
            )}
            <span className={styles.menuPrimary}>{row.job?.name}</span>
            {row.job?.posted_at ? (
              <span
                className={classnames(styles.statusTag, styles.statusActive)}
              >
                Active
              </span>
            ) : (
              <span
                className={classnames(styles.statusTag, styles.statusClosed)}
              >
                Closed
              </span>
            )}
          </div>
          <div className={styles.menuSecondary}>
            Applied on {dayjs(row.created_at).format("YYYY/MM/DD")}
          </div>
        </div>
      ),
    })),
    onClick: ({ key }: { key: string }) => {
      const row = talentsOfCandidate.find((r) => String(r.id) === key);
      if (!row?.job) return;
      navigate(
        buildTalentDetailUrl(
          row.job.invitation_token,
          row.id,
          TALENT_DETAIL_FROM.local,
        ),
      );
      forceUpdate();
    },
  };

  const stageMenuItems = moveStageOptions.map((opt) => {
    const locked = isStageMoveTargetLocked(opt.name);
    const isCurrent = opt.id === talent.stage_id;
    const disabled = isCurrent || locked;
    return {
      key: opt.id,
      disabled,
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isCurrent && <CheckOutlined style={{ fontSize: 12 }} />}
          <span style={{ opacity: locked && !isCurrent ? 0.45 : 1 }}>
            {opt.name}
          </span>
        </div>
      ),
    };
  });

  const currentStageName =
    moveStageOptions.find((s) => s.id === talent.stage_id)?.name ??
    t("status_unknown");

  const snapshotCards = (report.profile_snapshot ?? [])
    .filter((snap) => snap.title.trim() !== "Total Years of Experience")
    .map((snap, i) => {
      const listCfg = getProfileSnapshotListRender(snap);
      return listCfg ? (
        <ListCard
          key={`ps-${i}`}
          title={snap.title}
          details={listCfg.rows}
          layout={listCfg.layout}
        />
      ) : null;
    });

  const keyInfoCards = (report.key_information ?? []).map((info, i) => {
    const listCfg = getKeyInformationListRender(info);
    return listCfg ? (
      <ListCard
        key={`ki-${i}`}
        title={info.title}
        details={listCfg.rows}
        layout={listCfg.layout}
        icon={listCfg.icon}
      />
    ) : null;
  });

  const saveInlineFeedback = async (
    round: TInterviewWithFeedback | TCustomizedInterview,
  ) => {
    if (!newFeedbackContent.trim()) {
      message.error("Please enter feedback.");
      return;
    }
    const id = round.id;
    const isForRealInterview = typeof id === "number";
    const { code } = await Post(
      isForRealInterview
        ? `/api/jobs/${jobIdStr}/talents/${talentIdStr}/interviews/${id}/feedback_records`
        : `/api/jobs/${jobIdStr}/talents/${talentIdStr}/feedback_records`,
      {
        content: newFeedbackContent.trim(),
        advance_status: newFeedbackAdvanceStatus,
        customized_round: isForRealInterview
          ? undefined
          : ((round as TCustomizedInterview).name ?? ""),
        customized_round_key: isForRealInterview ? undefined : String(id),
      },
    );
    if (code === 0) {
      message.success("Feedback added");
      setEditingFeedbackRoundKey(null);
      setNewFeedbackContent("");
      setNewFeedbackAdvanceStatus("hold");
      void fetchInterviewFeedbackRecords();
      void fetchTalent();
      void fetchActiveLogs();
    }
  };

  const saveNote = async () => {
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
      setEditingNote(false);
      setNewNoteContent("");
      void fetchTalentNotes();
      void fetchActiveLogs();
    }
  };

  const activityColor = (
    log: TActiveLog,
  ): "red" | "blue" | "green" | "yellow" => {
    if (
      log.event_type === "start_interview" ||
      log.event_type === "finish_interview" ||
      log.event_type === "create"
    ) {
      return "red";
    }
    if (log.event_type === "add_feedback") return "blue";
    if (log.event_type === "add_note" || log.event_type.startsWith("notify_")) {
      return "yellow";
    }
    return "green";
  };

  const activityDescription = (log: TActiveLog) => {
    const content = (() => {
      try {
        return JSON.parse(log.content || "{}") as { stage_name?: string };
      } catch {
        return {};
      }
    })();
    if (log.event_type === "update_stage") {
      return `Moved to ${content.stage_name} stage`;
    }
    if (log.event_type === "add_feedback") {
      return `${log.staff?.name ?? ""} added interview feedback`;
    }
    if (log.event_type === "add_note") {
      return `${log.staff?.name ?? ""} added a note`;
    }
    if (log.event_type === "start_interview") return "AI prescreening started";
    if (log.event_type === "finish_interview")
      return "AI prescreening completed";
    if (log.event_type === "create") {
      return `Application received via ${sourceChannelText}`;
    }
    if (log.event_type === "notify_email") {
      return "Reminded to complete Screening via Email";
    }
    if (log.event_type === "notify_whatsapp_and_email") {
      return "Reminded to complete Screening via WhatsApp and Email";
    }
    return "Activity";
  };

  return (
    <div className={styles.pageRoot}>
      <div className={styles.leftColumn}>
        <div className={styles.topHeaderContainer}>
          <div className={styles.topHeader}>
            <ArrowLeftOutlined
              className={styles.backIcon}
              onClick={handleBack}
            />
            <div className={styles.avatar}>{getInitials(talent.name)}</div>
            <div className={styles.candidateName}>{talent.name}</div>
            {lastUpdated && (
              <span className={styles.lastUpdated}>
                Last updated: {formatLastUpdated(lastUpdated)}
              </span>
            )}
          </div>

          <div className={styles.contactRow}>
            <div className={styles.contactRowMain}>
              {contact?.phone && (
                <a href={`tel:${contact.phone}`} className={styles.contactLink}>
                  <Icon icon={<Phone />} />
                  {contact.phone}
                </a>
              )}
              {contact?.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className={styles.contactLink}
                >
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
                  LinkedIn
                </a>
              )}
            </div>
            <Tooltip
              title="Download Report"
              getPopupContainer={portalGetPopupContainer}
            >
              <Button
                variant="outlined"
                color="primary"
                className={styles.iconBtn16}
                icon={<Icon icon={<DownloadIcon />} />}
                onClick={() => void downloadReportPdf()}
              />
            </Tooltip>
          </div>
        </div>

        <div className={styles.leftScroll}>
          {resumeExpanded && (
            <div className={styles.floatingResumeCta}>
              <Button onClick={() => setResumeExpanded(false)}>
                Collapse Resume <UpOutlined style={{ color: "#c1c1c1" }} />
              </Button>
            </div>
          )}
          <section className={styles.resumeSection}>
            {resumeExpanded && (
              <div className={styles.resumeSectionHeader}>
                <h2 className={styles.sectionHeading}>Resume</h2>
                <div className={styles.resumeToolbar}>
                  {resumeExpanded && (
                    <div className={styles.resumeMeta}>
                      Uploaded on{" "}
                      {talent.created_at
                        ? dayjs(talent.created_at).format("YYYY/MM/DD")
                        : "—"}
                    </div>
                  )}
                  {resumeExpanded && (
                    <Button
                      type="primary"
                      icon={<Icon icon={<DownloadIcon />} />}
                      onClick={() => void downloadResume()}
                    >
                      Download PDF
                    </Button>
                  )}
                </div>
              </div>
            )}
            <div
              className={classnames(
                styles.resumeShell,
                !resumeExpanded && styles.resumeCollapsed,
              )}
            >
              <div className={styles.resumeInner}>
                {resumeDetail?.contact_information ? (
                  <Resume resume={resumeDetail} />
                ) : (
                  <MarkdownContainer content={talent.parsed_content || ""} />
                )}
              </div>
              {!resumeExpanded && (
                <>
                  <div className={styles.resumeFade} />
                  <div className={styles.floatingResumeCta}>
                    <Button
                      variant="outlined"
                      shape="round"
                      onClick={() => setResumeExpanded(true)}
                    >
                      View Full Resume{" "}
                      <DownOutlined style={{ color: "#c1c1c1" }} />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </section>

          {resumeExpanded && (
            <h2 className={styles.sectionHeading} style={{ marginTop: 24 }}>
              Profile Snapshot
            </h2>
          )}

          <div className={styles.cardWaterfall}>
            {(() => {
              const { years, duration } = parseTotalYearsOfExperience(
                report.profile_snapshot.find(
                  (snap) => snap.title.trim() === "Total Years of Experience",
                )?.details as string,
              );

              if (!years && !duration) {
                return null;
              }

              return (
                <div className={styles.infoCard}>
                  <div>
                    <div className={styles.infoCardTitle}>
                      Total Years of Experience
                    </div>
                    <div className={styles.infoCardYears}>{years}</div>
                    <div className={styles.infoCardDuration}>{duration}</div>
                  </div>
                  <div className={styles.infoCardIcon}>
                    <Icon icon={<Bag />} />
                  </div>
                </div>
              );
            })()}

            {snapshotCards}
            {keyInfoCards}
          </div>
        </div>
      </div>

      <div className={styles.rightColumn}>
        <div className={styles.rightDock}>
          <div className={styles.jobTitleRow}>
            <h2 className={styles.jobTitle}>{job.name}</h2>
            {job.posted_at ? (
              <span
                className={classnames(styles.statusTag, styles.statusActive)}
              >
                Active
              </span>
            ) : (
              <span
                className={classnames(styles.statusTag, styles.statusClosed)}
              >
                Closed
              </span>
            )}
            <Tooltip
              title="Open job"
              getPopupContainer={portalGetPopupContainer}
            >
              <Button
                type="text"
                size="small"
                className={styles.iconBtn16}
                icon={<ExportOutlined style={{ fontSize: 16 }} />}
                onClick={() =>
                  navigate(`/app/jobs/${job.invitation_token}/standard-board`)
                }
              />
            </Tooltip>
          </div>
          <div className={styles.metaLine}>
            Applied on {dayjs(talent.created_at).format("YYYY/MM/DD")} · Source:{" "}
            {sourceChannelText}
          </div>

          <div className={styles.actionsRow}>
            <Dropdown
              menu={applicationsMenu}
              getPopupContainer={portalGetPopupContainer}
            >
              <Button>
                {talentsOfCandidate.length} Applications <RightOutlined />
              </Button>
            </Dropdown>

            <Tooltip
              title="Move Stage"
              getPopupContainer={portalGetPopupContainer}
            >
              <Dropdown
                menu={{
                  items: stageMenuItems,
                  onClick: ({ key }) => void handleMoveStageTo(key),
                }}
                getPopupContainer={portalGetPopupContainer}
              >
                <Button>
                  Stage: {currentStageName} <RightOutlined />
                </Button>
              </Dropdown>
            </Tooltip>

            {scheduleButton}

            <Tooltip
              title={
                talent.status === "rejected"
                  ? "To restore this candidate, move them to another Stage"
                  : undefined
              }
              getPopupContainer={portalGetPopupContainer}
            >
              <span>
                <Button
                  danger
                  disabled={talent.status === "rejected"}
                  onClick={() => setIsRejectModalOpen(true)}
                >
                  {talent.status === "rejected"
                    ? "Rejected"
                    : t("action_reject")}
                </Button>
              </span>
            </Tooltip>
          </div>

          <Tabs
            className={styles.tabsUnderline}
            activeKey={rightTab}
            onChange={(k) =>
              setRightTab(k as "interview_feedback" | "notes" | "activity")
            }
            animated={{ inkBar: true, tabPane: false }}
            items={[
              {
                key: "interview_feedback",
                label: "Interview Feedback",
                children: null,
              },
              { key: "notes", label: "Notes", children: null },
              { key: "activity", label: "Activity", children: null },
            ]}
          />
        </div>

        <div className={styles.rightTabScroll}>
          {rightTab === "interview_feedback" && (
            <div>
              <div
                className={styles.round0Row}
                onClick={() => setAiDrawerOpen(true)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className={styles.feedbackRoundTitle}>
                    Round 0: AI Prescreening
                  </span>
                  <EvaluateResultBadge
                    size="small"
                    withTitle
                    result={getEvaluateResultLevel(report)}
                  />
                </div>
                <RightOutlined />
              </div>

              {interviewRounds.map((round) => {
                const idStr = String(round.id);
                const open = openRoundIds.includes(idStr);
                const headerTitle = (round as TCustomizedInterview).name
                  ? `Interview Round: ${(round as TCustomizedInterview).name}`
                  : "Round 1: Interview";
                const count = round.feedback_records.length;
                return (
                  <div key={idStr} className={styles.feedbackRoundBlock}>
                    <div
                      className={styles.feedbackRoundHeader}
                      onClick={() => toggleRoundOpen(idStr)}
                    >
                      <span className={styles.feedbackRoundTitle}>
                        {headerTitle}
                      </span>
                      <span className={styles.feedbackRoundCount}>{count}</span>
                    </div>
                    {open && (
                      <div className={styles.feedbackRoundBody}>
                        {round.feedback_records.map((record) => (
                          <div key={record.id} className={styles.feedbackCard}>
                            <div className={styles.feedbackCardMeta}>
                              <span className={styles.feedbackAuthor}>
                                {record.staff?.name || "-"}
                              </span>
                              <span className={styles.feedbackDate}>
                                {dayjs(record.created_at).format(
                                  "MMM DD, YYYY",
                                )}
                              </span>
                            </div>
                            <MarkdownContainer content={record.content} />
                            <div style={{ marginTop: 8 }}>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "#6b7280",
                                }}
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

                        {editingFeedbackRoundKey === idStr ? (
                          <div className={styles.addEditorWrap}>
                            <RichTextWithVoice
                              autoFocus
                              value={newFeedbackContent}
                              onChange={setNewFeedbackContent}
                              minHeight={220}
                            />
                            <div className={styles.saveRow}>
                              <Radio.Group
                                value={newFeedbackAdvanceStatus}
                                onChange={(e) =>
                                  setNewFeedbackAdvanceStatus(e.target.value)
                                }
                                options={[
                                  { label: "Advance", value: "advance" },
                                  { label: "Hold", value: "hold" },
                                  { label: "Reject", value: "reject" },
                                ]}
                              />
                            </div>
                            <div className={styles.saveRow}>
                              <Button
                                type="primary"
                                onClick={() => void saveInlineFeedback(round)}
                              >
                                Save
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingFeedbackRoundKey(null);
                                  setNewFeedbackContent("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            block
                            style={{ marginTop: 10 }}
                            onClick={() => {
                              setEditingFeedbackRoundKey(idStr);
                              setNewFeedbackContent("");
                              setNewFeedbackAdvanceStatus("hold");
                            }}
                          >
                            + Add Feedback
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <Button
                style={{ marginTop: 8 }}
                onClick={() => {
                  setNewRoundName("");
                  setNewRoundFeedback("");
                  setNewRoundAdvance("hold");
                  setIsNewRoundModalOpen(true);
                }}
              >
                + Create New Interview Round
              </Button>
            </div>
          )}

          {rightTab === "notes" && (
            <div>
              {notes.map((note) => (
                <div key={note.id} className={styles.feedbackCard}>
                  <div className={styles.feedbackCardMeta}>
                    <span
                      className={styles.feedbackAuthor}
                      style={{ fontWeight: 600 }}
                    >
                      {note.staff?.name || "-"}
                    </span>
                    <span className={styles.feedbackDate}>
                      {dayjs(note.created_at).format("MMM DD, YYYY")}
                    </span>
                  </div>
                  <MarkdownContainer content={note.content} />
                </div>
              ))}

              {editingNote ? (
                <div className={styles.addEditorWrap}>
                  <RichTextWithVoice
                    autoFocus
                    value={newNoteContent}
                    onChange={setNewNoteContent}
                    minHeight={220}
                  />
                  <div className={styles.notesSaveRow}>
                    <Button type="primary" onClick={() => void saveNote()}>
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingNote(false);
                        setNewNoteContent("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  block
                  style={{ marginTop: 12 }}
                  onClick={() => {
                    setEditingNote(true);
                    setNewNoteContent("");
                  }}
                >
                  + Add Note
                </Button>
              )}
            </div>
          )}

          {rightTab === "activity" && (
            <div className={styles.activitySection}>
              <h3 className={styles.sectionHeading}>Activity Log</h3>
              {activeLogs.length === 0 ? (
                <div style={{ color: "#9ca3af", marginTop: 12 }}>
                  No activity
                </div>
              ) : (
                <div className={styles.activityList}>
                  {activeLogs.map((log) => {
                    const color = activityColor(log);
                    const dotToneClass =
                      color === "green"
                        ? styles.activityDotGreen
                        : color === "blue"
                          ? styles.activityDotBlue
                          : color === "yellow"
                            ? styles.activityDotYellow
                            : styles.activityDotRed;
                    return (
                      <div key={log.id} className={styles.activityItem}>
                        <div className={styles.activityDotWrapper}>
                          <span
                            className={classnames(
                              styles.activityDot,
                              dotToneClass,
                            )}
                          />
                          <span className={styles.activityLine} />
                        </div>
                        <div className={styles.activityContent}>
                          <div className={styles.activityTitle}>
                            {activityDescription(log)}
                          </div>
                          <div className={styles.activityDate}>
                            {dayjs(log.created_at).format(
                              "YYYY/MM/DD HH:mm:ss",
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Drawer
        title="Round 0: AI Prescreening"
        placement="right"
        width={880}
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        destroyOnClose
        zIndex={1100}
        styles={{
          mask: { zIndex: 1100 },
          wrapper: { zIndex: 1100 },
          body: {
            padding: 0,
          },
        }}
      >
        <div className={styles.drawerPad}>
          <AiPrescreeningDrawerBody
            report={report}
            talent={talent}
            job={job}
            talentChatMessages={talentChatMessages}
            onEvaluateFeedbackChange={updateTalentEvaluateFeedback}
            onOpenEvaluateFeedbackConversation={() => {
              setNeedConfirmEvaluateFeedbackConversation(false);
              setOpenEvaluateFeedbackConversation(true);
            }}
          />
        </div>
      </Drawer>

      <Modal
        title="Create New Interview Round"
        open={isNewRoundModalOpen}
        centered
        onCancel={() => setIsNewRoundModalOpen(false)}
        onOk={async () => {
          if (!newRoundName.trim()) {
            message.error("Please enter interview round.");
            return;
          }
          if (!newRoundFeedback.trim()) {
            message.error("Please enter feedback.");
            return;
          }
          const newUuid = uuidv4();
          const { code } = await Post(
            `/api/jobs/${jobIdStr}/talents/${talentIdStr}/feedback_records`,
            {
              content: newRoundFeedback.trim(),
              advance_status: newRoundAdvance,
              customized_round: newRoundName.trim(),
              customized_round_key: newUuid,
            },
          );
          if (code === 0) {
            message.success("Feedback added");
            setIsNewRoundModalOpen(false);
            setOpenRoundIds((prev) => [...prev, newUuid]);
            void fetchInterviewFeedbackRecords();
            void fetchTalent();
            void fetchActiveLogs();
          }
        }}
        okText="Save"
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 6 }}>Interview Round</div>
          <Input
            value={newRoundName}
            onChange={(e) => setNewRoundName(e.target.value)}
            placeholder="e.g. Negotiation"
          />
        </div>
        <RichTextWithVoice
          value={newRoundFeedback}
          onChange={setNewRoundFeedback}
          minHeight={240}
        />
        <div style={{ marginTop: 12 }}>
          <Radio.Group
            value={newRoundAdvance}
            onChange={(e) => setNewRoundAdvance(e.target.value)}
            options={[
              { label: "Advance", value: "advance" },
              { label: "Hold", value: "hold" },
              { label: "Reject", value: "reject" },
            ]}
          />
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
          jobName={job.name ?? ""}
          interview={interviews[0]}
          interviewDefaults={
            job.interview_defaults_json
              ? JSON.parse(job.interview_defaults_json)
              : undefined
          }
          onClose={() => setIsInterviewModalOpen(false)}
          onSubmit={() => {
            if (interviews[0]) {
              setIsInterviewModalOpen(false);
            } else {
              void fetchTalent();
              setIsInterviewModalOpen(false);
            }
          }}
        />
      </Modal>

      <div className={styles.pdfHiddenLayer}>
        <div ref={pdfReportRef} />
      </div>

      {!!talent && (
        <TalentEvaluateFeedbackWithReasonModal
          jobId={job.invitation_token}
          talentId={talent.id ?? 0}
          open={isRejectModalOpen}
          successMessage="Application Rejected"
          onOk={() => {
            setIsRejectModalOpen(false);
            void fetchTalent();
            void fetchActiveLogs();
          }}
          onCancel={() => setIsRejectModalOpen(false)}
        />
      )}
      {/* Modal 内已 toast；onOk 再 toast 会重复，移除 onOk 内重复 */}
      <TalentEvaluateFeedbackModal
        open={openEvaluateFeedbackReason}
        onOk={(value) => {
          void updateTalentEvaluateFeedbackReason(value);
          setOpenEvaluateFeedbackReason(false);
        }}
        onCancel={() => setOpenEvaluateFeedbackReason(false)}
      />

      {!!talent && (
        <EvaluateFeedbackConversation
          open={openEvaluateFeedbackConversation}
          jobId={job.invitation_token}
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
}

const AtsTalentDetailV2026 = observer(AtsTalentDetailV2026ViewBase);
AtsTalentDetailV2026.displayName = "AtsTalentDetailV2026";
export default AtsTalentDetailV2026;
