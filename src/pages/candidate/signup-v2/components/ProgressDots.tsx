import classnames from "classnames";

import { FLOW_STEP_COUNT } from "../constants";
import styles from "../style.module.less";

type TProgressDotsProps = {
  current: number;
  total?: number;
};

const ProgressDots: React.FC<TProgressDotsProps> = ({
  current,
  total = FLOW_STEP_COUNT,
}) => {
  return (
    <div className={styles.progressDots}>
      {Array.from({ length: total }).map((_, index) => {
        const step = index + 1;
        return (
          <div
            key={step}
            className={classnames(styles.progressDot, {
              [styles.progressDotActive]: step === current,
              [styles.progressDotDone]: step < current,
            })}
          />
        );
      })}
    </div>
  );
};

export default ProgressDots;
