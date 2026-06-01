import { useDroppable } from "@dnd-kit/core";
import { CaretDownOutlined, CaretUpOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useRef, useState } from "react";

import type { PipelineStage } from "../../JobSettings";
import { getInitials } from "./utils";
import DraggableCard from "./DraggableCard";
import styles from "../style.module.less";
import dayjs from "dayjs";
import { getEvaluateResultLevel } from "@/utils";
import { EVALUATE_INTERVIEW_RECOMMENDATION_KEYS } from "@/utils/consts";
import { Tooltip } from "antd";

interface IProps {
  stage: PipelineStage;
  items: TTalentListItem[] | TLinkedinProfile[];
  isLocked: boolean;
  onCardClick: (item: TTalentListItem) => void;
  onUpdateTalent: () => void;
  onStartCalibrationConversation: (
    params: TStartCalibrationConversationParams,
  ) => void;
  onGoToReachedOut: () => void;
  renderReachedOutSummary?: boolean;
  onMarkViewed?: (talentId: number) => void;
  unsuitableCollapseEnabled?: boolean;
  showUnsuitableExpanded?: boolean;
  onToggleUnsuitableExpanded?: () => void;
}

const DroppableColumn = ({
  stage,
  items,
  isLocked,
  onCardClick,
  onUpdateTalent,
  onStartCalibrationConversation,
  onGoToReachedOut,
  renderReachedOutSummary,
  onMarkViewed,
  unsuitableCollapseEnabled,
  showUnsuitableExpanded,
  onToggleUnsuitableExpanded,
}: IProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
  });
  const [isColumnScrolling, setIsColumnScrolling] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { t } = useTranslation();
  const tKey = (key: string, params: Record<string, string> = {}) =>
    t(`job_details.pipeline_section.${key}`, params);

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
        <Tooltip title={stage.name}>
          <span className={styles.columnTitle}>{stage.name}</span>
        </Tooltip>
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
          (() => {
            const talents = items as TTalentListItem[];
            const sorted = [...talents].sort((a, b) => {
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
            });

            const renderTalentCard = (talent: TTalentListItem) => {
              return (
                <DraggableCard
                  key={talent.id}
                  item={talent}
                  isDraggable
                  disabledPopover={isColumnScrolling}
                  onCardClick={() => onCardClick(talent)}
                  onUpdateTalent={onUpdateTalent}
                  onStartCalibrationConversation={
                    onStartCalibrationConversation
                  }
                  onViewed={onMarkViewed}
                />
              );
            };

            if (!unsuitableCollapseEnabled) {
              return sorted.map(renderTalentCard);
            }

            const suitable: TTalentListItem[] = [];
            const unsuitable: TTalentListItem[] = [];
            for (const t of sorted) {
              if (getEvaluateResultLevel(t.parsedEvaluateResult) === "no") {
                unsuitable.push(t);
              } else {
                suitable.push(t);
              }
            }

            if (unsuitable.length === 0) {
              return sorted.map(renderTalentCard);
            }

            const expanded = showUnsuitableExpanded === true;
            const n = unsuitable.length;

            return (
              <>
                {suitable.map(renderTalentCard)}
                <div
                  className={styles.unsuitableToggleBar}
                  onClick={() => onToggleUnsuitableExpanded?.()}
                >
                  {expanded ? (
                    <CaretUpOutlined className={styles.unsuitableToggleIcon} />
                  ) : (
                    <CaretDownOutlined
                      className={styles.unsuitableToggleIcon}
                    />
                  )}
                  {expanded
                    ? tKey("hide_unsuitable", { count: String(n) })
                    : tKey("show_unsuitable", { count: String(n) })}
                </div>
                {expanded ? unsuitable.map(renderTalentCard) : null}
              </>
            );
          })()}
      </div>
    </div>
  );
};

export default DroppableColumn;
