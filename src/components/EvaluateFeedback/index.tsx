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
  value?: "accurate" | "slightly_inaccurate" | "inaccurate";
  onChange?: (value: "accurate" | "slightly_inaccurate" | "inaccurate") => void;
  onOpen?: () => void;
}
const EvaluateFeedback = (props: IProps) => {
  const { value, onChange, onOpen } = props;

  const _onChange = (
    e: React.MouseEvent<HTMLSpanElement>,
    value: "accurate" | "slightly_inaccurate" | "inaccurate"
  ) => {
    e.stopPropagation();
    onChange?.(value);
  };

  const _onOpen = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    onOpen?.();
  };

  if (!value) {
    return (
      <div className={styles.evaluateFeedback}>
        <Icon
          icon={<GoodFitOutlined />}
          className={classnames(styles.goodFitIconOutline, styles.icon)}
          onClick={(e) => _onChange(e, "accurate")}
        />
        <Icon
          icon={<SlightlyOffOutline />}
          className={classnames(styles.slightlyOffIconOutline, styles.icon)}
          onClick={(e) => _onChange(e, "slightly_inaccurate")}
        />
        <Icon
          icon={<InaccurateOutline />}
          className={classnames(styles.inaccurateIconOutline, styles.icon)}
          onClick={(e) => _onChange(e, "inaccurate")}
        />
      </div>
    );
  }

  return (
    <div className={styles.evaluateFeedback}>
      {value === "accurate" && (
        <Icon
          icon={<GoodFit />}
          className={classnames(styles.goodFitIcon)}
          onClick={(e) => _onOpen(e)}
        />
      )}
      {value === "slightly_inaccurate" && (
        <Icon
          icon={<SlightlyOff />}
          className={classnames(styles.slightlyOffIcon)}
          onClick={(e) => _onOpen(e)}
        />
      )}
      {value === "inaccurate" && (
        <Icon
          icon={<Inaccurate />}
          className={classnames(styles.inaccurateIcon)}
          onClick={(e) => _onOpen(e)}
        />
      )}
    </div>
  );
};

export default EvaluateFeedback;
