import { useSortable } from "@dnd-kit/sortable";
import classnames from "classnames";
import styles from "./style.module.less";
import Icon from "@/components/Icon";
import Delete from "@/assets/icons/delete";
import { useEffect, useState } from "react";
import { Input } from "antd";

export interface ItemRecord {
  id: string;
  title: string;
  description: string;
}

export interface SortableRecordItemProps {
  record: ItemRecord;
  cardType: string;
  onDelete: () => void;
  onChange: (record: ItemRecord) => void;
  color?: "red" | "green" | "yellow" | "blue";
}

const Item = ({
  record,
  cardType,
  color,
  onDelete,
  onChange,
}: SortableRecordItemProps) => {
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: record.id,
    data: {
      cardType,
    },
  });

  useEffect(() => {
    if (!record.title) {
      setIsTitleEditing(true);
    }
    if (!record.description) {
      setIsDescriptionEditing(true);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isTitleEditing && !isDescriptionEditing) return;

      // 获取当前组件内两个 input 的 DOM
      const titleInput = document.querySelector(
        `#title-input-${record.id}`
      ) as HTMLElement | null;
      const descriptionInput = document.querySelector(
        `#description-input-${record.id}`
      ) as HTMLElement | null;

      const newRecord = { ...record };

      // 如果点击的目标不是上述两个 input，取消编辑
      if (
        isTitleEditing &&
        !!editingTitle &&
        titleInput &&
        !titleInput.contains(event.target as Node)
      ) {
        setIsTitleEditing(false);
        newRecord.title = editingTitle;
      }

      if (
        isDescriptionEditing &&
        !!editingDescription &&
        descriptionInput &&
        !descriptionInput.contains(event.target as Node)
      ) {
        setIsDescriptionEditing(false);
        newRecord.description = editingDescription;
      }

      onChange(newRecord);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTitleEditing, isDescriptionEditing, editingTitle, editingDescription]);

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
      <div className={styles.recordContent}>
        <div
          className={classnames(
            styles.recordTitleContainer,
            styles[color ?? ""]
          )}
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
          {isTitleEditing ? (
            <Input
              id={`title-input-${record.id}`}
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onPressEnter={() => {
                setIsTitleEditing(false);
                onChange({ ...record, title: editingTitle });
              }}
              status={!editingTitle ? "error" : undefined}
            />
          ) : (
            <div
              className={styles.recordTitle}
              onClick={() => {
                setEditingTitle(record.title);
                setIsTitleEditing(true);
              }}
            >
              {record.title}
            </div>
          )}
        </div>
        <div
          className={classnames(
            styles.recordDescriptionContainer,
            styles[color ?? ""]
          )}
        >
          {isDescriptionEditing ? (
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 6 }}
              id={`description-input-${record.id}`}
              value={editingDescription}
              onChange={(e) => setEditingDescription(e.target.value)}
              onPressEnter={() => {
                setIsDescriptionEditing(false);
                onChange({ ...record, description: editingDescription });
              }}
              status={!editingDescription ? "error" : undefined}
            />
          ) : (
            <div
              className={styles.recordDescription}
              onClick={() => {
                if (isDescriptionEditing) return;
                setEditingDescription(record.description);
                setIsDescriptionEditing(true);
              }}
            >
              {record.description}
            </div>
          )}
        </div>
      </div>
      <div className={styles.recordDeleteButton} onClick={onDelete}>
        <Icon icon={<Delete />} style={{ fontSize: 16 }} />
      </div>
    </div>
  );
};

export default Item;
