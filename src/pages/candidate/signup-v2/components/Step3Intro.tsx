import { useState } from "react";

import FlowShell, { SignupPrimaryButton } from "./FlowShell";
import PercyAvatar from "./PercyAvatar";
import Step3Transition from "./Step3Transition";
import WhoIsPercyButton from "./WhoIsPercyButton";
import styles from "../style.module.less";
import Whatsapp from "@/assets/icons/whatsapp";
import Icon from "@/components/Icon";

type TStep3IntroProps = {
  firstName: string;
  companyName: string;
  companyLogo?: string;
  jobTitle: string;
  onContinue: () => void;
};

const Step3WhatsappTag = () => (
  <span className={styles.step3WaTag}>
    <Icon icon={<Whatsapp />} style={{ fontSize: 12 }} />
    WhatsApp
  </span>
);

const Step3Intro: React.FC<TStep3IntroProps> = ({
  firstName,
  companyName,
  companyLogo,
  jobTitle,
  onContinue,
}) => {
  const [ready, setReady] = useState(false);
  const displayName = firstName.trim() || "there";

  if (!ready) {
    return (
      <FlowShell currentStep={3} showJobHeader={false}>
        <Step3Transition
          firstName={displayName}
          onComplete={() => setReady(true)}
        />
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
                <span className={styles.variableToken}>{displayName}</span>.
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

      <div className={`${styles.step3ContinueWrap} ${styles.desktopVisible}`}>
        <SignupPrimaryButton onClick={onContinue}>
          Continue your application →
        </SignupPrimaryButton>
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
          <SignupPrimaryButton onClick={onContinue}>
            Continue your application →
          </SignupPrimaryButton>
        </div>
      </div>
    </FlowShell>
  );
};

export default Step3Intro;
