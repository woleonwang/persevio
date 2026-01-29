import { Input } from "antd";
import classnames from "classnames";
import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import styles from "./style.module.less";
import Icon from "@/components/Icon";
import Delete from "@/assets/icons/delete";

interface ItemProps {
  value: string;
  color: "red" | "green" | "yellow" | "blue";
  onChange: (value: string) => void;
  onDelete: () => void;
}

const Item = ({ value, color, onChange, onDelete }: ItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState(value);

  const id = useMemo(() => {
    return uuidv4();
  }, []);

  useEffect(() => {
    if (!value) {
      setIsEditing(true);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isEditing) return;

      const input = document.querySelector(
        `#item-input-${id}`
      ) as HTMLElement | null;

      if (
        isEditing &&
        !!editingValue &&
        input &&
        !input.contains(event.target as Node)
      ) {
        setIsEditing(false);
        onChange(editingValue);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, editingValue]);

  return (
    <div className={styles.recordItem}>
      <div
        className={classnames(
          styles.recordDescriptionContainer,
          styles[color ?? ""]
        )}
      >
        {isEditing ? (
          <Input
            id={`item-input-${id}`}
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onPressEnter={() => {
              setIsEditing(false);
              onChange(editingValue);
            }}
            status={!editingValue ? "error" : undefined}
          />
        ) : (
          <div
            className={styles.recordDescription}
            onClick={() => {
              if (isEditing) return;
              setEditingValue(value);
              setIsEditing(true);
            }}
          >
            {value}
          </div>
        )}
      </div>
      <div className={styles.recordDeleteButton} onClick={onDelete}>
        <Icon icon={<Delete />} style={{ fontSize: 16 }} />
      </div>
    </div>
  );
};

export default Item;
