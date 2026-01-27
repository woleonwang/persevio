import { useDroppable } from "@dnd-kit/core";
import Item, { ItemRecord } from "../Item";
import styles from "./style.module.less";

interface CardProps<T> {
  config: T;
  records: ItemRecord[];
  isActive?: boolean;
  renderHeader: (config: T) => React.ReactNode;
}

const Card = <T extends { type: string }>({
  config,
  records,
  isActive,
  renderHeader,
}: CardProps<T>) => {
  const { setNodeRef } = useDroppable({
    id: `card-${config.type}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={styles.card}
      data-card-type={config.type}
      data-is-over={isActive}
    >
      <div className={styles.cardHeader}>
        {renderHeader(config)}
        <div className={styles.cardAddButton}>+</div>
      </div>
      <div className={styles.cardContent}>
        {records.map((record) => (
          <Item key={record.id} record={record} cardType={config.type} />
        ))}
      </div>
    </div>
  );
};

export default Card;
