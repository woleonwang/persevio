import { useEffect, useRef, useState } from "react";

import PercyAvatar from "./PercyAvatar";
import styles from "../style.module.less";

const COUNTDOWN_RING_RADIUS = 50;
const COUNTDOWN_RING_STROKE = 4;
const COUNTDOWN_RING_SIZE = 132;

type TPercyCountdownTransitionProps = {
  seconds?: number;
  title: React.ReactNode;
  titleClassName?: string;
  lead: string;
  countdownHint: string;
  countdownDoneHint?: string;
  leadMaxWidth?: number;
  onCountdownComplete?: () => void;
};

const PercyCountdownTransition: React.FC<TPercyCountdownTransitionProps> = ({
  seconds = 10,
  title,
  titleClassName,
  lead,
  countdownHint,
  countdownDoneHint,
  leadMaxWidth = 300,
  onCountdownComplete,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const onCompleteRef = useRef(onCountdownComplete);
  onCompleteRef.current = onCountdownComplete;
  const circumference = 2 * Math.PI * COUNTDOWN_RING_RADIUS;
  const progress = secondsLeft / seconds;

  useEffect(() => {
    if (secondsLeft <= 0) {
      onCompleteRef.current?.();
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

      <h2
        className={titleClassName ?? styles.step3TransitionTitle}
      >
        {title}
      </h2>
      <p
        className={styles.step3TransitionLead}
        style={{ maxWidth: leadMaxWidth }}
      >
        {lead}
      </p>

      <div className={styles.step3TransitionCountdownPill}>
        <span className={styles.step3TransitionCountdownValue}>
          {Math.max(0, secondsLeft)}s
        </span>
        <span className={styles.step3TransitionCountdownHint}>
          {secondsLeft > 0 || !countdownDoneHint
            ? countdownHint
            : countdownDoneHint}
        </span>
      </div>
    </div>
  );
};

export default PercyCountdownTransition;
