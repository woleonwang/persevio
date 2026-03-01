import { useDraggable } from "@dnd-kit/core";
import { Popover } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

import { getSourcingChannel } from "@/utils";
import type { TTalentListItem } from "./types";
import { getCandidateCardData } from "./getCandidateCardData";
import styles from "../style.module.less";
import PopoverContent from "./PopoverContent";
import EvaluateResultBadge from "@/components/EvaluateResultBadge";
import { useTranslation } from "react-i18next";

interface IProps {
  item: TTalentListItem;
  isDraggable: boolean;
  disabledPopover?: boolean;
  onCardClick: (item: TTalentListItem) => void;
  onUpdateTalent: () => void;
}

const DraggableCard = ({
  item,
  isDraggable,
  disabledPopover,
  onCardClick,
  onUpdateTalent,
}: IProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { item },
    disabled: !isDraggable,
  });

  const [popoverOpen, setPopoverOpen] = useState(false);

  const { t } = useTranslation();
  const tKey = (key: string) => t(`job_details.pipeline_section.${key}`);

  const { name, exp, visa, comp, fitResult, summary } =
    getCandidateCardData(item);
  const sourceChannel = getSourcingChannel(item.source_channel);
  const sourceLabel = tKey(`sourcing_channel.${sourceChannel}`);
  const lastActivity = item.created_at;
  const lastActivityStr = lastActivity
    ? (() => {
        const d = dayjs(lastActivity);
        const diffDays = dayjs().diff(d, "day");
        if (diffDays < 1) return d.format("HH:mm");
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.format("MMM D");
      })()
    : "-";

  return (
    <Popover
      content={<PopoverContent talent={item} onUpdateTalent={onUpdateTalent} />}
      trigger="hover"
      placement="right"
      mouseEnterDelay={0.5}
      open={!disabledPopover && popoverOpen && !isDragging}
      onOpenChange={setPopoverOpen}
    >
      <div
        ref={setNodeRef}
        className={`${styles.candidateCard} ${
          isDraggable ? styles.candidateCardDraggable : ""
        }`}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        onClick={() => onCardClick(item)}
        {...(isDraggable ? { ...attributes, ...listeners } : {})}
      >
        <div className={styles.cardHeader}>
          <div className={styles.cardName}>{name}</div>
        </div>
        <div className={styles.cardDivider} />
        <div className={styles.cardBody}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Fit</span>
            <span className={`${styles.infoValue}`}>
              <EvaluateResultBadge result={fitResult} />
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Exp</span>
            <span className={styles.infoValue}>{exp}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Visa</span>
            <span className={styles.infoValue}>{visa}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Comp</span>
            <span className={styles.infoValue}>{comp}</span>
          </div>
        </div>
        <div className={styles.cardDivider} />
        <div className={styles.cardFooter}>
          <span className={styles.sourceLink}>{sourceLabel}</span>
          <span className={styles.activityTime}>{lastActivityStr}</span>
        </div>
        {summary && <div className={styles.cardSummary}>{summary}</div>}
      </div>
    </Popover>
  );
};

export default DraggableCard;
