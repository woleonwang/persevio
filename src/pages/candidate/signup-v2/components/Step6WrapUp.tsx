import { useEffect, useState } from "react";

import {
  CandidateEventName,
  trackCandidateEvent,
} from "@/utils/candidateEventTrack";
import {
  BEYOND_CAPABILITIES,
  BEYOND_INTRO,
  BEYOND_LEAD,
  SPEAK,
  WRAP_CONTENT,
} from "../constants";
import FlowShell, { SignupPrimaryButton } from "./FlowShell";
import ExitSurvey from "./ExitSurvey";
import HighlightText from "./HighlightText";
import PercyAvatar from "./PercyAvatar";
import {
  getTierFromRecommendation,
  hasInterviewFinished,
  isBriefReportRecommendation,
  isPostInterviewRecommendationInProgress,
  isPostInterviewRecommendationReady,
  mergeJobApplyPotentialGaps,
} from "../utils";
import styles from "../style.module.less";

type TStep6WrapUpProps = {
  firstName: string;
  companyName: string;
  companyLogo?: string;
  jobTitle: string;
  jobApply?: IJobApply;
  onRefreshJobApply?: () => Promise<IJobApply | undefined>;
  onComplete: () => void;
};

type TActionTone = "done" | "progress" | "open";

const formatWrapText = (
  text: string,
  firstName: string,
  companyName: string,
) => {
  return text
    .replace(/\[\[Alex\]\]/g, firstName)
    .replace(/\[\[Persevio\]\]/g, companyName);
};

const WrapIconCheck = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M2.6 7.4l2.8 2.8 6-7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WrapIconPencil = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M11.2 2.4l2.4 2.4M2.5 11.2l8-8 2.4 2.4-8 8-3 0.6 0.6-3z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

const WrapIconBell = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M8 2.2a4.2 4.2 0 00-4.2 4.2v2.1l-.8 1.6h10l-.8-1.6V6.4A4.2 4.2 0 008 2.2zM6.6 12.8h2.8"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WrapIconFlag = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 1v12M3 2.2h7.4l-1.5 2.4 1.5 2.4H3"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

const WrapIconAlert = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M8 5.2v3.6M8 11.2h.01"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const renderDisclaimerText = (text: string, companyName: string) => {
  if (!companyName || !text.includes(companyName)) {
    return text;
  }

  const parts = text.split(companyName);
  return parts.map((part, index) => (
    <span key={`${part}-${index}`}>
      {part}
      {index < parts.length - 1 && (
        <span className={styles.wrapReportDisclaimerCompany}>
          {companyName}
        </span>
      )}
    </span>
  ));
};

const WrapIconCompass = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10.8 7.2L8.4 8.4 7.2 10.8 9.6 9.6 10.8 7.2z"
      fill="currentColor"
    />
  </svg>
);

const WrapIconUsers = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 20 18"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="7" cy="6" r="2.7" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M2 15.5a5 5 0 0110 0"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M13 3.6a2.7 2.7 0 010 5M14.5 15.5a5 5 0 00-2.2-4.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const WrapIconShield = () => (
  <svg
    width="21"
    height="21"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M9 2l5.2 1.9v4.3c0 3.7-2.5 6.1-5.2 7.1-2.7-1-5.2-3.4-5.2-7.1V3.9L9 2z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M6.6 9.1l1.7 1.7 3.1-3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WrapIconChat = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 18 18"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M2.5 4.5A1.8 1.8 0 014.3 2.7h9.4a1.8 1.8 0 011.8 1.8v5a1.8 1.8 0 01-1.8 1.8H6.6L3 14.5V4.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const WrapIconWhatsapp = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M8 1.6a6.4 6.4 0 00-5.5 9.65L1.7 14.4l3.25-.84A6.4 6.4 0 108 1.6z"
      fill="#1FA855"
    />
    <path
      d="M5.6 4.9c-.13-.3-.27-.3-.4-.31h-.34a.66.66 0 00-.48.22 2 2 0 00-.63 1.49c0 .88.64 1.73.73 1.85.09.12 1.24 1.99 3.08 2.71 1.53.6 1.84.48 2.17.45.33-.03 1.07-.44 1.22-.86.15-.42.15-.78.1-.86-.04-.07-.16-.11-.34-.2-.18-.09-1.07-.53-1.23-.59-.17-.06-.29-.09-.4.09-.12.18-.47.58-.57.7-.1.12-.21.13-.39.04a4.9 4.9 0 01-1.45-.9 5.4 5.4 0 01-1-1.24c-.1-.18-.01-.28.08-.37l.27-.31c.09-.11.12-.18.18-.3.06-.12.03-.23-.01-.32-.05-.09-.4-.99-.55-1.34z"
      fill="#fff"
    />
  </svg>
);

const BEYOND_ICONS = {
  compass: WrapIconCompass,
  users: WrapIconUsers,
  pencil: WrapIconPencil,
  shield: WrapIconShield,
} as const;

type TWrapEyebrowProps = {
  children: React.ReactNode;
  tone?: "accent" | "mute";
};

const WrapEyebrow: React.FC<TWrapEyebrowProps> = ({
  children,
  tone = "accent",
}) => (
  <div
    className={`${styles.wrapEyebrow} ${tone === "mute" ? styles.wrapEyebrowMute : ""}`}
  >
    <span className={styles.wrapEyebrowDot} />
    <span className={styles.wrapEyebrowLabel}>{children}</span>
  </div>
);

type TActionRowProps = {
  tone: TActionTone;
  title: string;
  sub?: string;
  connector?: boolean;
  statusLabel?: string;
  children?: React.ReactNode;
};

const ActionRow: React.FC<TActionRowProps> = ({
  tone,
  title,
  sub,
  connector,
  statusLabel,
  children,
}) => {
  const toneClass =
    tone === "done"
      ? styles.wrapActionToneDone
      : tone === "progress"
        ? styles.wrapActionToneProgress
        : styles.wrapActionToneOpen;

  const pillLabel =
    statusLabel ||
    (tone === "done"
      ? "Done"
      : tone === "progress"
        ? "In progress"
        : "Anytime");

  const glyph =
    tone === "done" ? (
      <WrapIconCheck />
    ) : tone === "progress" ? (
      <span className={styles.wrapActionGlyphAnim}>
        <WrapIconPencil />
      </span>
    ) : (
      <WrapIconBell />
    );

  return (
    <div className={styles.wrapActionRow}>
      {connector && <span className={styles.wrapActionConnector} />}
      <span className={`${styles.wrapActionGlyph} ${toneClass}`}>{glyph}</span>
      <div className={styles.wrapActionCopy}>
        <div className={styles.wrapActionTitleRow}>
          <span className={styles.wrapActionTitle}>{title}</span>
          <span className={`${styles.wrapActionPill} ${toneClass}`}>
            {pillLabel}
          </span>
        </div>
        {sub && <p className={styles.wrapActionSub}>{sub}</p>}
        {children}
      </div>
    </div>
  );
};

type TReportListProps = {
  kind: "strong" | "flag";
  title: string;
  items: IEvaluateDetailItem[];
};

const ReportList: React.FC<TReportListProps> = ({ kind, title, items }) => (
  <div className={styles.wrapReportList}>
    <div
      className={`${styles.wrapReportListTitle} ${kind === "flag" ? styles.wrapReportListTitleFlag : ""}`}
    >
      {title}
    </div>
    <div className={styles.wrapReportItems}>
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className={styles.wrapReportItem}>
          <span
            className={`${styles.wrapReportDisc} ${kind === "flag" ? styles.wrapReportDiscFlag : ""}`}
          >
            {kind === "strong" ? <WrapIconCheck /> : <WrapIconFlag />}
          </span>
          <div className={styles.wrapReportItemText}>
            <span className={styles.wrapReportItemTitle}>{item.title}</span>
            <span>{item.details}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Step6WrapUp: React.FC<TStep6WrapUpProps> = ({
  firstName,
  companyName,
  companyLogo,
  jobTitle,
  jobApply,
  onRefreshJobApply,
  onComplete,
}) => {
  const [showSurvey, setShowSurvey] = useState(false);

  const tier = getTierFromRecommendation(jobApply?.interview_recommendation);
  const wrap = WRAP_CONTENT[tier];
  const briefReport = isBriefReportRecommendation(
    jobApply?.interview_recommendation,
  );
  const recommendationInProgress =
    isPostInterviewRecommendationInProgress(jobApply) ||
    (hasInterviewFinished(jobApply) &&
      !isPostInterviewRecommendationReady(jobApply));
  const recommendationReady = isPostInterviewRecommendationReady(jobApply);
  const fromWhatsApp = jobApply?.interview_mode === "whatsapp";
  const thanksText = formatWrapText(wrap.thanks, firstName, companyName);
  const disclaimerText = formatWrapText(
    wrap.disclaimer,
    firstName,
    companyName,
  );
  const reportStrengths = jobApply?.key_strengths ?? [];
  const reportGaps = mergeJobApplyPotentialGaps(jobApply?.potential_gaps);

  useEffect(() => {
    if (!jobApply?.job_id) {
      return;
    }

    trackCandidateEvent(CandidateEventName.WrapUpViewed, {
      jobId: jobApply.job_id,
      extraParams: {
        arrival_source:
          jobApply.interview_mode === "whatsapp" ? "whatsapp" : "web",
      },
    });
  }, [jobApply?.job_id, jobApply?.interview_mode]);

  useEffect(() => {
    if (!onRefreshJobApply || !recommendationInProgress) {
      return;
    }

    const pollTimer = window.setInterval(() => {
      void onRefreshJobApply();
    }, 2000);

    return () => window.clearInterval(pollTimer);
  }, [onRefreshJobApply, recommendationInProgress]);

  const showReportPreview =
    !briefReport && (reportStrengths.length > 0 || reportGaps.length > 0);

  // const recommendationSub = briefReport
  //   ? "A short report highlighting your strengths to the hiring manager based on what I discovered in our conversation. I'll have it ready in about two minutes. Nothing you need to do."
  //   : showReportPreview
  //     ? "A short report putting your application in front of the hiring manager. Here's exactly what I'll tell them:"
  //     : recommendationInProgress
  //       ? "I'm putting together your recommendation based on our conversation. This usually takes a couple of minutes."
  //       : "A short report putting your application in front of the hiring manager. Here's exactly what I'll tell them:";

  return (
    <FlowShell
      currentStep={6}
      jobTitle={jobTitle}
      companyName={companyName}
      companyLogo={companyLogo}
      showProgress={false}
      showJobHeader={false}
      wrapUp
    >
      <div className={styles.wrapPage}>
        <section className={styles.wrapThankYou}>
          {fromWhatsApp && (
            <div className={styles.wrapWhatsappBadge}>
              <WrapIconWhatsapp />
              Continued from WhatsApp
            </div>
          )}
          <div className={styles.wrapThankYouHead}>
            <PercyAvatar size={56} presence asset="face" />
            <div className={styles.wrapThankYouCopy}>
              <div className={styles.wrapPercyLabel}>
                Percy · your talent consultant
              </div>
              <h1 className={styles.wrapThankYouTitle}>
                Thank you, that was time well spent.
              </h1>
            </div>
          </div>
          <p className={styles.wrapThankYouBody}>
            <HighlightText text={thanksText} />
          </p>
        </section>

        <section className={styles.wrapSection}>
          <WrapEyebrow>What I'm doing for this application</WrapEyebrow>
          <div className={styles.wrapCard}>
            <ActionRow
              tone="done"
              title="Your resume is already in"
              sub="It reached the hiring team the moment you submitted it. Nothing for you to do."
              connector
            />
            <ActionRow
              tone={recommendationReady ? "done" : "progress"}
              title="I'm writing your recommendation"
              sub="A short report highlighting your strengths to the hiring manager based on what I discovered in our conversation. I'll have it ready in about two minutes. Nothing you need to do."
              statusLabel={recommendationReady ? "Done" : "In progress"}
              connector
            >
              {false && showReportPreview && (
                <div className={styles.wrapReportBlock}>
                  <div className={styles.wrapReportBlockInner}>
                    {reportStrengths.length > 0 && (
                      <ReportList
                        kind="strong"
                        title="I'll lead with your strengths"
                        items={reportStrengths}
                      />
                    )}
                    {reportStrengths.length > 0 && reportGaps.length > 0 && (
                      <div className={styles.wrapReportDivider} />
                    )}
                    {reportGaps.length > 0 && (
                      <ReportList
                        kind="flag"
                        title="And I'll be honest about"
                        items={reportGaps}
                      />
                    )}
                  </div>
                  <div className={styles.wrapReportDisclaimer}>
                    <span className={styles.wrapReportDisclaimerIcon}>
                      <WrapIconAlert />
                    </span>
                    <span className={styles.wrapReportDisclaimerText}>
                      {renderDisclaimerText(disclaimerText, companyName)}
                    </span>
                  </div>
                </div>
              )}
            </ActionRow>
            <ActionRow
              tone="open"
              title="Updates whenever you want them"
              sub="Ask me where this application stands anytime by sending me a message on Whatsapp or checking on your Persevio dashboard. No black hole, no waiting and wondering."
            />
          </div>
        </section>

        <section className={styles.wrapSectionLast}>
          <WrapEyebrow tone="mute">Beyond this role</WrapEyebrow>
          <div className={styles.wrapBeyondIntro}>
            <PercyAvatar size={46} presence asset="face" />
            <div className={styles.wrapBeyondIntroCopy}>
              <h2 className={styles.wrapBeyondHeadline}>{BEYOND_INTRO.head}</h2>
              <p className={styles.wrapBeyondBody}>{BEYOND_INTRO.body}</p>
            </div>
          </div>

          <div className={styles.wrapLeadCard}>
            <span className={styles.wrapLeadIcon}>
              <WrapIconShield />
            </span>
            <div className={styles.wrapLeadCopy}>
              <div className={styles.wrapLeadTitleRow}>
                <span className={styles.wrapLeadTitle}>
                  {BEYOND_LEAD.title}
                </span>
                <span className={styles.wrapLeadBadge}>
                  {BEYOND_LEAD.badge}
                </span>
              </div>
              <p className={styles.wrapLeadText}>{BEYOND_LEAD.text}</p>
            </div>
          </div>

          <div className={styles.wrapBeyondGrid}>
            {BEYOND_CAPABILITIES.map((item) => {
              const Icon = BEYOND_ICONS[item.icon];
              return (
                <div key={item.title} className={styles.wrapBeyondCard}>
                  <span className={styles.wrapBeyondCardIcon}>
                    <Icon />
                  </span>
                  <div className={styles.wrapBeyondCardCopy}>
                    <div className={styles.wrapBeyondCardTitle}>
                      {item.title}
                    </div>
                    <p className={styles.wrapBeyondCardText}>{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.wrapSpeakCard}>
            <div className={styles.wrapSpeakHead}>
              <span className={styles.wrapSpeakIcon}>
                <WrapIconChat />
              </span>
              <div className={styles.wrapSpeakCopy}>
                <div className={styles.wrapSpeakTitle}>{SPEAK.title}</div>
                <p className={styles.wrapSpeakText}>{SPEAK.text}</p>
              </div>
            </div>
            <div className={styles.wrapSpeakTags}>
              {SPEAK.subs.map((sub) => (
                <span key={sub} className={styles.wrapSpeakTag}>
                  <span className={styles.wrapSpeakTagDot} />
                  {sub}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className={styles.wrapFinishBar}>
          <SignupPrimaryButton
            className={styles.wrapFinishButton}
            onClick={() => setShowSurvey(true)}
          >
            Finish and view your application →
          </SignupPrimaryButton>
        </div>
      </div>

      {showSurvey && jobApply?.id && (
        <ExitSurvey
          jobApplyId={jobApply.id}
          onClose={() => setShowSurvey(false)}
          onDone={onComplete}
        />
      )}
    </FlowShell>
  );
};

export default Step6WrapUp;
