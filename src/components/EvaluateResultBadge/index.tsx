import classnames from "classnames";
import Icon from "../Icon";
import IdealCandidateIcon from "@/assets/icons/ideal-candidate";
import GoodFitIcon from "@/assets/icons/good-fit";
import RecommendWithReservationIcon from "@/assets/icons/recommend-with-reservation";
import NotAFitIcon from "@/assets/icons/not-a-fit";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";

interface IProps {
  result?:
    | "ideal_candidate"
    | "good_fit"
    | "recommend_with_reservations"
    | "not_a_fit";
}

const EvaluateResultBadge = (props: IProps) => {
  const { result = "recommend_with_reservations" } = props;
  const { t: originalT } = useTranslation();
  const t = (key: string) =>
    originalT(`job_talents.evaluate_result_options.${key}`);

  const iconMappings = {
    ideal_candidate: <IdealCandidateIcon />,
    good_fit: <GoodFitIcon />,
    recommend_with_reservations: <RecommendWithReservationIcon />,
    not_a_fit: <NotAFitIcon />,
  };

  return (
    <div className={classnames(styles.badge, styles[result])}>
      <Icon icon={iconMappings[result]} />
      {t(result)}
    </div>
  );
};

export default EvaluateResultBadge;
