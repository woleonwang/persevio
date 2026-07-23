import { useCallback, useEffect, useRef, useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { Button, Checkbox, Input, Modal, Upload, message } from "antd";
import { useNavigate } from "react-router";

import percyHi from "@/assets/percy-hi.png";
import percyHiFace from "@/assets/percy-hi-face.png";
import PhoneWithCountryCode from "@/components/PhoneWithCountryCode";
import useAssemblyOffline from "@/hooks/useAssemblyOffline";
import { getCandidateSignupPath, getQuery, deleteQuery } from "@/utils";
import { isValidEmail } from "@/pages/candidate/signup-v2/utils";
import { isValidPhone } from "@/utils/phone";
import { Get, Post, PostFormData } from "@/utils/request";
import { tokenStorage } from "@/utils/storage";
import privacyAgreement from "@/utils/privacyAgreement";
import terms from "@/utils/terms";
import MarkdownContainer from "@/components/MarkdownContainer";

import { FIXED_COPY, MEETING_TOKEN_SESSION_KEY } from "./constants";
import {
  firstNameOf,
  getBriefSheetSections,
  getRoleOneLiner,
  getSnapshotFactChips,
  getSnapshotFactValue,
  getMessageActionTags,
  isSystemActionMessage,
  isVisibleChatMessage,
  logoMarkOf,
  parseBrief,
  parsePrepared,
  TBrief,
  TMeetingBootstrap,
  TMeetingMessage,
  TMeetingPrepared,
} from "./utils";
import styles from "./style.module.less";

type TSheet = "brief" | "putForward" | "whatsapp" | null;
type TComposerMode = "voice" | "text";

const ArrowRightIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
);

const MicIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <path d="M12 17v4" />
  </svg>
);

const KeyboardIcon = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <rect x="2" y="6" width="20" height="12" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

const ExternalIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

const BriefDocIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3682FE"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const WhatsappIcon = ({ size = 15 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const PutForwardIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m16 11 2 2 4-4" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

type TClaimReaction = "thats_right" | "not_quite";

const getAllClaims = (prepared: TMeetingPrepared | null): string[] => {
  if (!prepared || prepared.thin_profile) {
    return [];
  }
  return [
    ...(prepared.why_interested || []),
    ...(prepared.why_successful || []),
  ];
};

const buildClaimDraft = (
  reactions: Record<string, TClaimReaction>,
  claimsInOrder: string[],
): string => {
  return claimsInOrder
    .filter((claim) => reactions[claim])
    .map((claim) =>
      reactions[claim] === "thats_right"
        ? `That's right: ${claim}`
        : `Not quite: ${claim}`,
    )
    .join("\n");
};

const JobMeetingsPage: React.FC = () => {
  const navigate = useNavigate();
  const threadRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [bootstrap, setBootstrap] = useState<TMeetingBootstrap>();
  const [prepared, setPrepared] = useState<TMeetingPrepared | null>(null);
  const [brief, setBrief] = useState<TBrief | null>(null);
  const [messages, setMessages] = useState<TMeetingMessage[]>([]);
  const [isInvoking, setIsInvoking] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [activeSheet, setActiveSheet] = useState<TSheet>();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [resumePath, setResumePath] = useState("");
  const [countryCode, setCountryCode] = useState("+65");
  const [phone, setPhone] = useState("");
  const [sheetSubmitting, setSheetSubmitting] = useState(false);
  const [putForwardSubmitting, setPutForwardSubmitting] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [termsType, setTermsType] = useState<"terms" | "privacy">();
  const [preparedCascadeComplete, setPreparedCascadeComplete] = useState(false);
  const [composerMode, setComposerMode] = useState<TComposerMode>("voice");
  const handleSendRef = useRef<(content?: string) => Promise<void>>(
    async () => {},
  );

  const scrollThreadToBottom = useCallback(() => {
    if (!threadRef.current) {
      return;
    }
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, []);

  const resizeComposer = useCallback(() => {
    const el = composerRef.current;
    if (!el) {
      return;
    }
    el.style.height = "44px";
    el.style.height = `${Math.min(120, Math.max(44, el.scrollHeight))}px`;
  }, []);

  const fetchMessages = useCallback(async () => {
    const { code, data } = await Get<{
      messages: TMeetingMessage[];
      is_invoking: number;
    }>("/api/meeting/messages");
    if (code === 0) {
      setMessages(data.messages || []);
      setIsInvoking(data.is_invoking === 1);
    }
  }, []);

  useEffect(() => {
    if (!isInvoking) {
      return;
    }
    const intervalId = window.setInterval(() => {
      void fetchMessages();
    }, 2000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [isInvoking, fetchMessages]);

  const handleSend = useCallback(
    async (contentOverride?: string) => {
      const content = (contentOverride ?? draft).trim();
      if (!content || sending) {
        return;
      }
      setSending(true);
      if (!contentOverride) {
        setDraft("");
      }
      const { code } = await Post<{ is_invoking: number }>(
        "/api/meeting/messages/send",
        { content },
      );
      if (code !== 0) {
        setSending(false);
        message.error("Failed to send message");
        if (!contentOverride) {
          setDraft(content);
        }
        return;
      }
      setSending(false);
      await fetchMessages();
    },
    [draft, sending, fetchMessages],
  );

  handleSendRef.current = handleSend;

  const { startTranscription, endTranscription, isRecording, isTranscribing } =
    useAssemblyOffline({
      onFinish: (result) => {
        void handleSendRef.current(result);
      },
      disabled: sending,
      disableShortcuts: true,
    });

  const switchToTextMode = useCallback(() => {
    setComposerMode("text");
    requestAnimationFrame(() => {
      composerRef.current?.focus();
      resizeComposer();
    });
  }, [resizeComposer]);

  const switchToVoiceMode = useCallback(() => {
    setComposerMode("voice");
  }, []);

  useEffect(() => {
    resizeComposer();
  }, [draft, resizeComposer, composerMode]);

  useEffect(() => {
    void init();
  }, []);

  useEffect(() => {
    setPreparedCascadeComplete(false);
  }, [prepared]);

  useEffect(() => {
    scrollThreadToBottom();
  }, [messages, scrollThreadToBottom]);

  const redirectToSignup = (candidateToken: string, jobId: number) => {
    tokenStorage.setToken(candidateToken, "candidate");
    const path = getCandidateSignupPath(jobId);
    navigate(`${path}&candidate_token=${encodeURIComponent(candidateToken)}`, {
      replace: true,
    });
  };

  const init = async () => {
    const tokenFromQuery = getQuery("meeting_token")?.trim();
    if (tokenFromQuery) {
      sessionStorage.setItem(MEETING_TOKEN_SESSION_KEY, tokenFromQuery);
      deleteQuery("meeting_token");
    }
    const token = sessionStorage.getItem(MEETING_TOKEN_SESSION_KEY);
    if (!token) {
      setErrorText("This meeting link is missing a valid token.");
      setLoading(false);
      return;
    }

    try {
      const { code, data } = await Get<TMeetingBootstrap>(
        "/api/meeting/bootstrap",
      );
      if (code !== 0 || !data) {
        setErrorText(
          "Unable to open this meeting. Please ask your recruiter for a new link.",
        );
        setLoading(false);
        return;
      }

      if (
        data.redirect_to_prescreening &&
        data.candidate_token &&
        data.job?.id
      ) {
        redirectToSignup(data.candidate_token, data.job.id);
        return;
      }

      setBootstrap(data);
      setPrepared(parsePrepared(data.prepared));
      setBrief(parseBrief(data.brief));
      setName(data.linkedin_profile?.name || "");
      setResumePath(data.linkedin_profile?.resume_path || "");
      await fetchMessages();
      setLoading(false);
    } catch {
      setErrorText("Unable to open this meeting. Please try again later.");
      setLoading(false);
    }
  };

  const [claimReactions, setClaimReactions] = useState<
    Record<string, TClaimReaction>
  >({});

  const handleClaim = (claim: string, reaction: TClaimReaction) => {
    const nextReactions = { ...claimReactions };
    if (nextReactions[claim] === reaction) {
      delete nextReactions[claim];
    } else {
      nextReactions[claim] = reaction;
    }
    setClaimReactions(nextReactions);
    setDraft(buildClaimDraft(nextReactions, getAllClaims(prepared)));
    setComposerMode("text");
    requestAnimationFrame(() => {
      composerRef.current?.focus();
      resizeComposer();
    });
  };

  const handleNotForMe = async () => {
    await handleSend(FIXED_COPY.notForMeMessage);
  };

  const openPutForwardSheet = () => {
    setAcceptedTerms(false);
    setActiveSheet("putForward");
  };

  const handlePutForwardResumeUpload = async (file: File) => {
    setResumeUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await PostFormData<{ resume: string }>(
      "/api/upload_resume_to_oss",
      formData,
    );
    setResumeUploading(false);
    if (uploadRes.code !== 0 || !uploadRes.data?.resume) {
      message.error("Upload failed");
      return false;
    }
    setResumePath(uploadRes.data.resume);
    message.success("Resume attached");
    return false;
  };

  const handleBindWhatsapp = async () => {
    if (!isValidPhone(countryCode, phone)) {
      message.warning("Please check your WhatsApp number");
      return;
    }
    if (!acceptedTerms) {
      message.warning("Please agree to the terms");
      return;
    }
    setSheetSubmitting(true);
    const { code } = await Post("/api/meeting/whatsapp", {
      country_code: countryCode,
      phone_number: phone,
    });
    setSheetSubmitting(false);
    if (code !== 0) {
      message.error("Failed to connect WhatsApp");
      return;
    }
    message.success("WhatsApp connected");
    setBootstrap((prev) =>
      prev
        ? {
            ...prev,
            linkedin_profile: {
              ...prev.linkedin_profile,
              whatsapp_contact_number: `${countryCode}${phone}`,
            },
          }
        : prev,
    );
    setAcceptedTerms(false);
    setActiveSheet(null);
  };

  const handlePutForward = async () => {
    if (!acceptedTerms) {
      message.warning("Please agree to the terms");
      return;
    }
    const needsEmail = !bootstrap?.linkedin_profile?.candidate_id;
    if (needsEmail && !isValidEmail(email)) {
      message.warning("Please enter a valid email");
      return;
    }
    setPutForwardSubmitting(true);
    const { code, data } = await Post<{
      candidate_token: string;
      job_apply_id: number;
      candidate_id: number;
    }>("/api/meeting/put_forward", {
      email: email.trim() || undefined,
      name: name.trim() || undefined,
      resume_path: resumePath || undefined,
    });
    setPutForwardSubmitting(false);
    if (code !== 0 || !data?.candidate_token || !bootstrap?.job?.id) {
      message.error("Failed to put you forward");
      return;
    }
    redirectToSignup(data.candidate_token, bootstrap.job.id);
  };

  if (loading) {
    return <div className={styles.loadingState}>{FIXED_COPY.loading}</div>;
  }

  if (errorText) {
    return <div className={styles.errorState}>{errorText}</div>;
  }

  if (!bootstrap) {
    return (
      <div className={styles.errorState}>{FIXED_COPY.meetingNotFound}</div>
    );
  }

  const candidateName = firstNameOf(bootstrap.linkedin_profile?.name);
  const whatsappBound = !!bootstrap.linkedin_profile?.whatsapp_contact_number;
  const visibleMessages = messages.filter(isVisibleChatMessage);
  const roleOneLiner = getRoleOneLiner(brief);
  const factChips = getSnapshotFactChips(brief);
  const displayJobName =
    bootstrap.job.name || getSnapshotFactValue(brief, "Role") || "This role";
  const displayCompanyName =
    bootstrap.job.company_name || getSnapshotFactValue(brief, "Company");
  const companyMark = logoMarkOf(displayCompanyName);
  const briefOpen = activeSheet === "brief";

  if (showSplash) {
    return (
      <div className={styles.splash} onClick={() => setShowSplash(false)}>
        <div className={styles.splashContent}>
          <img src={percyHi} alt="Percy waving" className={styles.splashWave} />
          <div className={styles.splashEyebrow}>{FIXED_COPY.splashEyebrow}</div>
          <div className={styles.splashTitle}>
            {FIXED_COPY.splashTitle.replace("{name}", candidateName)}
          </div>
          <div className={styles.splashBody}>
            {FIXED_COPY.splashBody.replace("{jobName}", bootstrap.job.name)}
          </div>
          <div className={styles.splashHint}>{FIXED_COPY.splashCta}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div
        className={`${styles.screen} ${briefOpen ? styles.screenBriefOpen : ""}`}
      >
        <div className={styles.chatColumn}>
          <header className={styles.header}>
            <div className={styles.headerInner}>
              <img
                src={percyHiFace}
                alt="Percy"
                className={styles.headerAvatar}
              />
              <div className={styles.headerMeta}>
                <div className={styles.headerTitleRow}>
                  <span className={styles.headerName}>
                    {FIXED_COPY.headerName}
                  </span>
                  <button
                    type="button"
                    className={styles.whoBtn}
                    aria-label={FIXED_COPY.whoIsPercyAria}
                  >
                    ?
                  </button>
                </div>
                <div className={styles.headerSub}>
                  <span className={styles.headerDot} />
                  {FIXED_COPY.headerSub}
                </div>
              </div>
              <button
                type="button"
                className={`${styles.waHeaderBtn} ${
                  whatsappBound ? styles.waHeaderBtnBound : ""
                }`}
                onClick={() => {
                  setAcceptedTerms(false);
                  setActiveSheet("whatsapp");
                }}
              >
                <WhatsappIcon size={15} />
                {FIXED_COPY.whatsappHeaderCta}
              </button>
            </div>
          </header>

          <div className={styles.roleBar}>
            <div className={styles.roleBarInner}>
              <span className={styles.logoMark}>{companyMark}</span>
              <button
                type="button"
                className={styles.roleTitleBtn}
                onClick={() => setActiveSheet("brief")}
              >
                <span className={styles.roleTitle}>
                  {displayJobName}
                  <ExternalIcon />
                </span>
                {displayCompanyName ? (
                  <span className={styles.roleCompany}>
                    {displayCompanyName}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                className={styles.roleBarNotForMe}
                onClick={() => void handleNotForMe()}
              >
                <CloseIcon />
                {FIXED_COPY.notForMeCta}
              </button>
              <button
                type="button"
                className={styles.roleBarCta}
                onClick={openPutForwardSheet}
              >
                {FIXED_COPY.putForwardCta}
                <ArrowRightIcon />
              </button>
            </div>
          </div>

          <div className={styles.main}>
            <div className={styles.thread} ref={threadRef}>
              <div className={styles.threadInner}>
                <div className={styles.preparedDivider}>
                  <span className={styles.preparedDividerLine} />
                  <span className={styles.preparedDividerText}>
                    {FIXED_COPY.preparedDivider}
                  </span>
                  <span className={styles.preparedDividerLine} />
                </div>

                <PreparedCascade
                  candidateName={candidateName}
                  jobName={displayJobName}
                  companyName={displayCompanyName}
                  roleOneLiner={roleOneLiner}
                  factChips={factChips}
                  companyMark={companyMark}
                  prepared={prepared}
                  claimReactions={claimReactions}
                  onClaim={handleClaim}
                  onOpenBrief={() => setActiveSheet("brief")}
                  onPutForward={openPutForwardSheet}
                  onNotForMe={() => void handleNotForMe()}
                  onCascadeComplete={() => setPreparedCascadeComplete(true)}
                />

                {preparedCascadeComplete
                  ? visibleMessages.map((msg) => {
                      if (isSystemActionMessage(msg)) {
                        const tags = getMessageActionTags(msg);
                        return (
                          <div key={msg.id} className={styles.msgRow}>
                            <span className={styles.msgGutter} />
                            <div className={styles.msgCol}>
                              {tags.includes("open_put_forward") ? (
                                <div className={styles.jobActionsRow}>
                                  <button
                                    type="button"
                                    className={styles.jobPutForwardBtn}
                                    onClick={openPutForwardSheet}
                                  >
                                    <PutForwardIcon />
                                    {FIXED_COPY.putForwardCta}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      }

                      const isUser = msg.content.role === "user";
                      if (isUser) {
                        return (
                          <div
                            key={msg.id}
                            className={`${styles.msgRow} ${styles.msgRowUser}`}
                          >
                            <div className={styles.bubbleUser}>
                              {msg.content.content}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <AssistantMessage key={msg.id} showAvatar>
                          {msg.content.content}
                        </AssistantMessage>
                      );
                    })
                  : null}
              </div>
            </div>

            <div className={styles.composer}>
              <div
                className={`${styles.composerInner} ${
                  composerMode === "voice" && !isRecording && !isTranscribing
                    ? styles.composerInnerVoiceIdle
                    : ""
                } ${isRecording || isTranscribing ? styles.composerInnerListening : ""}`}
              >
                {composerMode === "text" ? (
                  <>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={FIXED_COPY.useVoiceAria}
                      disabled={sending}
                      onClick={switchToVoiceMode}
                    >
                      <MicIcon size={18} />
                    </button>
                    <textarea
                      ref={composerRef}
                      className={styles.composerInput}
                      value={draft}
                      rows={1}
                      placeholder={FIXED_COPY.composerPlaceholder}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className={styles.sendBtn}
                      disabled={!draft.trim() || sending}
                      aria-label="Send"
                      onClick={() => void handleSend()}
                    >
                      <ArrowUpIcon />
                    </button>
                  </>
                ) : isRecording || isTranscribing ? (
                  <div className={styles.voiceListeningPanel}>
                    <span className={styles.voiceListeningMic}>
                      {isTranscribing ? (
                        <LoadingOutlined
                          spin
                          style={{ fontSize: 18, color: "#fff" }}
                        />
                      ) : (
                        <MicIcon size={18} />
                      )}
                    </span>
                    <div className={styles.voiceListeningCopy}>
                      <div className={styles.voiceListeningTitle}>
                        {isTranscribing
                          ? FIXED_COPY.voiceProcessingTitle
                          : FIXED_COPY.voiceListeningTitle}
                      </div>
                    </div>
                    {isRecording ? (
                      <button
                        type="button"
                        className={styles.voiceStopBtn}
                        onClick={endTranscription}
                      >
                        {FIXED_COPY.voiceStopCta}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className={styles.voiceTalkBtn}
                      disabled={sending}
                      onClick={startTranscription}
                    >
                      <MicIcon size={19} />
                      {FIXED_COPY.voiceTalkCta}
                    </button>
                    <button
                      type="button"
                      className={styles.keyboardBtn}
                      aria-label={FIXED_COPY.typeInsteadAria}
                      disabled={sending}
                      onClick={switchToTextMode}
                    >
                      <KeyboardIcon />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {briefOpen ? (
          <>
            <div
              className={styles.briefBackdropMobile}
              onClick={() => setActiveSheet(null)}
            />
            <BriefPanel
              companyMark={companyMark}
              displayJobName={displayJobName}
              displayCompanyName={displayCompanyName}
              brief={brief}
              onClose={() => setActiveSheet(null)}
              onPutForward={openPutForwardSheet}
              onNotForMe={() => {
                setActiveSheet(null);
                void handleNotForMe();
              }}
            />
          </>
        ) : null}
      </div>

      {activeSheet === "putForward" ? (
        <>
          <div
            className={styles.sheetBackdrop}
            onClick={() => setActiveSheet(null)}
          />
          <div className={styles.sheetPanel}>
            <div className={styles.sheetForm}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src={percyHiFace}
                  alt="Percy"
                  className={styles.headerAvatar}
                  style={{ width: 32, height: 32 }}
                />
                <div style={{ flex: 1, fontWeight: 700, fontSize: 20 }}>
                  {FIXED_COPY.putForwardTitle}
                </div>
                <button
                  type="button"
                  className={styles.sheetCloseBtn}
                  aria-label="Close"
                  onClick={() => setActiveSheet(null)}
                >
                  <CloseIcon />
                </button>
              </div>
              <div className={styles.sheetHint}>
                {FIXED_COPY.putForwardIntro}
              </div>
              <label className={styles.sheetFieldLabel}>
                {FIXED_COPY.putForwardEmailLabel}
                <Input
                  className={styles.sheetInput}
                  placeholder={FIXED_COPY.putForwardEmailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <div className={styles.putForwardResumeBox}>
                <Upload
                  accept=".pdf,.doc,.docx"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    void handlePutForwardResumeUpload(file);
                    return false;
                  }}
                >
                  <Button loading={resumeUploading} disabled={putForwardSubmitting}>
                    {FIXED_COPY.putForwardAttachResumeCta}
                  </Button>
                </Upload>
                <div className={styles.putForwardResumeHint}>
                  {FIXED_COPY.putForwardAttachResumeHint}
                </div>
              </div>
              <TermsCheckbox
                variant="putForward"
                checked={acceptedTerms}
                onChange={setAcceptedTerms}
                onOpen={(type) => setTermsType(type)}
              />
              <button
                type="button"
                className={styles.sheetPrimaryBtn}
                disabled={putForwardSubmitting || resumeUploading}
                onClick={() => void handlePutForward()}
              >
                {putForwardSubmitting ? (
                  <LoadingOutlined spin style={{ fontSize: 16 }} />
                ) : null}
                {FIXED_COPY.putForwardCta}
                {!putForwardSubmitting ? <ArrowRightIcon /> : null}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {activeSheet === "whatsapp" ? (
        <>
          <div
            className={styles.sheetBackdrop}
            onClick={() => setActiveSheet(null)}
          />
          <div className={styles.whatsappPanel}>
            <div className={styles.sheetForm}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, fontWeight: 700, fontSize: 20 }}>
                  {FIXED_COPY.whatsappSheetTitle}
                </div>
                <button
                  type="button"
                  className={styles.sheetCloseBtn}
                  aria-label="Close"
                  onClick={() => setActiveSheet(null)}
                >
                  <CloseIcon />
                </button>
              </div>
              <div className={styles.sheetHint}>
                {FIXED_COPY.whatsappSheetIntro}
              </div>
              <label className={styles.sheetFieldLabel}>
                {FIXED_COPY.whatsappNumberLabel}
                <PhoneWithCountryCode
                  value={{ countryCode, phoneNumber: phone }}
                  onChange={(value) => {
                    if (value.countryCode) {
                      setCountryCode(value.countryCode);
                    }
                    if (value.phoneNumber !== undefined) {
                      setPhone(value.phoneNumber);
                    }
                  }}
                />
              </label>
              <TermsCheckbox
                variant="whatsapp"
                checked={acceptedTerms}
                onChange={setAcceptedTerms}
                onOpen={(type) => setTermsType(type)}
              />
              <button
                type="button"
                className={styles.sheetPrimaryBtn}
                disabled={sheetSubmitting}
                onClick={() => void handleBindWhatsapp()}
              >
                {FIXED_COPY.whatsappSubmitCta}
              </button>
            </div>
          </div>
        </>
      ) : null}

      <Modal
        open={!!termsType}
        onCancel={() => setTermsType(undefined)}
        footer={null}
        width={720}
        title={termsType === "privacy" ? "Privacy Policy" : "Terms of Service"}
      >
        <MarkdownContainer
          content={termsType === "privacy" ? privacyAgreement : terms}
        />
      </Modal>
    </div>
  );
};

const AssistantMessage: React.FC<{
  showAvatar?: boolean;
  label?: string;
  children: React.ReactNode;
}> = ({ showAvatar = true, label = "PERCY", children }) => (
  <div className={styles.msgRow}>
    {showAvatar ? (
      <img
        src={percyHiFace}
        alt="Percy"
        className={styles.headerAvatar}
        style={{ width: 30, height: 30 }}
      />
    ) : (
      <span className={styles.msgGutter} />
    )}
    <div className={styles.msgCol}>
      {showAvatar ? <span className={styles.msgLabel}>{label}</span> : null}
      <div className={styles.bubbleAssistant}>{children}</div>
    </div>
  </div>
);

const PREPARED_STEP_DELAY_MS = 500;

type TPreparedStep =
  | "greeting"
  | "groundRules"
  | "roleBlock"
  | "thinNote"
  | "whyInterested"
  | "whySuccessful"
  | "couldntTell"
  | "theAsk";

const getPreparedSteps = (
  thin: boolean,
  prepared: TMeetingPrepared | null,
): TPreparedStep[] => {
  const steps: TPreparedStep[] = ["greeting", "groundRules", "roleBlock"];
  if (thin) {
    steps.push("thinNote", "theAsk");
    return steps;
  }
  if (prepared?.why_interested?.length) {
    steps.push("whyInterested");
  }
  if (prepared?.why_successful?.length) {
    steps.push("whySuccessful");
  }
  if (prepared?.couldnt_tell?.length) {
    steps.push("couldntTell");
  }
  steps.push("theAsk");
  return steps;
};

const PreparedCascade: React.FC<{
  candidateName: string;
  jobName: string;
  companyName: string;
  roleOneLiner: string;
  factChips: string[];
  companyMark: string;
  prepared: TMeetingPrepared | null;
  claimReactions: Record<string, "thats_right" | "not_quite">;
  onClaim: (claim: string, reaction: "thats_right" | "not_quite") => void;
  onOpenBrief: () => void;
  onPutForward: () => void;
  onNotForMe: () => void;
  onCascadeComplete: () => void;
}> = ({
  candidateName,
  jobName,
  companyName,
  roleOneLiner,
  factChips,
  companyMark,
  prepared,
  claimReactions,
  onClaim,
  onOpenBrief,
  onPutForward,
  onNotForMe,
  onCascadeComplete,
}) => {
  const thin = !!prepared?.thin_profile;
  const steps = getPreparedSteps(thin, prepared);
  const totalSteps = steps.length;
  const [revealedStep, setRevealedStep] = useState(1);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      setRevealedStep(totalSteps);
      return;
    }

    setRevealedStep(1);
    const timers = [];
    for (let step = 2; step <= totalSteps; step += 1) {
      timers.push(
        window.setTimeout(
          () => setRevealedStep(step),
          (step - 1) * PREPARED_STEP_DELAY_MS,
        ),
      );
    }
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [totalSteps]);

  useEffect(() => {
    if (revealedStep >= totalSteps) {
      onCascadeComplete();
    }
  }, [revealedStep, totalSteps, onCascadeComplete]);

  const isStepVisible = (step: TPreparedStep) => {
    const index = steps.indexOf(step);
    return index >= 0 && revealedStep >= index + 1;
  };

  return (
    <>
      {isStepVisible("greeting") ? (
        <AssistantMessage>
          {FIXED_COPY.greetingLead.replace("{name}", candidateName)}{" "}
          <span className={styles.highlight}>{jobName}</span>{" "}
          {FIXED_COPY.greetingTail}
        </AssistantMessage>
      ) : null}

      {isStepVisible("groundRules") ? (
        <AssistantMessage showAvatar={false}>
          {FIXED_COPY.groundRulesBody}
        </AssistantMessage>
      ) : null}

      {isStepVisible("roleBlock") ? (
        <>
          <AssistantMessage>
            {FIXED_COPY.roleIntroLead}{" "}
            <span className={styles.highlight}>
              {FIXED_COPY.roleIntroHighlight}
            </span>
            .
          </AssistantMessage>

          <div className={styles.msgRow}>
            <span className={styles.msgGutter} />
            <div className={styles.msgCol}>
              <div className={styles.roleCard}>
                <div className={styles.roleCardHead}>
                  <span className={styles.roleCardLogo}>{companyMark}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className={styles.roleCardJob}>{jobName}</div>
                    {companyName ? (
                      <div className={styles.roleCardCompany}>
                        {companyName}
                      </div>
                    ) : null}
                  </div>
                </div>
                {roleOneLiner ? (
                  <div className={styles.roleCardBody}>{roleOneLiner}</div>
                ) : null}
                {factChips.length ? (
                  <div
                    className={styles.roleCardBody}
                    style={{ paddingTop: roleOneLiner ? 0 : 12 }}
                  >
                    <div className={styles.factChips}>
                      {factChips.map((chip) => (
                        <span key={chip} className={styles.factChip}>
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                <button
                  type="button"
                  className={styles.briefOpenBtn}
                  onClick={onOpenBrief}
                >
                  <BriefDocIcon />
                  <span style={{ flex: 1 }}>
                    <span className={styles.briefOpenBtnTitle}>
                      {FIXED_COPY.briefOpenTitle}
                    </span>
                    <span className={styles.briefOpenBtnSub}>
                      {FIXED_COPY.briefOpenSub}
                    </span>
                  </span>
                  <ChevronRightIcon />
                </button>
              </div>
              <div className={styles.jobActionsRow}>
                <button
                  type="button"
                  className={styles.jobPutForwardBtn}
                  onClick={onPutForward}
                >
                  <PutForwardIcon />
                  {FIXED_COPY.putForwardCta}
                </button>
                <button
                  type="button"
                  className={styles.jobNotForMeBtn}
                  onClick={onNotForMe}
                >
                  <CloseIcon />
                  {FIXED_COPY.notForMeCta}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {isStepVisible("thinNote") ? (
        <AssistantMessage>{FIXED_COPY.thinProfileNote}</AssistantMessage>
      ) : null}

      {isStepVisible("whyInterested") ? (
        <>
          <AssistantMessage>
            {FIXED_COPY.whyInterestedLead}{" "}
            <span className={styles.highlight}>
              {FIXED_COPY.whyInterestedHighlight}
            </span>
            .{` ${FIXED_COPY.whyInterestedTail}`}
          </AssistantMessage>
          <ClaimList
            claims={prepared?.why_interested || []}
            claimReactions={claimReactions}
            onClaim={onClaim}
          />
        </>
      ) : null}

      {isStepVisible("whySuccessful") ? (
        <>
          <AssistantMessage>
            {FIXED_COPY.whySuccessfulLead}{" "}
            <span className={styles.highlight}>
              {FIXED_COPY.whySuccessfulHighlight}
            </span>
            , {FIXED_COPY.whySuccessfulTail}
          </AssistantMessage>
          <ClaimList
            claims={prepared?.why_successful || []}
            claimReactions={claimReactions}
            onClaim={onClaim}
          />
        </>
      ) : null}

      {isStepVisible("couldntTell") ? (
        <AssistantMessage>
          <div style={{ marginBottom: 10 }}>
            {FIXED_COPY.couldntTellLead}{" "}
            <span className={styles.highlight}>
              {FIXED_COPY.couldntTellHighlight}
            </span>{" "}
            {FIXED_COPY.couldntTellTail}
          </div>
          {prepared?.couldnt_tell?.map((item) => (
            <div key={item} className={styles.bulletListItem}>
              <span className={styles.bulletMark} />
              <span style={{ flex: 1 }}>{item}</span>
            </div>
          ))}
        </AssistantMessage>
      ) : null}

      {isStepVisible("theAsk") ? (
        <AssistantMessage>{FIXED_COPY.theAskBody}</AssistantMessage>
      ) : null}
    </>
  );
};

const ClaimList: React.FC<{
  claims: string[];
  claimReactions: Record<string, "thats_right" | "not_quite">;
  onClaim: (claim: string, reaction: "thats_right" | "not_quite") => void;
}> = ({ claims, claimReactions, onClaim }) => (
  <div className={styles.msgRow}>
    <span className={styles.msgGutter} />
    <div className={styles.msgCol}>
      <div className={styles.claimWrap}>
        {claims.map((claim) => {
          const reaction = claimReactions[claim];
          return (
            <div key={claim} className={styles.claimItem}>
              <div className={styles.claimHead}>
                <span className={styles.bulletMark} />
                <p className={styles.claimText}>{claim}</p>
              </div>
              <div className={styles.claimActions}>
                <button
                  type="button"
                  className={`${styles.claimBtn} ${
                    reaction === "thats_right" ? styles.claimBtnSelected : ""
                  }`}
                  onClick={() => onClaim(claim, "thats_right")}
                >
                  <CheckIcon />
                  {FIXED_COPY.claimRight}
                </button>
                <button
                  type="button"
                  className={`${styles.claimBtn} ${
                    reaction === "not_quite" ? styles.claimBtnSelected : ""
                  }`}
                  onClick={() => onClaim(claim, "not_quite")}
                >
                  <CloseIcon />
                  {FIXED_COPY.claimNotQuite}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const BriefPanel: React.FC<{
  companyMark: string;
  displayJobName: string;
  displayCompanyName: string;
  brief: TBrief | null;
  onClose: () => void;
  onPutForward: () => void;
  onNotForMe: () => void;
}> = ({
  companyMark,
  displayJobName,
  displayCompanyName,
  brief,
  onClose,
  onPutForward,
  onNotForMe,
}) => (
  <div
    className={styles.briefPane}
    onClick={(e) => {
      e.stopPropagation();
    }}
  >
    <div className={styles.sheetHeader}>
      <div className={styles.sheetHeaderTop}>
        <span className={styles.logoMark}>{companyMark}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.sheetTitle}>{FIXED_COPY.briefSheetTitle}</div>
          <div className={styles.sheetSubtitle}>
            {displayJobName}
            {displayCompanyName ? ` · ${displayCompanyName}` : ""}
          </div>
        </div>
        <button
          type="button"
          className={styles.sheetCloseBtn}
          aria-label="Close"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>
      <div className={styles.sheetActions}>
        <button
          type="button"
          className={styles.briefPutForwardBtn}
          onClick={onPutForward}
        >
          <PutForwardIcon />
          {FIXED_COPY.putForwardCta}
        </button>
        <button
          type="button"
          className={styles.briefNotForMeBtn}
          onClick={onNotForMe}
        >
          <CloseIcon />
          {FIXED_COPY.notForMeCta}
        </button>
      </div>
    </div>
    <div className={styles.briefPaneScroll}>
      <div className={styles.sheetBody}>
        <BriefContent brief={brief} />
      </div>
    </div>
  </div>
);

const BriefContent: React.FC<{
  brief: TBrief | null;
}> = ({ brief }) => {
  if (!brief) {
    return <div className={styles.sheetHint}>{FIXED_COPY.briefEmpty}</div>;
  }

  const sections = getBriefSheetSections(brief);
  if (!sections.length) {
    return <div className={styles.sheetHint}>{FIXED_COPY.briefEmpty}</div>;
  }

  return (
    <>
      {sections.map((section, index) => (
        <div
          key={`${section.number}-${section.title}`}
          className={`${styles.briefBlock} ${
            index === 0 ? styles.briefBlockFirst : ""
          }`}
        >
          <div className={styles.briefBlockHead}>
            <span className={styles.briefBlockNumber}>{section.number}</span>
            <h4 className={styles.briefBlockTitle}>{section.title}</h4>
          </div>
          <div className={styles.briefBlockBody}>
            {section.body ? <MarkdownContainer content={section.body} /> : null}
            {section.bullets?.length ? (
              <div className={styles.briefBulletList}>
                {section.bullets.map((item) => (
                  <div key={item} className={styles.briefBulletItem}>
                    <span className={styles.bulletMark} />
                    <span className={styles.briefBulletText}>{item}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}
      <div className={styles.briefFootNoteMobile}>
        {FIXED_COPY.briefFootNoteMobile}
      </div>
      <div className={styles.briefFootNoteDesktop}>
        {FIXED_COPY.briefFootNoteDesktop}
      </div>
    </>
  );
};

const TermsCheckbox: React.FC<{
  variant: "putForward" | "whatsapp";
  checked: boolean;
  onChange: (checked: boolean) => void;
  onOpen: (type: "terms" | "privacy") => void;
}> = ({ variant, checked, onChange, onOpen }) => {
  const suffix =
    variant === "whatsapp"
      ? FIXED_COPY.whatsappTermsSuffix
      : FIXED_COPY.putForwardTermsSuffix;

  return (
    <label className={styles.termsCheckbox}>
      <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)}>
        I agree to the{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onOpen("terms");
          }}
        >
          {FIXED_COPY.termsLinkText}
        </a>
        {suffix}
      </Checkbox>
    </label>
  );
};

export default JobMeetingsPage;
