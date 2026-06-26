import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
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
  DownOutlined,
  FileOutlined,
  TranslationOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";

import Icon from "@/components/Icon";
import MarkdownContainer from "@/components/MarkdownContainer";
import Resume from "@/components/AtsTalentDetail/components/Resume";
import EvaluateResultBadge from "@/components/EvaluateResultBadge";
import RichTextWithVoice from "@/components/RichTextWithVoice";
import InterviewForm from "@/components/NewTalentDetail/components/InterviewForm";
import TalentEvaluateFeedbackWithReasonModal from "@/components/TalentEvaluateFeedbackWithReasonModal";
import TalentEvaluateFeedbackModal from "@/components/TalentEvaluateFeedbackModal";
import EvaluateFeedbackConversation from "@/components/EvaluateFeedbackConversation";

import Phone from "@/assets/icons/phone";
import MailCheck from "@/assets/icons/mail-check";
import Link2 from "@/assets/icons/link2";
import DownloadIcon from "@/assets/icons/download";
import ScheduleInterview from "@/assets/icons/schedule-interview";
import Bag from "@/assets/icons/bag";

import useTalent from "@/hooks/useTalent";
import useJob from "@/hooks/useJob";
import { Get, Post, Download } from "@/utils/request";
import {
  buildTalentDetailUrl,
  downloadMarkdownAsPDF,
  getQuery,
  getSourcingChannel,
  normalizeReport,
  parseJSON,
  DEFAULT_TRACKING_SOURCES,
  getEvaluateResultLevel,
} from "@/utils";
import {
  PREFIX_DEFAULT_STAGE_KEYS,
  SUFFIX_DEFAULT_STAGE_KEYS,
  TALENT_DETAIL_FROM,
} from "@/utils/consts";

import AiPrescreeningDrawerBody from "./components/AiPrescreeningDrawerBody";
import AssignedRecruitersTab from "./components/AssignedRecruitersTab";
import ListCard from "./components/TimelineCard";
import { downloadTalentReportPdf } from "./utils/downloadTalentReportPdf";
import { formatLastUpdated, getInitials } from "./utils/helpers";
import {
  getKeyInformationListRender,
  getProfileSnapshotListRender,
  parseTotalYearsOfExperience,
} from "./utils/snapshotListParsers";

import styles from "./style.module.less";

import { type TCustomizedInterview } from "./types";
import {
  TActiveLog,
  TTalentNote,
  TTalentResume,
} from "@/components/AtsTalentDetail/type";
import globalStore from "@/store/global";
import { getStageKey } from "@/utils/talentStage";
import Right from "@/assets/icons/right";
import { storage, StorageKey } from "@/utils/storage";
import NameChip from "../NameChip";

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
  const [resumeViewLocale, setResumeViewLocale] = useState<
    "original" | "en" | "zh"
  >("original");
  const [translatedResumeByLocale, setTranslatedResumeByLocale] = useState<
    Partial<Record<"en" | "zh", string>>
  >({});
  const [resumeViewLoading, setResumeViewLoading] = useState(false);
  const [rightTab, setRightTab] = useState<
    "interview_feedback" | "notes" | "activity" | "assigned_recruiters"
  >("interview_feedback");
  const [openRoundIds, setOpenRoundIds] = useState<string[]>([]);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  const [isAddFeedbackModalOpen, setIsAddFeedbackModalOpen] = useState(false);
  const [addFeedbackForInterviewId, setAddFeedbackForInterviewId] = useState<
    number | string | undefined
  >(undefined);

  const [newFeedbackContent, setNewFeedbackContent] = useState("");
  const [newFeedbackAdvanceStatus, setNewFeedbackAdvanceStatus] = useState<
    "advance" | "hold" | "reject"
  >("hold");
  const [newFeedbackRound, setNewFeedbackRound] = useState("");

  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");

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
  const [
    sourceEvaluateFeedbackConversation,
    setSourceEvaluateFeedbackConversation,
  ] = useState<"reject_calibration" | "evaluate_feedback">("evaluate_feedback");

  const isSystemAdmin = globalStore.isAdmin;
  const pdfReportRef = useRef<HTMLDivElement>(null);
  const autoExportReportQuery = getQuery("auto_export_report");
  const autoExportTriggeredRef = useRef(false);

  const { job } = useJob();
  const { talent, interviews, fetchTalent, updateTalent } = useTalent({
    skipViewedAt: autoExportReportQuery === "1",
  });
  const navigate = useNavigate();
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`talent_details.${key}`);

  useEffect(() => {
    setResumeViewLocale("original");
    setTranslatedResumeByLocale({});
    setResumeViewLoading(false);
  }, [talent?.id]);

  useEffect(() => {
    if (
      autoExportTriggeredRef.current ||
      !job ||
      !talent ||
      !jobIdStr ||
      !talentIdStr ||
      !pdfReportRef.current ||
      autoExportReportQuery !== "1"
    )
      return;

    autoExportTriggeredRef.current = true;
    const report = normalizeReport(parseJSON(talent.evaluate_json));
    const lastUpdated =
      talent.evaluate_result_updated_at ||
      talent.viewed_at ||
      talent.feedback_updated_at;

    void downloadTalentReportPdf({
      pdfReportRef,
      talent,
      job,
      report,
      lastUpdated,
      originalT,
      locale: "en",
      jobId: jobIdStr,
      talentId: talentIdStr,
    });
  }, [job, talent]);

  const isFromAdmin = !!storage.get(StorageKey.ADMIN_TOKEN);

  const canOpenJobApplyInternalDocuments =
    (isSystemAdmin || isFromAdmin) && !!talentIdStr;

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
    setTalentChatMessages(
      (data.messages ?? []).filter(
        (message: TMessageFromApi, index: number) =>
          !(
            (index === 0 && message.content.role === "assistant") ||
            (index === 1 && message.content.role === "user")
          ),
      ),
    );
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
    if (!talent) return;
    const { code } = await Post(
      `/api/jobs/${job.invitation_token}/talents/${talent.id}/stage`,
      { stage_id: stageId },
    );
    if (code === 0) {
      message.success("Stage Moved");
      fetchTalent();
      fetchActiveLogs();
    }
  };

  const updateTalentEvaluateFeedback = async (feedback: TEvaluateFeedback) => {
    setOpenEvaluateFeedbackReason(true);
    const { code } = await Post(
      `/api/jobs/${job.invitation_token}/talents/${talent.id}/evaluate_feedback`,
      { evaluate_feedback: feedback },
    );
    if (code === 0) fetchTalent();
  };

  const updateTalentEvaluateFeedbackReason = async (reason: string) => {
    if (!job || !talent) return;
    const { code } = await Post(
      `/api/jobs/${job.invitation_token}/talents/${talent.id}/evaluate_feedback`,
      { evaluate_feedback_reason: reason },
    );
    if (code === 0) {
      fetchTalent();
      setSourceEvaluateFeedbackConversation("evaluate_feedback");
      setOpenEvaluateFeedbackConversation(true);
      setNeedConfirmEvaluateFeedbackConversation(true);
      message.success(t("update_success"));
    }
  };

  const downloadReportPdf = async (locale: "en" | "zh" = "en") => {
    if (!jobIdStr || !talentIdStr) return;
    await downloadTalentReportPdf({
      pdfReportRef,
      talent,
      job,
      report,
      lastUpdated,
      originalT,
      locale,
      jobId: jobIdStr,
      talentId: talentIdStr,
    });
  };

  const resumeLanguage =
    resumeDetail?.language === "zh" || resumeDetail?.language === "en"
      ? resumeDetail.language
      : "others";

  const resumeDownloadMenuItems: {
    option: "original" | "en" | "zh";
    label: string;
    badge: "original" | "ai";
  }[] = [
    {
      option: "original",
      label: t(
        resumeLanguage === "zh"
          ? "download_report_chinese"
          : resumeLanguage === "en"
            ? "download_report_english"
            : "download_resume_other_language",
      ),
      badge: "original",
    },
  ];

  if (resumeLanguage !== "en") {
    resumeDownloadMenuItems.push({
      option: "en",
      label: t("download_report_english"),
      badge: "ai",
    });
  }

  if (resumeLanguage !== "zh") {
    resumeDownloadMenuItems.push({
      option: "zh",
      label: t("download_report_chinese"),
      badge: "ai",
    });
  }

  const handleDownloadResume = async (option: "original" | "en" | "zh") => {
    const safeName = talent.name.replace(/\s+/g, "");

    if (option === "original") {
      await Download(
        `/api/jobs/${job.invitation_token}/talents/${talent.id}/download_resume`,
        `${talent.name}_resume`,
      );
      return;
    }

    const hideLoading = message.loading(t("download_resume_translating"), 0);

    try {
      const { code, data } = await Post<{ content: string }>(
        `/api/jobs/${job.invitation_token}/talents/${talent.id}/translate_resume`,
        { target_lang: option },
      );

      if (code !== 0 || !data?.content?.trim()) {
        message.error(t("download_resume_translate_failed"));
        return;
      }

      const container = document.createElement("div");
      container.style.width = "190mm";
      document.body.appendChild(container);
      const root = createRoot(container);

      try {
        root.render(<MarkdownContainer content={data.content} />);
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });
        await downloadMarkdownAsPDF({
          name: `${safeName}_resume${option === "zh" ? "_zh" : "_en"}`,
          element: container,
          options: {
            skipAutoSplit: true,
            heightRate: 0.32,
          },
        });
      } finally {
        root.unmount();
        document.body.removeChild(container);
      }
    } finally {
      hideLoading();
    }
  };

  const handleResumeViewLocaleChange = async (
    option: "original" | "en" | "zh",
  ) => {
    if (option === resumeViewLocale) return;

    if (option === "original") {
      setResumeViewLocale("original");
      return;
    }

    if (translatedResumeByLocale[option]) {
      setResumeViewLocale(option);
      return;
    }

    setResumeViewLoading(true);
    try {
      const { code, data } = await Post<{ content: string }>(
        `/api/jobs/${job.invitation_token}/talents/${talent.id}/translate_resume`,
        { target_lang: option },
      );

      if (code !== 0 || !data?.content?.trim()) {
        message.error(t("download_resume_translate_failed"));
        return;
      }

      setTranslatedResumeByLocale((prev) => ({
        ...prev,
        [option]: data.content,
      }));
      setResumeViewLocale(option);
    } finally {
      setResumeViewLoading(false);
    }
  };

  const activeTranslatedResumeContent =
    resumeViewLocale === "en" || resumeViewLocale === "zh"
      ? translatedResumeByLocale[resumeViewLocale]
      : "";

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

  // const totalFeedbackCount = interviewRounds.reduce(
  //   (sum, round) => sum + round.feedback_records.length,
  //   0,
  // );
  const notesCount = notes.length;

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
            : "Interview Information"}
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
        <div
          className={classnames(styles.menuItem, {
            [styles.selected]: row.id === talent.id,
          })}
        >
          <div className={styles.menuJobRow}>
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
            Applied on {formatLastUpdated(row.created_at)}
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

  const moveStageOptions: { id: string; name: string; disabled: boolean }[] = [
    ...PREFIX_DEFAULT_STAGE_KEYS.filter((key) => key !== "reached_out").map(
      (key) => ({
        id: key,
        name: originalT(`pipeline_section.${key}`),
        disabled: true,
      }),
    ),
    ...(job.pipeline_stages ? JSON.parse(job.pipeline_stages) : []),
    ...SUFFIX_DEFAULT_STAGE_KEYS.map((key) => ({
      id: key,
      name: originalT(`pipeline_section.${key}`),
      disabled: true,
    })),
  ];

  const stageMenuItems = moveStageOptions.map((opt) => {
    const isCurrent =
      talent.status === "rejected"
        ? opt.id === "rejected"
        : opt.id === talent.stage_id;
    const locked = isCurrent || opt.disabled;
    return {
      key: opt.id,
      disabled: locked,
      label: (
        <div
          className={classnames(
            styles.stageMenuItem,
            { [styles.selected]: isCurrent },
            { [styles.locked]: locked },
          )}
        >
          {opt.name}
        </div>
      ),
    };
  });

  const currentStageName =
    moveStageOptions.find((s) => s.id === getStageKey(talent))?.name ??
    getStageKey(talent);

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

  const closeAddFeedbackModal = () => {
    setIsAddFeedbackModalOpen(false);
    setNewFeedbackContent("");
    setNewFeedbackAdvanceStatus("hold");
    setNewFeedbackRound("");
    setAddFeedbackForInterviewId(undefined);
  };

  const openAddFeedbackForNewRound = () => {
    setIsAddFeedbackModalOpen(true);
  };

  const openAddFeedbackForRound = (
    round: TInterviewWithFeedback | TCustomizedInterview,
  ) => {
    setAddFeedbackForInterviewId(round.id);
    setIsAddFeedbackModalOpen(true);
  };

  const submitAddFeedbackFromModal = async () => {
    if (!addFeedbackForInterviewId && !newFeedbackRound.trim()) {
      message.error("Please enter interview round.");
    }
    if (!newFeedbackContent.trim()) {
      message.error("Please enter feedback.");
    }

    const isForRealInterview =
      !!addFeedbackForInterviewId &&
      typeof addFeedbackForInterviewId === "number";

    const newUuid = uuidv4();

    const customizedKey = isForRealInterview
      ? undefined
      : (addFeedbackForInterviewId ?? newUuid);

    const { code } = await Post(
      isForRealInterview
        ? `/api/jobs/${jobIdStr}/talents/${talentIdStr}/interviews/${addFeedbackForInterviewId}/feedback_records`
        : `/api/jobs/${jobIdStr}/talents/${talentIdStr}/feedback_records`,
      {
        content: newFeedbackContent.trim(),
        advance_status: newFeedbackAdvanceStatus,
        customized_round: newFeedbackRound,
        customized_round_key: isForRealInterview ? undefined : customizedKey,
      },
    );

    if (code === 0) {
      message.success("Feedback added");
      if (!addFeedbackForInterviewId) {
        setOpenRoundIds((prev) => [...prev, newUuid]);
      }
      closeAddFeedbackModal();
      fetchInterviewFeedbackRecords();
      fetchTalent();
      fetchActiveLogs();
    }
  };

  const activityColor = (
    log: TActiveLog,
  ): "red" | "blue" | "green" | "yellow" => {
    if (
      log.event_type === "reject" ||
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

  const rejectReasonLabelKey = (
    reasonType: TTalentRejectReasonType,
  ): string => {
    const map: Record<TTalentRejectReasonType, string> = {
      not_shortlisted: "reject_reason_not_shortlisted",
      did_not_pass_interview: "reject_reason_failed_interview",
      headcount_freeze: "reject_reason_headcount_freeze",
      candidate_withdrew: "reject_reason_candidate_withdrew",
      other: "reject_reason_others",
    };
    return map[reasonType] ?? "reject_reason_others";
  };

  const activityDescription = (log: TActiveLog): ReactNode => {
    let content = parseJSON(log.content);
    const staffName = log.staff?.name ?? "";

    if (log.event_type === "update_stage") {
      return (
        <>
          Moved to {content.stage_name} stage by <NameChip name={staffName} />
        </>
      );
    }
    if (log.event_type === "reject") {
      const reasonLabel = content.reject_reason_type
        ? t(rejectReasonLabelKey(content.reject_reason_type))
        : "-";
      const feedback = (content.feedback ?? "").trim();
      return (
        <>
          Rejected by <NameChip name={staffName} />
          .&nbsp;Reason: {reasonLabel}
          {feedback ? `,${feedback}` : ""}
        </>
      );
    }
    if (log.event_type === "add_feedback") {
      return `${staffName} added interview feedback`;
    }
    if (log.event_type === "add_note") {
      return `${staffName} added a note`;
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
            <Dropdown
              trigger={["hover"]}
              placement="bottomRight"
              mouseLeaveDelay={0.3}
              dropdownRender={() => (
                <div className={styles.downloadReportDropdown}>
                  <div className={styles.downloadReportDropdownHeader}>
                    {t("download_resume_in")}
                  </div>
                  {resumeDownloadMenuItems.map((item) => (
                    <Button
                      key={item.option}
                      type="text"
                      block
                      className={styles.downloadReportDropdownItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDownloadResume(item.option);
                      }}
                    >
                      <span className={styles.downloadReportDropdownLabel}>
                        {item.label}
                      </span>
                      <span
                        className={classnames(
                          styles.downloadReportBadge,
                          item.badge === "original"
                            ? styles.downloadReportBadgeNative
                            : styles.downloadReportBadgeAi,
                        )}
                      >
                        {item.badge === "original"
                          ? t("download_resume_original")
                          : t("download_report_ai_translated")}
                      </span>
                    </Button>
                  ))}
                </div>
              )}
            >
              <Button
                variant="outlined"
                color="primary"
                icon={<Icon icon={<DownloadIcon />} />}
              >
                Resume
              </Button>
            </Dropdown>
          </div>
        </div>

        <div className={styles.leftScroll} id="left-scroll-container">
          {resumeExpanded && (
            <div className={styles.floatingResumeCta}>
              <Button
                onClick={() => {
                  setResumeExpanded(false);
                  document.getElementById("left-scroll-container")?.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
              >
                Collapse Resume <UpOutlined style={{ color: "#c1c1c1" }} />
              </Button>
            </div>
          )}
          <section className={styles.resumeSection}>
            <div
              className={classnames(
                styles.resumeSectionHeaderAnimated,
                resumeExpanded && styles.resumeSectionHeaderAnimatedOpen,
              )}
              aria-hidden={!resumeExpanded}
            >
              <div className={styles.resumeSectionHeader}>
                <h2 className={styles.sectionHeading}>Resume</h2>
                <div className={styles.resumeToolbar}>
                  <div className={styles.resumeMeta}>
                    Uploaded on{" "}
                    {talent.created_at
                      ? formatLastUpdated(talent.created_at)
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
            <div
              className={classnames(
                styles.resumeShell,
                resumeExpanded
                  ? styles.resumeShellExpanded
                  : styles.resumeCollapsed,
              )}
            >
              <div className={styles.resumeInner}>
                <Tooltip title={t("switch_resume_language")}>
                  <Dropdown
                    trigger={["hover", "click"]}
                    placement="bottomRight"
                    disabled={resumeDownloadMenuItems.length === 0}
                    dropdownRender={() => (
                      <div className={styles.downloadReportDropdown}>
                        <div className={styles.downloadReportDropdownHeader}>
                          {t("view_resume_in")}
                        </div>
                        {resumeDownloadMenuItems.map((item) => {
                          const selected = item.option === resumeViewLocale;
                          return (
                            <Button
                              key={item.option}
                              type="text"
                              block
                              className={classnames(
                                styles.downloadReportDropdownItem,
                                selected &&
                                  styles.downloadReportDropdownItemSelected,
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleResumeViewLocaleChange(item.option);
                              }}
                            >
                              <span
                                className={styles.downloadReportDropdownLabel}
                              >
                                {item.label}
                              </span>
                              <span
                                className={classnames(
                                  styles.downloadReportBadge,
                                  item.badge === "original"
                                    ? styles.downloadReportBadgeNative
                                    : styles.downloadReportBadgeAi,
                                )}
                              >
                                {item.badge === "original"
                                  ? t("download_resume_original")
                                  : t("download_report_ai_translated")}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  >
                    <div
                      className={classnames(
                        styles.resumeLanguageBtn,
                        resumeViewLocale !== "original" &&
                          styles.resumeLanguageBtnActive,
                      )}
                    >
                      <TranslationOutlined />
                    </div>
                  </Dropdown>
                </Tooltip>
                {resumeViewLoading ? (
                  <div className={styles.resumeViewLoadingWrap}>
                    <Spin />
                  </div>
                ) : resumeViewLocale !== "original" ? (
                  <MarkdownContainer
                    content={activeTranslatedResumeContent ?? ""}
                  />
                ) : resumeDetail?.contact_information ? (
                  <Resume resume={resumeDetail} />
                ) : (
                  <MarkdownContainer content={talent.parsed_content || ""} />
                )}
              </div>
              <div
                className={classnames(
                  styles.resumeCollapsedOverlay,
                  !resumeExpanded && styles.resumeCollapsedOverlayVisible,
                )}
                aria-hidden={resumeExpanded}
              >
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
              </div>
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
        <div className={styles.jobsAppliedHeader}>
          <span className={styles.jobsAppliedTitle}>{t("jobs_applied")}</span>
          <Dropdown menu={applicationsMenu}>
            <div className={styles.applicationsTrigger}>
              {originalT("talent_details.applications_count", {
                count: talentsOfCandidate.length,
              })}{" "}
              <DownOutlined className={styles.applicationsChevron} />
            </div>
          </Dropdown>
        </div>

        <div className={styles.jobsAppliedContent}>
          <div
            style={{
              borderRadius: "12px 12px 0 0",
              padding: "24px 20px",
              backgroundColor: "rgba(247, 249, 255, 1)",
              border: "1px solid rgba(227, 236, 249, 1)",
            }}
          >
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
              <Tooltip title="Open job">
                <Icon
                  icon={<Link2 />}
                  className={styles.jobTitleLinkIcon}
                  onClick={() =>
                    window.open(
                      `/app/jobs/${job.invitation_token}/standard-board`,
                      "_blank",
                    )
                  }
                />
              </Tooltip>
            </div>
            <div className={styles.metaLine}>
              {originalT("talent_details.applied_meta", {
                date: formatLastUpdated(talent.created_at),
                source: sourceChannelText,
              })}
            </div>

            <div className={styles.actionsRow}>
              <div className={styles.actionsRowLeft}>
                <Tooltip title="Move Stage">
                  <Dropdown
                    menu={{
                      items: stageMenuItems,
                      onClick: ({ key }) => handleMoveStageTo(key),
                    }}
                  >
                    <Button>
                      {currentStageName} <DownOutlined />
                    </Button>
                  </Dropdown>
                </Tooltip>
              </div>
              <div className={styles.actionsRowRight}>
                {false && scheduleButton}
                <Tooltip
                  title={
                    talent.status === "rejected"
                      ? "To restore this candidate, move them to another Stage"
                      : undefined
                  }
                >
                  <span>
                    <Button
                      danger
                      variant="outlined"
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
            </div>
          </div>

          <Tabs
            className={styles.tabsUnderline}
            activeKey={rightTab}
            onChange={(k) =>
              setRightTab(
                k as
                  | "interview_feedback"
                  | "notes"
                  | "activity"
                  | "assigned_recruiters",
              )
            }
            animated={{ inkBar: true, tabPane: false }}
            items={[
              {
                key: "interview_feedback",
                label: originalT("talent_details.tab_interview_feedback_count"),
                children: null,
              },
              {
                key: "notes",
                label: originalT("talent_details.tab_notes_count", {
                  count: notesCount,
                }),
                children: null,
              },
              {
                key: "activity",
                label: originalT("talent_details.tab_activity"),
                children: null,
              },
              {
                key: "assigned_recruiters",
                label: (
                  <span style={{ marginRight: 50 }}>
                    {originalT("talent_details.tab_assigned_recruiters")}
                  </span>
                ),
                children: null,
              },
            ]}
          />

          <div className={styles.rightTabScroll}>
            {rightTab === "interview_feedback" && (
              <div>
                <div
                  className={styles.round0Row}
                  onClick={() => setAiDrawerOpen(true)}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flex: 1,
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      className={styles.feedbackRoundTitle}
                      style={{ flex: "auto" }}
                    >
                      Round 0: AI Prescreening
                    </span>
                    <div
                      style={{
                        flex: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <EvaluateResultBadge
                        size="small"
                        result={getEvaluateResultLevel(report)}
                      />
                      <Dropdown
                        trigger={["hover"]}
                        placement="bottomRight"
                        dropdownRender={() => (
                          <div className={styles.downloadReportDropdown}>
                            <div
                              className={styles.downloadReportDropdownHeader}
                            >
                              Last updated:&nbsp;
                              {formatLastUpdated(
                                talent.evaluate_result_updated_at ??
                                  talent.created_at,
                              )}
                            </div>
                            <button
                              type="button"
                              className={styles.downloadReportDropdownItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadReportPdf("en");
                              }}
                            >
                              <span
                                className={styles.downloadReportDropdownLabel}
                              >
                                {t("download_report_english")}
                              </span>
                              <span
                                className={classnames(
                                  styles.downloadReportBadge,
                                  styles.downloadReportBadgeNative,
                                )}
                              >
                                {t("download_report_native")}
                              </span>
                            </button>
                            <button
                              type="button"
                              className={styles.downloadReportDropdownItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadReportPdf("zh");
                              }}
                            >
                              <span
                                className={styles.downloadReportDropdownLabel}
                              >
                                {t("download_report_chinese")}
                              </span>
                              <span
                                className={classnames(
                                  styles.downloadReportBadge,
                                  styles.downloadReportBadgeAi,
                                )}
                              >
                                {t("download_report_ai_translated")}
                              </span>
                            </button>
                          </div>
                        )}
                      >
                        <Icon
                          icon={<DownloadIcon />}
                          className={styles.iconBtn16}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        />
                      </Dropdown>
                      <div
                        style={{ borderLeft: "1px solid #ebecee", height: 12 }}
                      />
                      <Icon icon={<Right />} className={styles.iconBtnRight} />
                    </div>
                  </div>
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
                        <div className={styles.feedbackRoundHeaderRight}>
                          <span className={styles.feedbackRoundCount}>
                            {count}
                          </span>
                          {open ? (
                            <UpOutlined
                              className={styles.feedbackRoundChevron}
                            />
                          ) : (
                            <DownOutlined
                              className={styles.feedbackRoundChevron}
                            />
                          )}
                        </div>
                      </div>
                      {open && (
                        <div className={styles.feedbackRoundBody}>
                          <Button
                            block
                            variant="outlined"
                            color="primary"
                            className={styles.addFeedbackAboveList}
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddFeedbackForRound(round);
                            }}
                          >
                            + Add Feedback
                          </Button>
                          {[...round.feedback_records]
                            .sort(
                              (a, b) =>
                                dayjs(b.created_at).valueOf() -
                                dayjs(a.created_at).valueOf(),
                            )
                            .map((record) => (
                              <div
                                key={record.id}
                                className={styles.feedbackCard}
                              >
                                <div className={styles.feedbackCardMeta}>
                                  <span className={styles.feedbackAuthor}>
                                    {record.staff?.name || "-"}
                                  </span>
                                  <span className={styles.feedbackDate}>
                                    {formatLastUpdated(record.created_at)}
                                  </span>
                                </div>
                                <MarkdownContainer content={record.content} />
                                <div style={{ marginTop: 8 }}>
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
                      )}
                    </div>
                  );
                })}

                <Button
                  block
                  variant="outlined"
                  color="primary"
                  className={styles.newRoundButton}
                  onClick={openAddFeedbackForNewRound}
                  style={{ height: 40 }}
                >
                  {t("new_interview_round")}
                </Button>
              </div>
            )}

            {rightTab === "notes" && (
              <div>
                <Button
                  block
                  variant="outlined"
                  color="primary"
                  style={{ marginTop: 12, height: 40 }}
                  onClick={() => {
                    setNewNoteContent("");
                    setIsAddNoteModalOpen(true);
                  }}
                >
                  + Add Note
                </Button>
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
                        {formatLastUpdated(note.created_at)}
                      </span>
                    </div>
                    <MarkdownContainer content={note.content} />
                  </div>
                ))}
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
                              {formatLastUpdated(log.created_at, {
                                withTime: true,
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {rightTab === "assigned_recruiters" && (
              <AssignedRecruitersTab
                jobId={jobIdStr!}
                talentId={talent.id}
                talentRecruiters={talent.talent_recruiters ?? []}
                jobCollaborators={job.collaborators}
                onTalentRecruitersChange={(talentRecruiters) => {
                  updateTalent({ talent_recruiters: talentRecruiters });
                }}
              />
            )}
          </div>
        </div>
      </div>

      <Drawer
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>Round 0: AI Prescreening</div>
            <div>
              <EvaluateResultBadge
                withTitle
                result={getEvaluateResultLevel(report)}
              />
            </div>
          </div>
        }
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
              setSourceEvaluateFeedbackConversation("evaluate_feedback");
              setNeedConfirmEvaluateFeedbackConversation(false);
              setOpenEvaluateFeedbackConversation(true);
            }}
          />
        </div>
      </Drawer>

      <Modal
        title="Add Feedback"
        open={isAddFeedbackModalOpen}
        centered
        onCancel={closeAddFeedbackModal}
        onOk={() => submitAddFeedbackFromModal()}
        okText="Save"
        destroyOnClose
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
                autoFocus={true}
                style={{ maxHeight: 400 }}
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
            throw new Error("validation");
          }
          const { code } = await Post(
            `/api/jobs/${jobIdStr}/talents/${talentIdStr}/notes`,
            { content: newNoteContent.trim() },
          );
          if (code === 0) {
            message.success("Note added");
            setIsAddNoteModalOpen(false);
            setNewNoteContent("");
            void fetchTalentNotes();
            void fetchActiveLogs();
          }
        }}
        okText="Save"
        destroyOnClose
      >
        <div className={styles.addFeedbackModal}>
          <div className={styles.addFeedbackField}>
            <div className={styles.addFeedbackLabel}>Note</div>
            <div className={styles.addFeedbackContent}>
              <RichTextWithVoice
                value={newNoteContent}
                onChange={setNewNoteContent}
                minHeight={300}
                autoFocus={true}
                style={{ maxHeight: 400 }}
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
          candidateName={talent.name}
          evaluateResult={report}
          open={isRejectModalOpen}
          successMessage="Application Rejected"
          onOk={({ startCalibration }) => {
            setIsRejectModalOpen(false);
            fetchTalent();
            fetchActiveLogs();
            if (startCalibration) {
              setSourceEvaluateFeedbackConversation("reject_calibration");
              setNeedConfirmEvaluateFeedbackConversation(false);
              setOpenEvaluateFeedbackConversation(true);
            }
          }}
          onCancel={() => setIsRejectModalOpen(false)}
        />
      )}
      {/* Modal 内已 toast；onOk 再 toast 会重复，移除 onOk 内重复 */}
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
          source={sourceEvaluateFeedbackConversation}
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
