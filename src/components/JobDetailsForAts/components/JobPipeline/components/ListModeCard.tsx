import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import type { TTalentListItem } from "./types";
import { getStageKey } from "./index";
import { getCandidateCardData } from "./getCandidateCardData";
import EvaluateResultBadge from "@/components/EvaluateResultBadge";
import styles from "../style.module.less";
import { PipelineStage } from "../../JobSettings";

interface IProps {
  allStages: PipelineStage[];
  item: TTalentListItem;
  onCardClick: (item: TTalentListItem) => void;
}

const ListModeCard = ({ allStages, item, onCardClick }: IProps) => {
  const { t } = useTranslation();
  const tKey = (key: string) => t(`job_details.pipeline_section.${key}`);

  const { name, exp, visa, comp, fitResult, summary } =
    getCandidateCardData(item);
  const stageKey = getStageKey(item);
  const stageLabel = allStages.find((s) => s.id === stageKey)?.name || "";
  const daysInStage = item.created_at
    ? dayjs().diff(dayjs(item.created_at), "day")
    : 0;

  return (
    <div className={styles.listModeCard} onClick={() => onCardClick(item)}>
      <div className={styles.listCardHeader}>
        <span className={styles.listCardName}>{name}</span>
        <div className={styles.listCardBadges}>
          <EvaluateResultBadge result={fitResult} />
          <span className={styles.stageBadge}>{stageLabel}</span>
        </div>
      </div>
      <div className={styles.listCardContent}>
        <div className={styles.listCardInfoGrid}>
          <div className={styles.listCardInfoItem}>
            <span className={styles.listCardInfoLabel}>
              {tKey("experience")}
            </span>
            <span className={styles.listCardInfoValue}>{exp}</span>
          </div>
          <div className={styles.listCardInfoItem}>
            <span className={styles.listCardInfoLabel}>
              {tKey("visa_status")}
            </span>
            <span className={styles.listCardInfoValue}>{visa}</span>
          </div>
          <div className={styles.listCardInfoItem}>
            <span className={styles.listCardInfoLabel}>
              {tKey("current_comp")}
            </span>
            <span className={styles.listCardInfoValue}>{comp}</span>
          </div>
          <div className={styles.listCardInfoItem}>
            <span className={styles.listCardInfoLabel}>
              {tKey("days_in_stage")}
            </span>
            <span className={styles.listCardInfoValue}>{daysInStage}</span>
          </div>
        </div>
        {summary ? (
          <div className={styles.listCardSummary}>{summary}</div>
        ) : null}
      </div>
    </div>
  );
};

export default ListModeCard;
