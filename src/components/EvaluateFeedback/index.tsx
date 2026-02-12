import classnames from "classnames";
import Icon from "../Icon";

import GoodFitOutlined from "@/assets/icons/good-fit-outlined";
import Inaccurate from "@/assets/icons/inaccurate";
import InaccurateOutline from "@/assets/icons/inaccurate-outline";
import GoodFit from "@/assets/icons/good-fit";
import SlightlyOffOutline from "@/assets/icons/slightly-off-outline";
import SlightlyOff from "@/assets/icons/slightly-off";

import styles from "./style.module.less";

interface IProps {
  feedback?: "accurate" | "slightly_inaccurate" | "inaccurate";
}
const EvaluateFeedback = (props: IProps) => {
  const { feedback } = props;

  if (!feedback) {
    return (
      <div className={styles.evaluateFeedback}>
        <Icon
          icon={<GoodFitOutlined />}
          className={classnames(styles.goodFitIconOutline, styles.icon)}
        />
        <Icon
          icon={<SlightlyOffOutline />}
          className={classnames(styles.slightlyOffIconOutline, styles.icon)}
        />
        <Icon
          icon={<InaccurateOutline />}
          className={classnames(styles.inaccurateIconOutline, styles.icon)}
        />
      </div>
    );
  }

  return (
    <div className={styles.evaluateFeedback}>
      {feedback === "accurate" && (
        <Icon icon={<GoodFit />} className={classnames(styles.goodFitIcon)} />
      )}
      {feedback === "slightly_inaccurate" && (
        <Icon
          icon={<SlightlyOff />}
          className={classnames(styles.slightlyOffIcon)}
        />
      )}
      {feedback === "inaccurate" && (
        <Icon
          icon={<Inaccurate />}
          className={classnames(styles.inaccurateIcon)}
        />
      )}
    </div>
  );
};

export default EvaluateFeedback;
