import PercyCountdownTransition from "./PercyCountdownTransition";
import styles from "../style.module.less";

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
  const displayName = firstName.trim() || "there";

  return (
    <PercyCountdownTransition
      seconds={seconds}
      title={
        <>
          Getting things ready,{" "}
          <span className={styles.variableToken}>{displayName}</span>…
        </>
      }
      lead="Give me a moment. I'm lining up your next step and pulling your resume into view."
      countdownHint="until your next step"
      countdownDoneHint="here we go…"
      onCountdownComplete={onComplete}
    />
  );
};

export default Step3Transition;
