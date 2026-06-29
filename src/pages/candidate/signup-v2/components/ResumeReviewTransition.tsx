import { useEffect, useState } from "react";

import PercyAvatar from "./PercyAvatar";
import styles from "../style.module.less";

const RESUME_LINE_WIDTHS = [88, 72, 80, 58, 76, 66];
const COUNTDOWN_RING_RADIUS = 52;
const COUNTDOWN_RING_STROKE = 5;

type TResumeReviewTransitionProps = {
  slowMessage?: boolean;
  showCountdownRing?: boolean;
  countdownSeconds?: number;
};

const ResumeReviewTransition: React.FC<TResumeReviewTransitionProps> = ({
  slowMessage,
  showCountdownRing,
  countdownSeconds = 10,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);
  const [progress, setProgress] = useState(1);
  const circumference = 2 * Math.PI * COUNTDOWN_RING_RADIUS;
  const ringSize = (COUNTDOWN_RING_RADIUS + COUNTDOWN_RING_STROKE) * 2;

  useEffect(() => {
    if (!showCountdownRing) {
      return;
    }

    const durationMs = countdownSeconds * 1000;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remainingMs = Math.max(0, durationMs - elapsed);
      setProgress(remainingMs / durationMs);
      setSecondsLeft(Math.max(1, Math.ceil(remainingMs / 1000)));
      if (remainingMs <= 0) {
        window.clearInterval(timer);
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, [countdownSeconds, showCountdownRing]);

  return (
    <div className={`${styles.transitionWrap} ${styles.reviewingAnim}`}>
      <div
        className={`${styles.reviewingAvatarWrap} ${
          showCountdownRing ? styles.reviewingAvatarWrapCountdown : ""
        }`}
      >
        {showCountdownRing && (
          <svg
            className={styles.reviewingCountdownRing}
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
            aria-hidden="true"
          >
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={COUNTDOWN_RING_RADIUS}
              fill="none"
              stroke="#ECE3D1"
              strokeWidth={COUNTDOWN_RING_STROKE}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={COUNTDOWN_RING_RADIUS}
              fill="none"
              stroke="#398FFB"
              strokeWidth={COUNTDOWN_RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            />
          </svg>
        )}
        {!showCountdownRing && (
          <>
            <span
              className={`${styles.reviewingRing} ${styles.reviewingRingDelay}`}
            />
            <span className={styles.reviewingRing} />
          </>
        )}
        <PercyAvatar size={92} asset="face" />
        <div className={styles.reviewingResumeCard}>
          <div className={styles.reviewingResumeLines}>
            <div className={styles.reviewingResumeAccentLine} />
            {RESUME_LINE_WIDTHS.map((width, index) => (
              <div
                key={width}
                className={styles.reviewingResumeLine}
                style={{
                  width: `${width}%`,
                  animationDelay: `${index * 0.12}s`,
                }}
              />
            ))}
          </div>
          <div className={styles.reviewingScanLine} />
        </div>
      </div>

      {showCountdownRing && (
        <div className={styles.reviewingCountdownLabel}>{secondsLeft}s</div>
      )}

      <h2 className={styles.reviewingTitle}>
        Reviewing your resume
        <span className={styles.reviewingDots} aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={styles.reviewingDot}
              style={{ animationDelay: `${index * 0.18}s` }}
            />
          ))}
        </span>
      </h2>

      <p className={styles.bodyText} style={{ marginTop: 11, maxWidth: 290 }}>
        I'm reading through your background and putting together my initial
        thoughts on your fit to this role.
      </p>

      {slowMessage && (
        <p className={styles.reviewingSlowMessage}>
          Almost done. I'm being thorough.
        </p>
      )}
    </div>
  );
};

export default ResumeReviewTransition;
