import { useDroppable } from "@dnd-kit/core";
import { Empty } from "antd";
import { useTranslation } from "react-i18next";

import type { PipelineStage } from "../../JobSettings";
import type { TDataSourceItem } from "./types";
import { getInitials } from "./types";
import DraggableCard from "./DraggableCard";
import styles from "../style.module.less";

interface IProps {
  stage: PipelineStage;
  items: TDataSourceItem[];
  isLocked: boolean;
  onCardClick: (item: TDataSourceItem) => void;
  renderReachedOutSummary?: boolean;
}

const DroppableColumn = ({
  stage,
  items,
  isLocked,
  onCardClick,
  renderReachedOutSummary,
}: IProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
  });

  const { t } = useTranslation();
  const tKey = (key: string) => t(`job_details.pipeline_section.${key}`);

  return (
    <div
      ref={setNodeRef}
      className={styles.kanbanColumn}
      style={{
        border: isOver ? "2px dashed #1890ff" : undefined,
      }}
    >
      <div className={styles.columnHeader}>
        <span className={styles.columnTitle}>{stage.name}</span>
        <span className={styles.columnCount}>{items.length}</span>
      </div>
      <div className={styles.columnContent}>
        {renderReachedOutSummary && items.length > 0 && (
          <div className={styles.reachedOutSummary} onClick={() => {}}>
            <div className={styles.reachedOutNumber}>{items.length}</div>
            <div className={styles.reachedOutLabel}>
              {tKey("candidates_reached_out")}
            </div>
            <div className={styles.reachedOutAvatars}>
              {items.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className={styles.avatarCircle}
                  title={item.talent?.name}
                >
                  {getInitials(item.talent?.name || "?")}
                </div>
              ))}
              {items.length > 5 && (
                <div className={styles.avatarCircle}>...</div>
              )}
            </div>
            <div className={styles.reachedOutLink}>
              {tKey("click_to_view_details")} →
            </div>
          </div>
        )}
        {!renderReachedOutSummary &&
          items.map((item) => (
            <DraggableCard
              key={item.id}
              item={item}
              isDraggable={!isLocked}
              onCardClick={() => onCardClick(item)}
            />
          ))}
        {renderReachedOutSummary && items.length === 0 && (
          <Empty description="" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </div>
  );
};

export default DroppableColumn;
