import { useEffect, useState } from "react";

import FlowShell, { SignupPrimaryButton } from "./FlowShell";
import PercyAvatar from "./PercyAvatar";
import RegistrationPanel from "./RegistrationPanel";
import ResumeReviewTransition from "./ResumeReviewTransition";
import WhoIsPercyButton from "./WhoIsPercyButton";
import styles from "../style.module.less";

const STEP3_LOADING_MS = 5000;

type TStep3IntroProps = {
  firstName: string;
  companyName: string;
  companyLogo?: string;
  candidateEmail: string;
  jobTitle: string;
  onVerified: () => void;
};

const WhatsappGlyph = ({ size = 15 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M8 1.6a6.4 6.4 0 00-5.5 9.65L1.7 14.4l3.25-.84A6.4 6.4 0 108 1.6z"
      fill="#25D366"
    />
    <path
      d="M5.6 4.9c-.13-.3-.27-.3-.4-.31h-.34a.66.66 0 00-.48.22 2 2 0 00-.63 1.49c0 .88.64 1.73.73 1.85.09.12 1.24 1.99 3.08 2.71 1.53.6 1.84.48 2.17.45.33-.03 1.07-.44 1.22-.86.15-.42.15-.78.1-.86-.04-.07-.16-.11-.34-.2-.18-.09-1.07-.53-1.23-.59-.17-.06-.29-.09-.4.09-.12.18-.47.58-.57.7-.1.12-.21.13-.39.04a4.9 4.9 0 01-1.45-.9 5.4 5.4 0 01-1-1.24c-.1-.18-.01-.28.08-.37l.27-.31c.09-.11.12-.18.18-.3.06-.12.03-.23-.01-.32-.05-.09-.4-.99-.55-1.34z"
      fill="#fff"
    />
  </svg>
);

const Step3WhatsappTag = () => (
  <span className={styles.step3WaTag}>
    <WhatsappGlyph />
    WhatsApp
  </span>
);

const Step3Intro: React.FC<TStep3IntroProps> = ({
  firstName,
  companyName,
  companyLogo,
  candidateEmail,
  jobTitle,
  onVerified,
}) => {
  const [ready, setReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), STEP3_LOADING_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) {
    return (
      <FlowShell currentStep={3} showJobHeader={false}>
        <ResumeReviewTransition />
      </FlowShell>
    );
  }

  const roadmapItems = [
    <>
      I&apos;ll show you my preliminary thoughts on your fit for this role,
      which we can discuss in detail in our chat.
    </>,
    <>
      We&apos;ll have the discovery chat to fully understand your strengths, on{" "}
      <Step3WhatsappTag /> or web.
    </>,
    <>I prepare and submit your application with my recommendation.</>,
    <>
      You can message me anytime on <Step3WhatsappTag /> or Persevio dashboard
      for a real update on your application.
    </>,
  ];

  return (
    <FlowShell
      currentStep={3}
      jobTitle={jobTitle}
      companyName={companyName}
      companyLogo={companyLogo}
      wide
      showJobHeader={false}
    >
      <section className={styles.step3Hero}>
        <div className={styles.step3HeroGlow} />
        <div className={styles.step3HeroInner}>
          <div className={styles.step3HeroChat}>
            <div className={styles.percyRow} style={{ marginBottom: 0 }}>
              <div className={styles.percyColumn}>
                <PercyAvatar size={54} asset="face" ring={false} />
                <WhoIsPercyButton />
              </div>
              <div className={styles.speechBubble}>
                <div className={styles.speechBubbleTail} />
                Thanks for submitting your resume,{" "}
                <span className={styles.variableToken}>{firstName}</span>.
                I&apos;ve already reviewed it, and I&apos;ll share{" "}
                <span className={styles.step3EmphInk}>
                  my preliminary thoughts on your fit
                </span>{" "}
                for this role on the next page.
              </div>
            </div>
          </div>

          <div className={styles.step3HeroDiscovery}>
            <h2 className={styles.step3DiscoveryTitle}>
              For the next step, the hiring manager would like to invite you to
              a{" "}
              <span className={styles.step3DiscoveryAccent}>
                discovery chat
              </span>{" "}
              with me.
            </h2>
            <p className={styles.step3DiscoveryLead}>
              In this chat, I&apos;ll:
            </p>
            <ul className={styles.step3ChatList}>
              <li className={styles.step3ChatListItem}>
                <span className={styles.step3ChatListDot} />
                <span>
                  Answer any questions you may have about the role and the
                  company.
                </span>
              </li>
              <li className={styles.step3ChatListItem}>
                <span className={styles.step3ChatListDot} />
                <span>
                  Get the full picture of you beyond your resume, so you&apos;re
                  represented{" "}
                  <span className={styles.highlightPhrase}>
                    fairly and accurately
                  </span>
                  .
                </span>
              </li>
            </ul>
            <p className={styles.step3DiscoveryClosing}>
              The employer prioritises the candidates who complete this chat,{" "}
              <span
                className={styles.highlightPhrase}
                style={{ fontWeight: "bold" }}
              >
                so completing it early significantly improves your chances of
                landing an interview.
              </span>
            </p>
          </div>
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
          <h2 className={styles.step3RoadmapTitle}>
            Here&apos;s{" "}
            <span className={styles.step3RoadmapExactly}>exactly</span> what
            happens next
          </h2>
          <div className={styles.step3RoadmapDivider} />
        </div>

        <div className={styles.step3RoadmapList}>
          {roadmapItems.map((item, index) => (
            <div key={index} className={styles.step3RoadmapItem}>
              {index < roadmapItems.length - 1 && (
                <div className={styles.step3RoadmapLine} />
              )}
              <div className={styles.step3RoadmapDisc}>{index + 1}</div>
              <div className={styles.step3RoadmapText}>{item}</div>
            </div>
          ))}
        </div>

        <div className={styles.step3RoadmapCards}>
          {roadmapItems.map((item, index) => (
            <div key={index} className={styles.step3RoadmapCard}>
              <div className={styles.step3RoadmapCardDisc}>{index + 1}</div>
              <div className={styles.step3RoadmapCardText}>{item}</div>
            </div>
          ))}
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
            <div
              className={styles.sheetBackdrop}
              onClick={() => setSheetOpen(false)}
            />
            <div
              className={`${styles.sheetPanel}`}
              style={{ background: "rgb(250, 245, 234)" }}
            >
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
