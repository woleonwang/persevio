import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";

import Card from "./components/Card";
import styles from "./style.module.less";
import Item, { ItemRecord } from "./components/Item";

// 记录项类型
export interface DragDropRecord {
  id: string;
  title: string;
  description: string;
}

export type TValue<CardType extends string> = {
  [key in CardType]: DragDropRecord[];
};

interface DragDropCardsProps<CardType extends string, CardConfig> {
  value: TValue<CardType>;
  cardConfigs: CardConfig[];
  onChange: (value: TValue<CardType>) => void;
  renderHeader: (config: CardConfig) => React.ReactNode;
  renderExtraHeader?: (config: CardConfig) => React.ReactNode;
}

const DragDropCards = <
  CardType extends string,
  CardConfig extends {
    type: CardType;
    color?: "red" | "green" | "yellow" | "blue";
  }
>({
  value: propsValue,
  cardConfigs,
  onChange,
  renderHeader,
  renderExtraHeader,
}: DragDropCardsProps<CardType, CardConfig>) => {
  const [value, setValue] = useState<TValue<CardType>>(propsValue);
  // 当前挪动的记录
  const [activeId, setActiveId] = useState<string>();
  // 当前的目标卡片类型
  const [activeCardType, setActiveCardType] = useState<CardType>();

  const mousePositionRef = useRef<{ x: number; y: number } | null>(null);

  const originalDataRef = useRef<{
    [key in CardType]: DragDropRecord[];
  }>();

  const needTriggerChange = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    setValue(propsValue);
  }, [propsValue]);

  useEffect(() => {
    if (needTriggerChange.current) {
      onChange(value);
      needTriggerChange.current = false;
    }
  }, [needTriggerChange.current]);

  // 跟踪鼠标位置
  useEffect(() => {
    if (!activeId) {
      mousePositionRef.current = null;
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [activeId]);

  // 根据ID查找记录
  const findRecordById = (id: string): DragDropRecord | undefined => {
    for (const records of Object.values(value) as DragDropRecord[][]) {
      const record = records.find((r) => r.id === id);
      if (record) return record;
    }
    return undefined;
  };

  // 根据ID查找记录所在的卡片类型
  const findCardTypeByRecordId = (id: string): CardType | undefined => {
    for (const [cardType, records] of Object.entries(value) as [
      CardType,
      DragDropRecord[]
    ][]) {
      if (records.find((r) => r.id === id)) {
        return cardType as CardType;
      }
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    originalDataRef.current = { ...value };
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) {
      return;
    }

    const currentType = findCardTypeByRecordId(activeId);
    if (!currentType) {
      return;
    }

    // 判断over是记录还是卡片
    const isOverCard = overId.startsWith("card-");
    if (isOverCard) {
      const targetType = overId.replace("card-", "") as CardType;
      setActiveCardType(targetType);
      if (value[targetType].length === 0) {
        const newData = { ...value };
        newData[currentType] = newData[currentType].filter(
          (r) => r.id !== activeId
        );
        newData[targetType].push(activeRecord as DragDropRecord);
        setValue(newData);
        needTriggerChange.current = true;
      }
    } else {
      const targetType = over.data.current?.cardType as CardType;
      setActiveCardType(targetType);

      // 拖拽到记录上，根据鼠标位置判断是上方还是下方
      const overRect = over.rect;

      // 获取鼠标位置
      let mouseY: number;
      if (mousePositionRef.current) {
        // 使用跟踪的鼠标位置
        mouseY = mousePositionRef.current.y;
      } else {
        // 如果没有跟踪到鼠标位置，使用拖拽元素的中心点作为估算
        const activeRect = active.rect.current.translated;
        mouseY = (activeRect?.top ?? 0) + (activeRect?.height ?? 0) / 2;
      }

      // 获取目标记录的边界框
      const overTop = overRect.top;
      const overCenterY = overTop + overRect.height / 2;

      // 如果鼠标在目标记录的上半部分（鼠标Y < 目标中心Y），插入到前面
      // 如果鼠标在目标记录的下半部分（鼠标Y >= 目标中心Y），插入到后面
      const position = mouseY < overCenterY ? "before" : "after";
      const newData = { ...value };

      newData[currentType] = newData[currentType].filter(
        (r) => r.id !== activeId
      );
      const targetIndex = (newData[targetType] ?? []).findIndex(
        (r) => r.id === overId
      );

      if (targetIndex !== -1) {
        if (position === "before") {
          newData[targetType].splice(
            targetIndex,
            0,
            activeRecord as DragDropRecord
          );
        } else {
          newData[targetType].splice(
            targetIndex + 1,
            0,
            activeRecord as DragDropRecord
          );
        }
        setValue(newData);
        needTriggerChange.current = true;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;

    if (!over) {
      setActiveId(undefined);
      return;
    }

    setActiveId(undefined);
    setActiveCardType(undefined);
  };

  const onAdd = (cardType: CardType) => {
    const newData = { ...value };
    newData[cardType].push({ id: uuidv4(), title: "", description: "" });
    setValue(newData);
    needTriggerChange.current = true;
  };

  const onDelete = (cardType: CardType, recordId: string) => {
    const newData = { ...value };
    newData[cardType] = newData[cardType].filter((r) => r.id !== recordId);
    setValue(newData);
    needTriggerChange.current = true;
  };

  const onUpdateRecord = (cardType: CardType, record: ItemRecord) => {
    setValue((value) => {
      const newData = { ...value };
      newData[cardType] = newData[cardType].map((r) =>
        r.id === record.id ? record : r
      );
      return newData;
    });
    needTriggerChange.current = true;
  };

  const activeRecord = activeId ? findRecordById(activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.container}>
        {cardConfigs.map((config) => (
          <Card
            key={config.type}
            config={config}
            records={value[config.type]}
            isActive={activeCardType === config.type}
            renderHeader={renderHeader}
            renderExtraHeader={renderExtraHeader}
            onAdd={() => onAdd(config.type)}
            onDelete={(recordId) => onDelete(config.type, recordId)}
            onChange={(record) => onUpdateRecord(config.type, record)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeRecord ? (
          <div className={styles.dragOverlay}>
            <Item
              record={activeRecord}
              cardType="overlay"
              onDelete={() => {}}
              onChange={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DragDropCards;
