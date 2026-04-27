import classnames from "classnames";
import Icon from "../Icon";
import IdealCandidateIcon from "@/assets/icons/ideal-candidate";
import GoodFitIcon from "@/assets/icons/good-fit";
import RecommendWithReservationIcon from "@/assets/icons/recommend-with-reservation";
import NotAFitIcon from "@/assets/icons/not-a-fit";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";

interface IProps {
  result: TInterviewRecommendation;
  size?: "small" | "normal";
}

const EvaluateResultBadge = (props: IProps) => {
  const { result, size = "normal" } = props;
  const { t: originalT } = useTranslation();

  const t = (key: string, params?: Record<string, string>) =>
    originalT(`job_talents.evaluate_result_options.${key}`, params);

  const iconMappings: Record<TInterviewRecommendation, React.ReactNode> = {
    absolutely: <IdealCandidateIcon />,
    yes: <GoodFitIcon />,
    yes_but: <RecommendWithReservationIcon />,
    maybe: <RecommendWithReservationIcon />,
    no: <NotAFitIcon />,
  };

  return (
    <div className={classnames(styles.badge, styles[result], styles[size])}>
      {size === "normal" && <Icon icon={iconMappings[result]} />}
      {t(result)}
    </div>
  );
};

export default EvaluateResultBadge;
