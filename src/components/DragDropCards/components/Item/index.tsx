import { useSortable } from "@dnd-kit/sortable";
import styles from "./style.module.less";

export interface ItemRecord {
  id: string;
  title: string;
  description: string;
}

export interface SortableRecordItemProps {
  record: ItemRecord;
  cardType: string;
}

const Item = ({ record, cardType }: SortableRecordItemProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: record.id,
    data: {
      cardType,
    },
  });

  const style = {
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.recordItem}
      {...attributes}
    >
      <div className={styles.dragHandler} {...listeners}>
        <div className={styles.dragHandlerDots}>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div className={styles.recordContent}>
        <div className={styles.recordTitle}>{record.title}</div>
        <div className={styles.recordDescription}>{record.description}</div>
      </div>
    </div>
  );
};

export default Item;
