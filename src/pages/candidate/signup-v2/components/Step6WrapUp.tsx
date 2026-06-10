import { useEffect, useState } from "react";

import { BEYOND_CAPABILITIES, WRAP_CONTENT } from "../constants";
import FlowShell, { SignupPrimaryButton } from "./FlowShell";
import PercyAvatar from "./PercyAvatar";
import ExitSurvey from "./ExitSurvey";
import {
  getTierFromRecommendation,
  isBriefReportRecommendation,
  splitFullName,
} from "../utils";
import styles from "../style.module.less";

type TStep6WrapUpProps = {
  firstName: string;
  companyName: string;
  companyLogo?: string;
  jobTitle: string;
  jobApply?: IJobApply;
  onComplete: () => void;
};

const MIN_PREPARE_MS = 2000;

const Step6WrapUp: React.FC<TStep6WrapUpProps> = ({
  firstName,
  companyName,
  companyLogo,
  jobTitle,
  jobApply,
  onComplete,
}) => {
  const [phase, setPhase] = useState<"preparing" | "ready">("preparing");
  const [showSurvey, setShowSurvey] = useState(false);
  const [slowMessage, setSlowMessage] = useState(false);

  const tier = getTierFromRecommendation(jobApply?.interview_recommendation);
  const wrap = WRAP_CONTENT[tier];
  const briefReport = isBriefReportRecommendation(
    jobApply?.interview_recommendation,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase("ready"), MIN_PREPARE_MS);
    const slowTimer = window.setTimeout(() => setSlowMessage(true), 5000);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(slowTimer);
    };
  }, []);

  if (phase === "preparing") {
    return (
      <FlowShell
        currentStep={6}
        jobTitle={jobTitle}
        companyName={companyName}
        companyLogo={companyLogo}
        showProgress={false}
      >
        <div className={styles.transitionWrap}>
          <PercyAvatar size={88} />
          <h2 className={styles.serifTitle} style={{ marginTop: 20 }}>
            Preparing your summary…
          </h2>
          <p className={styles.bodyText} style={{ marginTop: 10, maxWidth: 360 }}>
            Give me a moment. I'm pulling together everything from our conversation.
          </p>
          {slowMessage && (
            <p className={styles.bodyText} style={{ marginTop: 12, fontStyle: "italic" }}>
              Almost there. I want to get this right.
            </p>
          )}
        </div>
      </FlowShell>
    );
  }

  return (
    <FlowShell
      currentStep={6}
      jobTitle={jobTitle}
      companyName={companyName}
      companyLogo={companyLogo}
      showProgress={false}
    >
      <div
        className={styles.card}
        style={{
          padding: 24,
          background: "linear-gradient(180deg, #F7F1E4 0%, #FFFFFF 100%)",
        }}
      >
        <div className={styles.eyebrow}>Percy · your talent consultant</div>
        <h1 className={styles.serifTitle} style={{ marginTop: 10, fontSize: 28 }}>
          Thank you, that was time well spent.
        </h1>
        <p className={styles.bodyText} style={{ marginTop: 12 }}>
          {wrap.thanks.replace("[[Alex]]", firstName || splitFullName("").firstName)}
        </p>
      </div>

      <div style={{ marginTop: 28 }}>
        <div className={styles.eyebrow}>What I'm doing for this application</div>
        <div className={styles.card} style={{ marginTop: 12, padding: 18 }}>
          <div className={styles.pointRow}>
            <div className={styles.pointDiscBlue}>✓</div>
            <div>
              <div style={{ fontWeight: 600 }}>Your resume is already in</div>
              <p className={styles.bodyText}>
                It reached the hiring team the moment you submitted it.
              </p>
            </div>
          </div>
          <div className={styles.pointRow}>
            <div className={styles.pointDiscSand}>✍️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>I'm writing your recommendation</div>
              {briefReport ? (
                <p className={styles.bodyText}>
                  A short report highlighting your strengths. I'll have it ready in about
                  two minutes.
                </p>
              ) : (
                <div
                  style={{
                    marginTop: 10,
                    padding: 14,
                    borderRadius: 12,
                    background: "#FBF7EE",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    I'll lead with your strengths
                  </div>
                  {wrap.report.lead.map((item) => (
                    <div key={item} className={styles.pointRow}>
                      <div className={styles.pointDiscBlue}>✓</div>
                      <p className={styles.bodyText}>{item}</p>
                    </div>
                  ))}
                  <div style={{ fontWeight: 600, margin: "12px 0 8px" }}>
                    And I'll be honest about
                  </div>
                  {wrap.report.flag.map((item) => (
                    <div key={item} className={styles.pointRow}>
                      <div className={styles.pointDiscSand}>⚑</div>
                      <p className={styles.bodyText}>{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className={styles.pointRow}>
            <div className={styles.pointDiscBlue}>🔔</div>
            <div>
              <div style={{ fontWeight: 600 }}>Updates whenever you want them</div>
              <p className={styles.bodyText}>
                Ask Percy on WhatsApp or check the dashboard. No black hole, no waiting
                and wondering.
              </p>
            </div>
          </div>
        </div>
        <p
          className={styles.bodyText}
          style={{ marginTop: 10, fontStyle: "italic", fontSize: 13 }}
        >
          This is my professional read, not a hiring decision. The team at {companyName}{" "}
          makes the final call.
        </p>
      </div>

      <div style={{ marginTop: 28 }}>
        <div className={styles.eyebrow}>Beyond this role</div>
        <p className={styles.serifTitle} style={{ fontSize: 22, marginTop: 8 }}>
          This is the start of our relationship, not the finish.
        </p>
        <p className={styles.bodyText} style={{ marginTop: 8 }}>
          That wraps up your application for this role, but you and I are just getting
          going.
        </p>
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {BEYOND_CAPABILITIES.map((item) => (
            <div key={item.title} className={styles.card} style={{ padding: 16 }}>
              <div style={{ fontWeight: 600 }}>{item.title}</div>
              <p className={styles.bodyText} style={{ marginTop: 6 }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className={styles.card}
        style={{ marginTop: 24, padding: 18, background: "#E9F1FE" }}
      >
        <div style={{ fontWeight: 600 }}>Just keep talking to me</div>
        <p className={styles.bodyText} style={{ marginTop: 6 }}>
          Your career aspirations · Your job search preferences · Your expertise
        </p>
      </div>

      <SignupPrimaryButton
        style={{ marginTop: 28 }}
        onClick={() => setShowSurvey(true)}
      >
        Finish and view your application →
      </SignupPrimaryButton>

      {showSurvey && jobApply?.id && (
        <ExitSurvey
          jobApplyId={jobApply.id}
          onDone={onComplete}
        />
      )}
    </FlowShell>
  );
};

export default Step6WrapUp;
