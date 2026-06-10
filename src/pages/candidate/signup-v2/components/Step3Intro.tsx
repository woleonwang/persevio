import { useState } from "react";

import FlowShell, { SignupPrimaryButton } from "./FlowShell";
import HighlightText from "./HighlightText";
import PercyAvatar from "./PercyAvatar";
import RegistrationPanel from "./RegistrationPanel";
import styles from "../style.module.less";

type TStep3IntroProps = {
  firstName: string;
  companyName: string;
  companyLogo?: string;
  candidateEmail: string;
  jobTitle: string;
  onVerified: () => void;
};

const ROADMAP = [
  "I'll share my honest first read on your fit right after you proceed.",
  "We'll have a short discovery chat so I understand you beyond your resume.",
  "I'll prepare and submit your application with my recommendations.",
  "You can message me on WhatsApp or Persevio anytime for updates.",
];

const CAPABILITIES = [
  "Know you through real conversation",
  "Prepare and represent you strongly",
  "Give you updates anytime",
  "Coordinate interviews",
  "Recommend future opportunities",
];

const Step3Intro: React.FC<TStep3IntroProps> = ({
  firstName,
  companyName,
  companyLogo,
  candidateEmail,
  jobTitle,
  onVerified,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <FlowShell
      currentStep={3}
      jobTitle={jobTitle}
      companyName={companyName}
      companyLogo={companyLogo}
      wide
    >
      <div style={{ marginBottom: 28 }}>
        <div className={styles.percyRow}>
          <div className={styles.percyColumn}>
            <PercyAvatar size={108} />
          </div>
          <div>
            <p className={styles.bodyText}>
              Thanks for submitting your resume,{" "}
              <span className={styles.variableToken}>{firstName}</span>.
            </p>
            <p className={styles.bodyText} style={{ marginTop: 12 }}>
              The next step is a{" "}
              <span className={styles.highlightPhrase}>discovery chat</span> with me.
              This chat is{" "}
              <span className={styles.highlightPhrase}>
                required by the hiring manager
              </span>
              , designed to get the full picture of you beyond your resume.
            </p>
            <p className={styles.serifTitle} style={{ fontSize: 24, marginTop: 16 }}>
              Completing this chat will{" "}
              <HighlightText text="significantly increase your chance of landing an interview." />
            </p>
          </div>
        </div>
      </div>

      <div className={styles.desktopVisible} style={{ marginBottom: 28 }}>
        <RegistrationPanel
          candidateEmail={candidateEmail}
          onVerified={onVerified}
        />
      </div>

      <div className={styles.eyebrow}>What happens next</div>
      <h2 className={styles.serifTitle} style={{ fontSize: 24, marginTop: 8 }}>
        Here's how I'll help from here.
      </h2>
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        {ROADMAP.map((item, index) => (
          <div key={item} className={styles.card} style={{ padding: "16px 18px" }}>
            <div className={styles.eyebrow} style={{ color: "#398FFB" }}>
              {index + 1}
            </div>
            <p className={styles.bodyText} style={{ marginTop: 6 }}>
              {item}
            </p>
          </div>
        ))}
      </div>

      <div
        className={styles.card}
        style={{ marginTop: 28, padding: 24, background: "#FBF7EE" }}
      >
        <p className={styles.serifTitle} style={{ fontSize: 22 }}>
          I am your dedicated AI talent consultant,{" "}
          <HighlightText text="I work for you." />
        </p>
        <p className={styles.bodyText} style={{ marginTop: 10 }}>
          I partner with {companyName}, but my job is to represent you fairly and
          help you beyond this one role.
        </p>
        <div style={{ marginTop: 16 }}>
          <div className={styles.eyebrow}>Here's what I can do</div>
          <ul style={{ margin: "12px 0 0", paddingLeft: 18, color: "#6E6655" }}>
            {CAPABILITIES.map((item) => (
              <li key={item} style={{ marginBottom: 8 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.mobileVisible}>
        <div className={styles.floatingCta}>
          <SignupPrimaryButton onClick={() => setSheetOpen(true)}>
            Continue your application →
          </SignupPrimaryButton>
        </div>
        {sheetOpen && (
          <>
            <div className={styles.sheetBackdrop} onClick={() => setSheetOpen(false)} />
            <div className={styles.sheetPanel}>
              <RegistrationPanel
                candidateEmail={candidateEmail}
                onVerified={() => {
                  setSheetOpen(false);
                  onVerified();
                }}
                compact
              />
            </div>
          </>
        )}
      </div>
    </FlowShell>
  );
};

export default Step3Intro;
