import { useDroppable } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useRef, useState } from "react";

import type { PipelineStage } from "../../JobSettings";
import { getInitials } from "./utils";
import DraggableCard from "./DraggableCard";
import styles from "../style.module.less";
import dayjs from "dayjs";
import { getEvaluateResultLevel } from "@/utils";
import { EVALUATE_INTERVIEW_RECOMMENDATION_KEYS } from "@/utils/consts";

interface IProps {
  stage: PipelineStage;
  items: TTalentListItem[] | TLinkedinProfile[];
  isLocked: boolean;
  onCardClick: (item: TTalentListItem) => void;
  onUpdateTalent: () => void;
  onGoToReachedOut: () => void;
  renderReachedOutSummary?: boolean;
  onMarkViewed?: (talentId: number) => void;
}

const DroppableColumn = ({
  stage,
  items,
  isLocked,
  onCardClick,
  onUpdateTalent,
  onGoToReachedOut,
  renderReachedOutSummary,
  onMarkViewed,
}: IProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
  });
  const [isColumnScrolling, setIsColumnScrolling] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { t } = useTranslation();
  const tKey = (key: string) => t(`job_details.pipeline_section.${key}`);

  const clearScrollTimer = useCallback(() => {
    if (!scrollTimerRef.current) {
      return;
    }
    clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = null;
  }, []);

  const handleColumnScroll = useCallback(() => {
    setIsColumnScrolling(true);
    clearScrollTimer();
    scrollTimerRef.current = setTimeout(() => {
      setIsColumnScrolling(false);
      scrollTimerRef.current = null;
    }, 200);
  }, [clearScrollTimer]);

  useEffect(() => {
    return () => {
      clearScrollTimer();
    };
  }, [clearScrollTimer]);

  const unreadCount = !renderReachedOutSummary
    ? (items as TTalentListItem[]).filter((t) => !t.viewed_at).length
    : 0;

  return (
    <div
      ref={setNodeRef}
      className={styles.kanbanColumn}
      style={{
        border: !isLocked && isOver ? "2px dashed #1890ff" : undefined,
      }}
    >
      <div className={styles.columnHeader}>
        <span className={styles.columnTitle}>{stage.name}</span>
        <div className={styles.columnHeaderRight}>
          <span className={styles.columnCount}>{items.length}</span>
          {unreadCount > 0 && (
            <span className={styles.columnUnreadBadge}>{unreadCount}</span>
          )}
        </div>
      </div>
      <div className={styles.columnContent} onScroll={handleColumnScroll}>
        {renderReachedOutSummary && (
          <div
            className={styles.reachedOutSummary}
            onClick={() => onGoToReachedOut()}
          >
            <div className={styles.reachedOutTop}>
              <div className={styles.reachedOutLeft}>
                <div className={styles.reachedOutNumber}>{items.length}</div>
              </div>
              <div className={styles.reachedOutAvatars}>
                {items.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className={styles.avatarCircle}
                    title={item.name}
                  >
                    {getInitials(item.name || "?")}
                  </div>
                ))}
                {items.length > 5 && (
                  <div className={styles.avatarCircleEllipsis}>⋯</div>
                )}
              </div>
            </div>
            <div className={styles.reachedOutLabel}>
              {tKey("candidates_reached_out")}
            </div>
            <div className={styles.reachedOutDivider} />
            <div className={styles.reachedOutBottom}>
              <span className={styles.reachedOutLinkText}>
                {tKey("click_to_view_details")}
              </span>
              <span className={styles.reachedOutArrow}>→</span>
            </div>
          </div>
        )}
        {!renderReachedOutSummary &&
          (items as TTalentListItem[])
            .sort((a, b) => {
              const fitLevelA = getEvaluateResultLevel(a.parsedEvaluateResult);
              const fitLevelB = getEvaluateResultLevel(b.parsedEvaluateResult);

              if (!a.cachedViewedAt && fitLevelA !== "no" && b.cachedViewedAt) {
                return -1;
              } else if (
                !b.cachedViewedAt &&
                fitLevelB !== "no" &&
                a.cachedViewedAt
              ) {
                return 1;
              } else if (fitLevelA === fitLevelB) {
                return dayjs(b.created_at).diff(dayjs(a.created_at));
              } else {
                return (
                  EVALUATE_INTERVIEW_RECOMMENDATION_KEYS.indexOf(fitLevelA) -
                  EVALUATE_INTERVIEW_RECOMMENDATION_KEYS.indexOf(fitLevelB)
                );
              }
            })
            .map((item) => {
              const talent = item as TTalentListItem;
              const isRejected = talent.stageKey === "rejected";
              return (
                <DraggableCard
                  key={talent.id}
                  item={talent}
                  isDraggable={!isRejected}
                  disabledPopover={isColumnScrolling}
                  onCardClick={() => onCardClick(talent)}
                  onUpdateTalent={onUpdateTalent}
                  onViewed={onMarkViewed}
                />
              );
            })}
      </div>
    </div>
  );
};

export default DroppableColumn;
