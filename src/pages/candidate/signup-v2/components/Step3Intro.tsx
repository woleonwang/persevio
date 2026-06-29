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

const ROADMAP_ITEMS = [
  "I have reviewed your resume and will share my honest first read on your fit immediately after you proceed to the next step",
  "We'll have a short discovery chat so I understand you beyond your resume",
  "I'll prepare and submit your application with my recommendations",
  "Message me on WhatsApp or Persevio anytime when you want an update",
];

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

  return (
    <FlowShell
      currentStep={3}
      jobTitle={jobTitle}
      companyName={companyName}
      companyLogo={companyLogo}
      wide
      showJobHeader={false}
    >
      <section className={styles.step3HeroV2}>
        <div className={styles.step3HeroGlow} />
        <div className={styles.step3HeroV2Layout}>
          <div className={styles.step3HeroV2AvatarCol}>
            <PercyAvatar size={108} asset="face" />
            <WhoIsPercyButton />
          </div>

          <div className={styles.step3HeroV2Copy}>
            <p className={styles.step3HeroV2Thanks}>
              Thanks for submitting your resume,{" "}
              <span className={styles.variableToken}>{displayName}</span>.
            </p>

            <p className={styles.step3HeroV2Body}>
              The next step is a{" "}
              <span className={styles.highlightPhraseSerif}>
                discovery chat
              </span>{" "}
              with me. This chat is{" "}
              <span className={styles.highlightPhrase}>
                required by the hiring manager
              </span>
              , designed to get the full picture of you beyond the incomplete
              information on your resume, so you are represented{" "}
              <span className={styles.highlightPhrase}>fairly</span> and{" "}
              <span className={styles.highlightPhrase}>accurately.</span>
            </p>

            <p className={styles.step3HeroV2Headline}>
              Completing this chat will{" "}
              <span className={styles.highlightPhraseSerif}>
                significantly increase your chance of landing an interview.
              </span>
            </p>

            <div className={styles.step3HeroV2WhatsappNote}>
              <Icon
                icon={<Whatsapp />}
                style={{ fontSize: 12, position: "relative", top: 4 }}
              />
              <span>
                You&apos;ll also be able to message me anytime on{" "}
                <span className={styles.step3HeroV2WhatsappLabel}>
                  WhatsApp
                </span>{" "}
                or on your dashboard on Persevio for application updates after
                our conversation.
              </span>
            </div>

            <div
              className={`${styles.step3HeroV2DesktopCta} ${styles.desktopVisible}`}
            >
              <SignupPrimaryButton onClick={onContinue}>
                Continue your application →
              </SignupPrimaryButton>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.step3Roadmap}>
        <div className={styles.step3RoadmapHeader}>
          <div className={styles.step3RoadmapEyebrow}>What happens next</div>
          <h2 className={styles.step3RoadmapTitleV2}>
            Here&apos;s how I&apos;ll help from here
          </h2>
        </div>

        <div className={styles.step3RoadmapList}>
          {ROADMAP_ITEMS.map((item, index) => (
            <div key={index} className={styles.step3RoadmapItem}>
              {index < ROADMAP_ITEMS.length - 1 && (
                <div className={styles.step3RoadmapLine} />
              )}
              <div className={styles.step3RoadmapDisc}>{index + 1}</div>
              <div className={styles.step3RoadmapText}>{item}</div>
            </div>
          ))}
        </div>

        <div className={styles.step3RoadmapCards}>
          {ROADMAP_ITEMS.map((item, index) => (
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
