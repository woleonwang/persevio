import { useDroppable } from "@dnd-kit/core";
import { PlusOutlined } from "@ant-design/icons";
import classnames from "classnames";

import Item, { ItemRecord } from "../Item";
import styles from "./style.module.less";

interface CardProps<T> {
  config: T;
  records: ItemRecord[];
  isActive?: boolean;
  renderHeader: (config: T) => React.ReactNode;
  renderExtraHeader?: (config: T) => React.ReactNode;
  onAdd: () => void;
  onDelete: (recordId: string) => void;
  onChange: (record: ItemRecord) => void;
}

const Card = <
  T extends { type: string; color?: "red" | "green" | "yellow" | "blue" }
>({
  config,
  records,
  isActive,
  renderHeader,
  renderExtraHeader,
  onAdd,
  onDelete,
  onChange,
}: CardProps<T>) => {
  const { setNodeRef } = useDroppable({
    id: `card-${config.type}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={classnames(styles.card, styles[config.color ?? ""])}
      data-card-type={config.type}
      data-is-over={isActive}
    >
      {renderExtraHeader?.(config)}
      <div className={styles.cardMainContent}>
        <div className={styles.cardAddButton} onClick={onAdd}>
          <PlusOutlined />
        </div>
        <div className={styles.cardHeader}>{renderHeader(config)}</div>
        <div className={styles.cardContent}>
          {records.map((record) => (
            <Item
              key={record.id}
              record={record}
              cardType={config.type}
              color={config.color}
              onDelete={() => onDelete(record.id)}
              onChange={(record) => onChange(record)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Card;
