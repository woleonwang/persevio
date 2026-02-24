import classnames from "classnames";
import Icon from "../Icon";
import IdealCandidateIcon from "@/assets/icons/ideal-candidate";
import GoodFitIcon from "@/assets/icons/good-fit";
import RecommendWithReservationIcon from "@/assets/icons/recommend-with-reservation";
import NotAFitIcon from "@/assets/icons/not-a-fit";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";

interface IProps {
  result:
    | "ideal_candidate"
    | "good_fit"
    | "ideal_candidate_with_caveat"
    | "good_fit_with_caveat"
    | "maybe"
    | "not_a_fit";
  caveat?: string;
}

const EvaluateResultBadge = (props: IProps) => {
  const { result } = props;
  const { t: originalT } = useTranslation();

  const t = (key: string, params?: Record<string, string>) =>
    originalT(`job_talents.evaluate_result_options.${key}`, params);

  const iconMappings = {
    ideal_candidate: <IdealCandidateIcon />,
    good_fit: <GoodFitIcon />,
    ideal_candidate_with_caveat: <RecommendWithReservationIcon />,
    good_fit_with_caveat: <RecommendWithReservationIcon />,
    maybe: <RecommendWithReservationIcon />,
    not_a_fit: <NotAFitIcon />,
  };

  return (
    <div className={classnames(styles.badge, styles[result])}>
      <Icon icon={iconMappings[result]} />
      {t(result, { caveat: props.caveat ?? "" })}
    </div>
  );
};

export default EvaluateResultBadge;
