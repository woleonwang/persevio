import { useEffect, useRef, useState } from "react";
import { Button, Checkbox, Drawer, Input, Modal, Upload, message } from "antd";
import { useNavigate } from "react-router";

import PhoneWithCountryCode from "@/components/PhoneWithCountryCode";
import { getCandidateSignupPath, getQuery, deleteQuery } from "@/utils";
import { isValidEmail } from "@/pages/candidate/signup-v2/utils";
import { isValidPhone } from "@/utils/phone";
import { Get, Post, PostFormData } from "@/utils/request";
import { tokenStorage } from "@/utils/storage";
import privacyAgreement from "@/utils/privacyAgreement";
import terms from "@/utils/terms";
import MarkdownContainer from "@/components/MarkdownContainer";

import { CLAIM_HEADERS, FIXED_COPY, MEETING_TOKEN_SESSION_KEY } from "./constants";
import {
  firstNameOf,
  getMessageActionTags,
  isSystemActionMessage,
  isVisibleChatMessage,
  parseBrief,
  parsePrepared,
  TMeetingBootstrap,
  TMeetingMessage,
  TMeetingPrepared,
} from "./utils";
import styles from "./style.module.less";

type TSheet = "brief" | "putForward" | "resume" | "whatsapp" | null;

const JobMeetingsPage: React.FC = () => {
  const navigate = useNavigate();
  const threadRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [bootstrap, setBootstrap] = useState<TMeetingBootstrap>();
  const [prepared, setPrepared] = useState<TMeetingPrepared | null>(null);
  const [brief, setBrief] = useState<Record<string, unknown> | string | null>(null);
  const [messages, setMessages] = useState<TMeetingMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [activeSheet, setActiveSheet] = useState<TSheet>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [resumePath, setResumePath] = useState("");
  const [countryCode, setCountryCode] = useState("+65");
  const [phone, setPhone] = useState("");
  const [sheetSubmitting, setSheetSubmitting] = useState(false);
  const [termsType, setTermsType] = useState<"terms" | "privacy">();

  useEffect(() => {
    void init();
  }, []);

  useEffect(() => {
    if (!threadRef.current) {
      return;
    }
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, showSplash, prepared]);

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
      const { code, data } = await Get<TMeetingBootstrap>("/api/meeting/bootstrap");
      if (code !== 0 || !data) {
        setErrorText("Unable to open this meeting. Please ask your recruiter for a new link.");
        setLoading(false);
        return;
      }

      if (data.redirect_to_prescreening && data.candidate_token && data.job?.id) {
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

  const fetchMessages = async () => {
    const { code, data } = await Get<{ messages: TMeetingMessage[] }>(
      "/api/meeting/messages",
    );
    if (code === 0) {
      setMessages(data.messages || []);
    }
  };

  const appendClaimToDraft = (claim: string, reaction: "thats_right" | "not_quite") => {
    const prefix =
      reaction === "thats_right"
        ? `That's right: ${claim}`
        : `Not quite: ${claim}`;
    setDraft((prev) => {
      const next = prev.trim() ? `${prev.trim()}\n${prefix}` : prefix;
      return next;
    });
  };

  const handleSend = async (contentOverride?: string) => {
    const content = (contentOverride ?? draft).trim();
    if (!content || sending) {
      return;
    }
    setSending(true);
    if (!contentOverride) {
      setDraft("");
    }
    const { code } = await Post<{
      message: TMeetingMessage;
      system_messages?: TMeetingMessage[];
    }>("/api/meeting/messages/send", { content });
    setSending(false);
    if (code !== 0) {
      message.error("Failed to send message");
      if (!contentOverride) {
        setDraft(content);
      }
      return;
    }
    await fetchMessages();
  };

  const handleNotForMe = async () => {
    await handleSend(FIXED_COPY.notForMeMessage);
  };

  const handleUploadResume = async (file: File) => {
    setSheetSubmitting(true);
    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await PostFormData<{ resume: string }>(
      "/api/upload_resume_to_oss",
      formData,
    );
    if (uploadRes.code !== 0 || !uploadRes.data?.resume) {
      setSheetSubmitting(false);
      message.error("Upload failed");
      return false;
    }
    const { code } = await Post("/api/meeting/resume", {
      type: "oss",
      resume_path: uploadRes.data.resume,
    });
    setSheetSubmitting(false);
    if (code !== 0) {
      message.error("Failed to save resume");
      return false;
    }
    setResumePath(uploadRes.data.resume);
    message.success("Resume uploaded");
    setActiveSheet(null);
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
    setSheetSubmitting(true);
    const { code, data } = await Post<{
      candidate_token: string;
      job_apply_id: number;
      candidate_id: number;
    }>("/api/meeting/put_forward", {
      email: email.trim() || undefined,
      name: name.trim() || undefined,
      resume_path: resumePath || undefined,
    });
    setSheetSubmitting(false);
    if (code !== 0 || !data?.candidate_token || !bootstrap?.job?.id) {
      message.error("Failed to put you forward");
      return;
    }
    redirectToSignup(data.candidate_token, bootstrap.job.id);
  };

  if (loading) {
    return <div className={styles.loadingState}>Opening your meeting…</div>;
  }

  if (errorText) {
    return <div className={styles.errorState}>{errorText}</div>;
  }

  if (!bootstrap) {
    return <div className={styles.errorState}>Meeting not found.</div>;
  }

  const candidateName = firstNameOf(bootstrap.linkedin_profile?.name);
  const whatsappBound = !!bootstrap.linkedin_profile?.whatsapp_contact_number;
  const visibleMessages = messages.filter(isVisibleChatMessage);

  if (showSplash) {
    return (
      <div className={styles.splash}>
        <div className={styles.splashAvatar}>P</div>
        <div className={styles.splashTitle}>{FIXED_COPY.splashTitle}</div>
        <div className={styles.splashSubtitle}>{FIXED_COPY.splashSubtitle}</div>
        <div className={styles.splashHello}>
          {FIXED_COPY.greetingTitle.replace("{name}", candidateName)}
        </div>
        <button
          type="button"
          className={styles.splashCta}
          onClick={() => setShowSplash(false)}
        >
          {FIXED_COPY.splashCta}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerName}>Percy</div>
          <div className={styles.headerRole}>
            {bootstrap.job.name}
            {bootstrap.job.company_name ? ` · ${bootstrap.job.company_name}` : ""}
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={() => {
              setAcceptedTerms(false);
              setActiveSheet("whatsapp");
            }}
          >
            {whatsappBound ? FIXED_COPY.whatsappBound : FIXED_COPY.whatsappCta}
          </button>
          <button
            type="button"
            className={styles.dangerGhostBtn}
            onClick={() => void handleNotForMe()}
          >
            {FIXED_COPY.notForMeCta}
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              setAcceptedTerms(false);
              setActiveSheet("putForward");
            }}
          >
            {FIXED_COPY.putForwardCta}
          </button>
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.thread} ref={threadRef}>
          <PreparedCascade
            candidateName={candidateName}
            jobName={bootstrap.job.name}
            companyName={bootstrap.job.company_name}
            prepared={prepared}
            onClaim={appendClaimToDraft}
            onOpenBrief={() => setActiveSheet("brief")}
          />

          {visibleMessages.map((msg) => {
            if (isSystemActionMessage(msg)) {
              const tags = getMessageActionTags(msg);
              return (
                <div key={msg.id} className={styles.actionBtnRow}>
                  {tags.includes("request_resume_upload") ? (
                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={() => setActiveSheet("resume")}
                    >
                      {FIXED_COPY.resumeUploadCta}
                    </button>
                  ) : null}
                  {tags.includes("open_put_forward") ? (
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => {
                        setAcceptedTerms(false);
                        setActiveSheet("putForward");
                      }}
                    >
                      {FIXED_COPY.openPutForwardCta}
                    </button>
                  ) : null}
                </div>
              );
            }

            const isUser = msg.content.role === "user";
            return (
              <div
                key={msg.id}
                className={`${styles.bubbleRow} ${
                  isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant
                }`}
              >
                <div
                  className={`${styles.bubble} ${
                    isUser ? styles.bubbleUser : styles.bubbleAssistant
                  }`}
                >
                  {msg.content.content}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.composerBar}>
          <div className={styles.zoneLabel}>{FIXED_COPY.zoneExploring}</div>
          <div className={styles.composerRow}>
            <Input.TextArea
              className={styles.composerInput}
              value={draft}
              autoSize={{ minRows: 1, maxRows: 5 }}
              placeholder={FIXED_COPY.composerPlaceholder}
              onChange={(e) => setDraft(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <Button
              type="primary"
              className={styles.sendBtn}
              loading={sending}
              onClick={() => void handleSend()}
            >
              Send
            </Button>
          </div>
        </div>
      </div>

      <Drawer
        title="Role brief"
        open={activeSheet === "brief"}
        onClose={() => setActiveSheet(null)}
        width={Math.min(480, window.innerWidth)}
      >
        <BriefContent brief={brief} />
        <div className={styles.actionBtnRow} style={{ marginTop: 16 }}>
          <button
            type="button"
            className={styles.dangerGhostBtn}
            onClick={() => {
              setActiveSheet(null);
              void handleNotForMe();
            }}
          >
            {FIXED_COPY.notForMeCta}
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              setAcceptedTerms(false);
              setActiveSheet("putForward");
            }}
          >
            {FIXED_COPY.putForwardCta}
          </button>
        </div>
      </Drawer>

      <Drawer
        title="Put me forward"
        open={activeSheet === "putForward"}
        onClose={() => setActiveSheet(null)}
        width={Math.min(480, window.innerWidth)}
      >
        <div className={styles.sheetForm}>
          <div className={styles.sheetHint}>
            Before I put you forward, confirm a few details. Exploring stays private
            until this step.
          </div>
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className={styles.sheetHint}>
            Resume: {resumePath ? resumePath : "Optional — you can upload later"}
          </div>
          <Upload
            accept=".pdf,.doc,.docx"
            showUploadList={false}
            beforeUpload={(file) => {
              void handleUploadResume(file);
              return false;
            }}
          >
            <Button loading={sheetSubmitting}>Upload resume</Button>
          </Upload>
          <TermsCheckbox
            checked={acceptedTerms}
            onChange={setAcceptedTerms}
            onOpen={(type) => setTermsType(type)}
          />
          <Button
            type="primary"
            loading={sheetSubmitting}
            onClick={() => void handlePutForward()}
          >
            Confirm and continue
          </Button>
        </div>
      </Drawer>

      <Drawer
        title="Upload resume"
        open={activeSheet === "resume"}
        onClose={() => setActiveSheet(null)}
        width={Math.min(480, window.innerWidth)}
      >
        <div className={styles.sheetForm}>
          <div className={styles.sheetHint}>
            Share a resume when you are ready. You can keep chatting either way.
          </div>
          <Upload
            accept=".pdf,.doc,.docx"
            showUploadList={false}
            beforeUpload={(file) => {
              void handleUploadResume(file);
              return false;
            }}
          >
            <Button type="primary" loading={sheetSubmitting}>
              Choose file
            </Button>
          </Upload>
        </div>
      </Drawer>

      <Drawer
        title="Chat on WhatsApp"
        open={activeSheet === "whatsapp"}
        onClose={() => setActiveSheet(null)}
        width={Math.min(480, window.innerWidth)}
      >
        <div className={styles.sheetForm}>
          <div className={styles.sheetHint}>
            Continue the same thread on WhatsApp. Your exploring context stays with
            Percy.
          </div>
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
          <TermsCheckbox
            checked={acceptedTerms}
            onChange={setAcceptedTerms}
            onOpen={(type) => setTermsType(type)}
          />
          <Button
            type="primary"
            loading={sheetSubmitting}
            onClick={() => void handleBindWhatsapp()}
          >
            Connect WhatsApp
          </Button>
        </div>
      </Drawer>

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

const PreparedCascade: React.FC<{
  candidateName: string;
  jobName: string;
  companyName: string;
  prepared: TMeetingPrepared | null;
  onClaim: (claim: string, reaction: "thats_right" | "not_quite") => void;
  onOpenBrief: () => void;
}> = ({ candidateName, jobName, companyName, prepared, onClaim, onOpenBrief }) => {
  const thin = !!prepared?.thin_profile;
  const blocks: { key: string; title: string; body?: string; claims?: string[] }[] =
    [
      {
        key: "greeting",
        title: FIXED_COPY.greetingTitle.replace("{name}", candidateName),
        body: FIXED_COPY.greetingBody,
      },
      {
        key: "rules",
        title: FIXED_COPY.groundRulesTitle,
        body: FIXED_COPY.groundRulesBody,
      },
      {
        key: "role",
        title: FIXED_COPY.roleOrientationTitle,
        body: `${companyName ? `${companyName} · ` : ""}${jobName}`,
      },
    ];

  if (thin) {
    blocks.push({
      key: "thin",
      title: FIXED_COPY.theAskTitle,
      body: FIXED_COPY.thinProfileNote,
    });
  } else if (prepared) {
    (["why_interested", "why_successful", "couldnt_tell"] as const).forEach(
      (key) => {
        const claims = prepared[key] || [];
        if (!claims.length) {
          return;
        }
        blocks.push({
          key,
          title: CLAIM_HEADERS[key],
          claims,
        });
      },
    );
    blocks.push({
      key: "ask",
      title: FIXED_COPY.theAskTitle,
      body: FIXED_COPY.theAskBody,
    });
  }

  return (
    <>
      {blocks.map((block) => (
        <div key={block.key} className={styles.preparedCard}>
          <div className={styles.preparedTitle}>{block.title}</div>
          {block.body ? (
            <div className={styles.preparedBody}>{block.body}</div>
          ) : null}
          {block.key === "role" ? (
            <div className={styles.actionBtnRow}>
              <button type="button" className={styles.ghostBtn} onClick={onOpenBrief}>
                {FIXED_COPY.briefCta}
              </button>
            </div>
          ) : null}
          {block.claims?.length ? (
            <div className={styles.claimList}>
              {block.claims.map((claim, index) => (
                <div key={`${block.key}-${index}`} className={styles.claimItem}>
                  <div className={styles.claimText}>{claim}</div>
                  <div className={styles.claimActions}>
                    <button
                      type="button"
                      className={styles.claimBtn}
                      onClick={() => onClaim(claim, "thats_right")}
                    >
                      {FIXED_COPY.claimRight}
                    </button>
                    <button
                      type="button"
                      className={styles.claimBtn}
                      onClick={() => onClaim(claim, "not_quite")}
                    >
                      {FIXED_COPY.claimNotQuite}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </>
  );
};

const BriefContent: React.FC<{
  brief: Record<string, unknown> | string | null;
}> = ({ brief }) => {
  if (!brief) {
    return <div className={styles.sheetHint}>{FIXED_COPY.briefEmpty}</div>;
  }
  if (typeof brief === "string") {
    return <div className={styles.briefSectionBody}>{brief}</div>;
  }
  return (
    <>
      {Object.entries(brief).map(([key, value]) => (
        <div key={key} className={styles.briefSection}>
          <div className={styles.briefSectionTitle}>{formatBriefKey(key)}</div>
          <div className={styles.briefSectionBody}>
            {typeof value === "string"
              ? value
              : JSON.stringify(value, null, 2)}
          </div>
        </div>
      ))}
    </>
  );
};

const formatBriefKey = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const TermsCheckbox: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  onOpen: (type: "terms" | "privacy") => void;
}> = ({ checked, onChange, onOpen }) => {
  return (
    <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)}>
      I agree to the{" "}
      <a
        onClick={(e) => {
          e.preventDefault();
          onOpen("terms");
        }}
      >
        Terms of Service
      </a>{" "}
      and{" "}
      <a
        onClick={(e) => {
          e.preventDefault();
          onOpen("privacy");
        }}
      >
        Privacy Policy
      </a>
    </Checkbox>
  );
};

export default JobMeetingsPage;
