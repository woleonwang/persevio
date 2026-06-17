import { useEffect, useMemo, useRef, useState } from "react";

import {
  CandidateEventName,
  trackCandidateEvent,
} from "@/utils/candidateEventTrack";
import AssessmentChatSheet from "./AssessmentChatSheet";
import FlowShell, { FlowShellFooterButton } from "./FlowShell";
import HighlightText from "./HighlightText";
import PercyAvatar from "./PercyAvatar";
import ResumeReviewTransition from "./ResumeReviewTransition";
import WhoIsPercyButton from "./WhoIsPercyButton";
import {
  getAssessmentDisplay,
  getTierFromRecommendation,
  parseInitialImpression,
} from "../utils";
import styles from "../style.module.less";

type TStep4AssessmentProps = {
  jobApply?: IJobApply;
  countryCode: string;
  phone: string;
  onContinue: () => void;
  onRefreshJobApply?: () => Promise<IJobApply | undefined>;
};

const MIN_REVIEW_MS = 2000;

const renderChatFooter = (onClick: () => void) => (
  <div className={styles.chatFooter}>
    <FlowShellFooterButton onClick={onClick}>Let's chat →</FlowShellFooterButton>
    <p className={styles.chatFooterHint}>
      Completing this chat{" "}
      <span className={styles.chatFooterHintAccent}>significantly boosts</span>{" "}
      your interview chances.
    </p>
  </div>
);

const Step4Assessment: React.FC<TStep4AssessmentProps> = ({
  jobApply,
  countryCode,
  phone,
  onContinue,
  onRefreshJobApply,
}) => {
  const handleContinueToDiscovery = async () => {
    await onRefreshJobApply?.();
    onContinue();
  };
  const [phase, setPhase] = useState<"reviewing" | "ready" | "failed">(
    "reviewing",
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [slowMessage, setSlowMessage] = useState(false);
  const reviewStartedAt = useRef(Date.now());

  const impression = useMemo(
    () => parseInitialImpression(jobApply?.initial_impression_json),
    [jobApply?.initial_impression_json],
  );

  const tier = getTierFromRecommendation(jobApply?.interview_recommendation);
  const assessment = getAssessmentDisplay(impression, tier);
  useEffect(() => {
    const slowTimer = window.setTimeout(() => setSlowMessage(true), 5000);

    const evaluatePhase = () => {
      const elapsed = Date.now() - reviewStartedAt.current;
      if (elapsed < MIN_REVIEW_MS) {
        return false;
      }
      const status = jobApply?.interview_strategy_status;
      if (status === "generate_succeed" && impression) {
        setPhase("ready");
        return true;
      }
      if (status && status !== "generating" && status !== "generate_succeed") {
        setPhase("failed");
        return true;
      }
      if (status === "generate_succeed" && !impression) {
        setPhase("failed");
        return true;
      }
      return false;
    };

    if (evaluatePhase()) {
      return () => window.clearTimeout(slowTimer);
    }

    const waitMs = Math.max(
      0,
      MIN_REVIEW_MS - (Date.now() - reviewStartedAt.current),
    );
    const readyTimer = window.setTimeout(evaluatePhase, waitMs);

    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(readyTimer);
    };
  }, [impression, jobApply?.interview_strategy_status]);

  useEffect(() => {
    if (phase === "reviewing") {
      return;
    }

    const fitTier =
      phase === "failed"
        ? "error"
        : jobApply?.interview_recommendation || "unknown";

    trackCandidateEvent(CandidateEventName.AssessmentViewed, {
      jobId: jobApply?.job_id,
      extraParams: {
        fit_tier: fitTier,
        assessment_generation_time_ms: Date.now() - reviewStartedAt.current,
      },
    });
  }, [phase]);

  if (phase === "reviewing") {
    return (
      <FlowShell currentStep={4} showJobHeader={false}>
        <ResumeReviewTransition slowMessage={slowMessage} />
      </FlowShell>
    );
  }

  const isFailed = phase === "failed";

  return (
    <FlowShell
      currentStep={4}
      showJobHeader={false}
      footer={renderChatFooter(() => setSheetOpen(true))}
    >
      {isFailed ? (
        <div className={styles.assessErrorWrap}>
          <PercyAvatar size={84} asset="face" />
          <div className={styles.assessErrorWhoIs}>
            <WhoIsPercyButton />
          </div>
          <h1 className={styles.assessErrorTitle}>
            Let's go straight to talking
          </h1>
          <p className={styles.assessErrorBody}>
            I wasn't able to finish my review of your resume just now, but
            that's no reason to wait. Let's have our conversation, and I'll read
            your background as we go.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.percyByline}>
            <PercyAvatar size={42} asset="face" ring={false} />
            <div className={styles.percyBylineCopy}>
              <div className={styles.percyBylineNameRow}>
                <div className={styles.percyBylineName}>Percy</div>
                <WhoIsPercyButton />
              </div>
              <div className={styles.percyBylineMeta}>
                Read your resume · just now
              </div>
            </div>
          </div>

          <h1 className={styles.serifTitle}>Percy's Initial Impressions</h1>
          <p className={styles.bodyText} style={{ marginTop: 8 }}>
            This is my own read as your consultant, my personal take, not the
            employer's verdict. We'll talk it through together in our chat next.
          </p>

          <div
            className={`${styles.card} ${styles.assessSummaryCard}`}
            style={{ marginTop: 20, opacity: tier === "weak" ? 0.75 : 1 }}
          >
            <HighlightText text={assessment.summary} />
          </div>

          <div className={styles.assessSection}>
            <div className={styles.assessSectionHead}>
              <span
                className={`${styles.assessSectionDot} ${styles.assessSectionDotStrong}`}
              />
              <span
                className={`${styles.assessSectionLabel} ${styles.assessSectionLabelStrong}`}
              >
                What stands out
              </span>
            </div>
            <div className={`${styles.card} ${styles.assessPointCard}`}>
              {assessment.strengths.map((item) => (
                <div key={item} className={styles.pointRow}>
                  <div className={styles.pointDiscBlue}>✓</div>
                  <p className={styles.bodyText}>{item.replace(/^-\s*/, "")}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.assessSection}>
            <div className={styles.assessSectionHead}>
              <span
                className={`${styles.assessSectionDot} ${styles.assessSectionDotNeutral}`}
              />
              <span
                className={`${styles.assessSectionLabel} ${styles.assessSectionLabelNeutral}`}
              >
                What I'd like to explore
              </span>
            </div>
            <div className={`${styles.card} ${styles.assessPointCard}`}>
              {assessment.discuss.map((item) => (
                <div key={item} className={styles.pointRow}>
                  <div className={styles.pointDiscSand}>💬</div>
                  <p className={styles.bodyText}>{item.replace(/^-\s*/, "")}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.assessBridgeCard}>
            <span className={styles.assessBridgeIcon} aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2.5 4.2a1.7 1.7 0 011.7-1.7h7.6a1.7 1.7 0 011.7 1.7v4.6a1.7 1.7 0 01-1.7 1.7H6.2L3 13V4.2z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.5 6.1h5M5.5 8.2h3"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <p className={styles.assessBridgeText}>{assessment.bridge}</p>
          </div>
        </>
      )}

      <AssessmentChatSheet
        open={sheetOpen}
        countryCode={countryCode}
        phone={phone}
        jobApplyId={jobApply?.id}
        onClose={() => setSheetOpen(false)}
        onChatHere={handleContinueToDiscovery}
        onWhatsappReady={handleContinueToDiscovery}
      />
    </FlowShell>
  );
};

export default Step4Assessment;
