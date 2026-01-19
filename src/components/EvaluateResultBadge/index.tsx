import classnames from "classnames";
import Icon from "../Icon";
import IdealCandidateIcon from "@/assets/icons/ideal-candidate";

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

  return (
    <div className={classnames(styles.badge, styles[result])}>
      <Icon icon={<IdealCandidateIcon />} />
      {t(result)}
    </div>
  );
};

export default EvaluateResultBadge;
