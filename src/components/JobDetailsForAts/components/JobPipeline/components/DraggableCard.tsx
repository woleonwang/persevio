import { useDraggable } from "@dnd-kit/core";
import { Checkbox } from "antd";
import dayjs from "dayjs";

import { getEvaluateResultLevel } from "@/utils";
import type { TDataSourceItem } from "./types";
import { SOURCING_CHANNEL_OPTIONS } from "./types";
import styles from "../style.module.less";

interface IProps {
  item: TDataSourceItem;
  isDraggable: boolean;
  onCardClick: () => void;
}

const DraggableCard = ({ item, isDraggable, onCardClick }: IProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { item },
    disabled: !isDraggable,
  });

  const name = item.talent?.name || "-";
  const basicInfo = item.talent?.basicInfo;
  const evaluateResult = item.talent?.parsedEvaluateResult;
  const fitLevel = getEvaluateResultLevel(
    evaluateResult?.overall_recommendation?.result ?? evaluateResult?.result
  );
  const fitLabel =
    fitLevel === "ideal_candidate" || fitLevel === "ideal_candidate_with_caveat"
      ? "High"
      : fitLevel === "good_fit" || fitLevel === "good_fit_with_caveat"
        ? "Medium"
        : "Low";
  const exp = basicInfo?.years_of_experience || "-";
  const visa = basicInfo?.visa || "-";
  const comp = basicInfo?.current_compensation || "-";
  const sourceChannel = item.talent?.source_channel || "persevio";
  const sourceLabel =
    SOURCING_CHANNEL_OPTIONS.find((o) => o.value === sourceChannel)?.label ||
    sourceChannel;
  const lastActivity = item.talent?.created_at;
  const lastActivityStr = lastActivity
    ? (() => {
        const d = dayjs(lastActivity);
        const diffDays = dayjs().diff(d, "day");
        if (diffDays < 1) return d.format("HH:mm");
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.format("MMM D");
      })()
    : "-";
  const summary =
    evaluateResult?.thumbnail_summary || evaluateResult?.summary || "";

  return (
    <div
      ref={setNodeRef}
      className={`${styles.candidateCard} ${isDraggable ? styles.candidateCardDraggable : ""}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={onCardClick}
      {...(isDraggable ? { ...attributes, ...listeners } : {})}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardCheckbox} onClick={(e) => e.stopPropagation()}>
          <Checkbox />
        </div>
        <div className={styles.cardTitle}>
          <div className={styles.cardName}>{name}</div>
          <div className={styles.cardMeta}>
            <span
              className={`${styles.cardMetaTag} ${styles.cardMetaTagFit} ${fitLabel.toLowerCase()}`}
            >
              Fit: {fitLabel}
            </span>
            <span className={styles.cardMetaTag}>Exp: {exp}</span>
            <span className={styles.cardMetaTag}>Visa: {visa}</span>
            <span className={styles.cardMetaTag}>Comp: {comp}</span>
          </div>
        </div>
      </div>
      <div className={styles.cardFooter}>
        {sourceLabel} · {lastActivityStr}
      </div>
      {summary && <div className={styles.cardSummary}>{summary}</div>}
    </div>
  );
};

export default DraggableCard;
