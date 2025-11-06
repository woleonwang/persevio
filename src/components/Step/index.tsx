import styles from "./style.module.less";
import classnames from "classnames";

interface IStepProps {
  stepCount: number;
  currentIndex: number;
  style?: React.CSSProperties;
  className?: string;
  width?: number;
}

const Step = ({
  stepCount,
  currentIndex,
  style,
  className,
  width = 120,
}: IStepProps) => {
  return (
    <div className={classnames(styles.stepContainer, className)} style={style}>
      {new Array(stepCount).fill(0).map((_, index) => {
        return (
          <div
            key={index}
            className={classnames(styles.step, {
              [styles.active]: index <= currentIndex,
            })}
            style={{ width }}
          >
            Step {index + 1}
          </div>
        );
      })}
    </div>
  );
};

export default Step;
