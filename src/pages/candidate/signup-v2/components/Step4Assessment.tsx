import { useEffect, useMemo, useRef, useState } from "react";

import FlowShell, { FlowShellFooterButton, SignupPrimaryButton } from "./FlowShell";
import HighlightText from "./HighlightText";
import PercyAvatar from "./PercyAvatar";
import {
  formatResumeFileName,
  getAssessmentDisplay,
  getTierFromRecommendation,
  parseInitialImpression,
} from "../utils";
import styles from "../style.module.less";

type TStep4AssessmentProps = {
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  resumePath: string;
  jobApply?: IJobApply;
  onContinue: () => void;
};

const MIN_REVIEW_MS = 2000;

const Step4Assessment: React.FC<TStep4AssessmentProps> = ({
  jobTitle,
  companyName,
  companyLogo,
  resumePath,
  jobApply,
  onContinue,
}) => {
  const [phase, setPhase] = useState<"reviewing" | "ready" | "failed">("reviewing");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [slowMessage, setSlowMessage] = useState(false);
  const reviewStartedAt = useRef(Date.now());

  const impression = useMemo(
    () => parseInitialImpression(jobApply?.initial_impression_json),
    [jobApply?.initial_impression_json],
  );

  const tier = getTierFromRecommendation(jobApply?.interview_recommendation);
  const assessment = getAssessmentDisplay(impression, tier);
  const resumeName = formatResumeFileName(resumePath);

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
      if (
        status &&
        status !== "generating" &&
        status !== "generate_succeed"
      ) {
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

    const waitMs = Math.max(0, MIN_REVIEW_MS - (Date.now() - reviewStartedAt.current));
    const readyTimer = window.setTimeout(evaluatePhase, waitMs);

    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(readyTimer);
    };
  }, [impression, jobApply?.interview_strategy_status]);

  if (phase === "reviewing") {
    return (
      <FlowShell
        currentStep={4}
        jobTitle={jobTitle}
        companyName={companyName}
        companyLogo={companyLogo}
      >
        <div className={styles.transitionWrap}>
          <div className={styles.pulseRing}>
            <PercyAvatar size={88} />
          </div>
          <h2 className={styles.serifTitle}>Reviewing your resume…</h2>
          <p className={styles.bodyText} style={{ marginTop: 10, maxWidth: 360 }}>
            I'm reading through your background and putting together my initial
            thoughts on this role.
          </p>
          {slowMessage && (
            <p className={styles.bodyText} style={{ marginTop: 12, fontStyle: "italic" }}>
              Almost done. I'm being thorough.
            </p>
          )}
        </div>
      </FlowShell>
    );
  }

  const isFailed = phase === "failed";

  return (
    <FlowShell
      currentStep={4}
      jobTitle={jobTitle}
      companyName={companyName}
      companyLogo={companyLogo}
      footer={
        <FlowShellFooterButton
          onClick={() => (isFailed ? onContinue() : setSheetOpen(true))}
        >
          Let's chat →
        </FlowShellFooterButton>
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <PercyAvatar size={36} />
        <div>
          <div style={{ fontWeight: 600 }}>Percy</div>
          {!isFailed && (
            <div style={{ fontSize: 13, color: "#A89D86" }}>
              Read {resumeName} · just now
            </div>
          )}
        </div>
      </div>

      {isFailed ? (
        <>
          <h1 className={styles.serifTitle}>Let's go straight to talking</h1>
          <p className={styles.bodyText} style={{ marginTop: 10 }}>
            I wasn't able to finish my review of your resume just now, but that's no
            reason to wait. Let's have our conversation, and I'll read your
            background as we go.
          </p>
        </>
      ) : (
        <>
          <h1 className={styles.serifTitle}>Percy's Initial Impressions</h1>
          <p className={styles.bodyText} style={{ marginTop: 8 }}>
            I've reviewed your resume. Here's my initial read on your fit for this role.
          </p>

          <div
            className={`${styles.card} ${styles.assessSummaryCard}`}
            style={{ marginTop: 20, opacity: tier === "weak" ? 0.75 : 1 }}
          >
            <HighlightText text={assessment.summary} />
          </div>

          <div className={styles.card} style={{ marginTop: 16, padding: "8px 18px" }}>
            <div className={styles.eyebrow} style={{ paddingTop: 10 }}>
              What stands out
            </div>
            {assessment.strengths.map((item) => (
              <div key={item} className={styles.pointRow}>
                <div className={styles.pointDiscBlue}>✓</div>
                <p className={styles.bodyText}>{item.replace(/^-\s*/, "")}</p>
              </div>
            ))}
          </div>

          <div className={styles.card} style={{ marginTop: 16, padding: "8px 18px" }}>
            <div className={styles.eyebrow} style={{ paddingTop: 10 }}>
              What I'd like to explore
            </div>
            {assessment.discuss.map((item) => (
              <div key={item} className={styles.pointRow}>
                <div className={styles.pointDiscSand}>💬</div>
                <p className={styles.bodyText}>{item.replace(/^-\s*/, "")}</p>
              </div>
            ))}
          </div>

          <div
            className={styles.card}
            style={{ marginTop: 16, padding: 18, background: "#FBF7EE" }}
          >
            <p className={styles.bodyText}>{assessment.bridge}</p>
          </div>
        </>
      )}

      {sheetOpen && (
        <>
          <div className={styles.sheetBackdrop} onClick={() => setSheetOpen(false)} />
          <div className={styles.sheetPanel}>
            <h3 className={styles.serifTitle} style={{ fontSize: 22 }}>
              How should we talk?
            </h3>
            <p className={styles.bodyText} style={{ marginTop: 8 }}>
              Pick up where my read leaves off.
            </p>
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              <SignupPrimaryButton
                style={{ background: "#25D366", borderColor: "#25D366" }}
                onClick={onContinue}
              >
                Chat on WhatsApp
              </SignupPrimaryButton>
              <SignupPrimaryButton onClick={onContinue}>
                Chat here
              </SignupPrimaryButton>
            </div>
          </div>
        </>
      )}
    </FlowShell>
  );
};

export default Step4Assessment;
