import { useEffect, useRef, useState } from "react";

import PercyAvatar from "./PercyAvatar";
import styles from "../style.module.less";

const COUNTDOWN_RING_RADIUS = 50;
const COUNTDOWN_RING_STROKE = 4;
const COUNTDOWN_RING_SIZE = 132;

type TStep3TransitionProps = {
  firstName: string;
  seconds?: number;
  onComplete: () => void;
};

const Step3Transition: React.FC<TStep3TransitionProps> = ({
  firstName,
  seconds = 10,
  onComplete,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const circumference = 2 * Math.PI * COUNTDOWN_RING_RADIUS;
  const progress = secondsLeft / seconds;
  const displayName = firstName.trim() || "there";

  useEffect(() => {
    if (secondsLeft <= 0) {
      onCompleteRef.current();
      return;
    }
    const timer = window.setTimeout(() => {
      setSecondsLeft((value) => value - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <div className={`${styles.step3Transition} ${styles.reviewingAnim}`}>
      <div className={styles.step3TransitionRingWrap}>
        <span
          className={styles.step3TransitionPulseRing}
          style={{ animationDelay: "0s" }}
        />
        <span
          className={styles.step3TransitionPulseRing}
          style={{ animationDelay: "0.8s" }}
        />
        <span
          className={styles.step3TransitionPulseRing}
          style={{ animationDelay: "1.6s" }}
        />
        <svg
          className={styles.step3TransitionCountdownSvg}
          width={COUNTDOWN_RING_SIZE}
          height={COUNTDOWN_RING_SIZE}
          viewBox={`0 0 ${COUNTDOWN_RING_SIZE} ${COUNTDOWN_RING_SIZE}`}
          aria-hidden="true"
        >
          <circle
            cx={COUNTDOWN_RING_SIZE / 2}
            cy={COUNTDOWN_RING_SIZE / 2}
            r={COUNTDOWN_RING_RADIUS}
            fill="none"
            stroke="#ECE3D1"
            strokeWidth={COUNTDOWN_RING_STROKE}
          />
          <circle
            cx={COUNTDOWN_RING_SIZE / 2}
            cy={COUNTDOWN_RING_SIZE / 2}
            r={COUNTDOWN_RING_RADIUS}
            fill="none"
            stroke="#398FFB"
            strokeWidth={COUNTDOWN_RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform={`rotate(-90 ${COUNTDOWN_RING_SIZE / 2} ${COUNTDOWN_RING_SIZE / 2})`}
            className={styles.step3TransitionProgressRing}
          />
        </svg>
        <PercyAvatar size={88} asset="face" ring={false} />
      </div>

      <h2 className={styles.step3TransitionTitle}>
        Getting things ready,{" "}
        <span className={styles.variableToken}>{displayName}</span>…
      </h2>
      <p className={styles.step3TransitionLead}>
        Give me a moment. I&apos;m lining up your next step and pulling your
        resume into view.
      </p>

      <div className={styles.step3TransitionCountdownPill}>
        <span className={styles.step3TransitionCountdownValue}>
          {Math.max(0, secondsLeft)}s
        </span>
        <span className={styles.step3TransitionCountdownHint}>
          {secondsLeft > 0 ? "until your next step" : "here we go…"}
        </span>
      </div>
    </div>
  );
};

export default Step3Transition;
