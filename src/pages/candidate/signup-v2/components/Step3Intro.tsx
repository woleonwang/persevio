import { useState } from "react";

import { STEP3_CAPABILITIES, STEP3_ROADMAP } from "../constants";
import FlowShell, { SignupPrimaryButton } from "./FlowShell";
import PercyAvatar from "./PercyAvatar";
import RegistrationPanel from "./RegistrationPanel";
import WhoIsPercyButton from "./WhoIsPercyButton";
import styles from "../style.module.less";

type TStep3IntroProps = {
  firstName: string;
  companyName: string;
  companyLogo?: string;
  candidateEmail: string;
  jobTitle: string;
  onVerified: () => void;
};

const WhatsappGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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

const CapabilityIcon = ({ type }: { type: (typeof STEP3_CAPABILITIES)[number]["icon"] }) => {
  if (type === "spark") {
    return (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M8 1.5c.4 2.7 1.3 3.6 4 4-2.7.4-3.6 1.3-4 4-.4-2.7-1.3-3.6-4-4 2.7-.4 3.6-1.3 4-4z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (type === "bell") {
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M6 9a4 4 0 018 0c0 3 1.2 4 1.8 4.5H4.2C4.8 13 6 12 6 9z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 16a1.7 1.7 0 003 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (type === "calendar") {
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3.5" y="4.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 8h13M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M13 7l-1.6 4.4L7 13l1.6-4.4L13 7z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const Step3HeroCopy: React.FC<{ firstName: string }> = ({ firstName }) => (
  <div className={styles.step3HeroCopy}>
    <p className={styles.step3HeroLead}>
      Thanks for submitting your resume,{" "}
      <span className={styles.variableToken}>{firstName}</span>.
    </p>
    <p className={styles.step3HeroBody}>
      The next step is a{" "}
      <span className={`${styles.highlightPhraseSerif}`} style={{ fontSize: 20 }}>
        discovery chat
      </span>{" "}
      with me. This chat is{" "}
      <span className={styles.highlightPhrase}>required by the hiring manager</span>, designed
      to get the full picture of you beyond the incomplete information on your resume, so you
      are represented{" "}
      <span className={styles.highlightPhrase}>fairly</span> and{" "}
      <span className={styles.highlightPhrase}>accurately</span>.
    </p>
    <p className={styles.step3HeroFocal}>
      Completing this chat will{" "}
      <span className={styles.highlightPhraseSerif}>
        significantly increase your chance of landing an interview.
      </span>
    </p>
    <div className={styles.step3WhatsappCard}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>
        <WhatsappGlyph />
      </span>
      <span className={styles.step3WhatsappText}>
        You'll also be able to message me anytime on{" "}
        <span className={styles.step3WhatsappBrand}>WhatsApp</span> or on your dashboard on
        Persevio for application updates after our conversation.
      </span>
    </div>
  </div>
);

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
      <section className={styles.step3Hero}>
        <div className={styles.step3HeroGlow} />
        <div className={styles.step3HeroInner}>
          <div className={`${styles.step3HeroAvatarCol} ${styles.step3HeroAvatarMobile}`}>
            <PercyAvatar size={108} presence />
            <WhoIsPercyButton />
          </div>
          <div className={`${styles.step3HeroAvatarCol} ${styles.step3HeroAvatarDesktop}`}>
            <PercyAvatar size={150} presence />
            <WhoIsPercyButton />
          </div>
          <Step3HeroCopy firstName={firstName} />
        </div>
      </section>

      <div className={styles.desktopVisible}>
        <RegistrationPanel
          variant="step3"
          candidateEmail={candidateEmail}
          onVerified={onVerified}
        />
      </div>

      <section className={styles.step3Roadmap}>
        <div className={styles.step3RoadmapHeader}>
          <div className={styles.step3RoadmapEyebrow}>What happens next</div>
          <h2 className={styles.step3RoadmapTitle}>Here's how I'll help from here</h2>
        </div>

        <div className={styles.step3RoadmapList}>
          {STEP3_ROADMAP.map((item, index) => (
            <div key={item} className={styles.step3RoadmapItem}>
              {index < STEP3_ROADMAP.length - 1 && (
                <div className={styles.step3RoadmapLine} />
              )}
              <div className={styles.step3RoadmapDisc}>{index + 1}</div>
              <div className={styles.step3RoadmapText}>{item}</div>
            </div>
          ))}
        </div>

        <div className={styles.step3RoadmapCards}>
          {STEP3_ROADMAP.map((item, index) => (
            <div key={item} className={styles.step3RoadmapCard}>
              <div className={styles.step3RoadmapCardDisc}>{index + 1}</div>
              <div className={styles.step3RoadmapCardText}>{item}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.step3Positioning}>
        <div className={styles.step3PositioningMobile}>
          <div className={styles.step3PositioningHeader}>
            <PercyAvatar size={48} />
            <div>
              <div className={styles.step3PositioningName}>Percy</div>
              <div className={styles.step3PositioningRole}>Your AI talent consultant</div>
              <div style={{ marginTop: 4 }}>
                <WhoIsPercyButton />
              </div>
            </div>
          </div>
          <p className={styles.step3PositioningTitle}>
            I am your dedicated AI talent consultant,{" "}
            <span className={styles.highlightPhraseSerif}>I work for you.</span>
          </p>
          <p className={styles.step3PositioningBody}>
            I partner with <span className={styles.variableToken}>{companyName}</span> on this
            role, but ultimately, <strong>I work for you</strong>. My job is to understand you
            deeply so I can represent you as strongly as possible to the employer.
          </p>
          <p className={styles.step3CapabilitiesLead}>Here's what I can do:</p>
          <div className={styles.step3CapabilityGrid}>
            {STEP3_CAPABILITIES.map((item) => (
              <div key={item.text} className={styles.step3CapabilityItem}>
                <span className={styles.step3CapabilityIcon}>
                  <CapabilityIcon type={item.icon} />
                </span>
                <span className={styles.step3CapabilityText}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.step3PositioningDesktop}>
          <div className={styles.step3PositioningDesktopTop}>
            <div className={styles.step3HeroAvatarCol}>
              <PercyAvatar size={76} />
              <WhoIsPercyButton />
            </div>
            <div style={{ flex: 1 }}>
              <p className={styles.step3PositioningTitle}>
                I am your dedicated AI talent consultant,{" "}
                <span className={styles.highlightPhraseSerif}>I work for you.</span>
              </p>
              <p className={styles.step3PositioningBody} style={{ maxWidth: 520 }}>
                I partner with <span className={styles.variableToken}>{companyName}</span> on
                this role, but ultimately, <strong>I work for you</strong>. My job is to
                understand you deeply so I can represent you as strongly as possible to the
                employer.
              </p>
              <p className={styles.step3CapabilitiesLead}>Here's what I can do:</p>
            </div>
          </div>
          <div className={styles.step3CapabilityGrid}>
            {STEP3_CAPABILITIES.map((item) => (
              <div key={item.text} className={styles.step3CapabilityItem}>
                <span className={styles.step3CapabilityIcon}>
                  <CapabilityIcon type={item.icon} />
                </span>
                <span className={styles.step3CapabilityText}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.step3ScrollSpacer} />

      <div className={styles.mobileVisible}>
        <div className={styles.floatingCta}>
          <SignupPrimaryButton onClick={() => setSheetOpen(true)}>
            Continue your application →
          </SignupPrimaryButton>
        </div>
        {sheetOpen && (
          <>
            <div className={styles.sheetBackdrop} onClick={() => setSheetOpen(false)} />
            <div className={`${styles.sheetPanel} ${styles.step3SheetPanel}`}>
              <RegistrationPanel
                variant="step3"
                compact
                candidateEmail={candidateEmail}
                onVerified={() => {
                  setSheetOpen(false);
                  onVerified();
                }}
              />
            </div>
          </>
        )}
      </div>
    </FlowShell>
  );
};

export default Step3Intro;
