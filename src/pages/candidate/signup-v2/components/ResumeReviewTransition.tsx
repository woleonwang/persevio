import PercyAvatar from "./PercyAvatar";
import styles from "../style.module.less";

const RESUME_LINE_WIDTHS = [88, 72, 80, 58, 76, 66];

type TResumeReviewTransitionProps = {
  slowMessage?: boolean;
};

const ResumeReviewTransition: React.FC<TResumeReviewTransitionProps> = ({
  slowMessage,
}) => {
  return (
    <div className={`${styles.transitionWrap} ${styles.reviewingAnim}`}>
      <div className={styles.reviewingAvatarWrap}>
        <span
          className={`${styles.reviewingRing} ${styles.reviewingRingDelay}`}
        />
        <span className={styles.reviewingRing} />
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
