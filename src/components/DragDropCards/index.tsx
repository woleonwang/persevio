import { useState, useEffect, useRef } from "react";
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
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";

import styles from "./style.module.less";

// 记录项类型
export interface DragDropRecord {
  id: string;
  title: string;
  description: string;
}

// 卡片类型
export type CardType = "p0" | "p1" | "p2";

// 卡片配置
interface CardConfig {
  type: CardType;
  title: string;
  description: string;
}

// 组件Props
interface DragDropCardsProps {
  initialData?: {
    [key in CardType]: DragDropRecord[];
  };
  onDataChange?: (data: {
    [key in CardType]: DragDropRecord[];
  }) => void;
}

// 卡片配置
const cardConfigs: CardConfig[] = [
  {
    type: "p0",
    title: "P0 Dealbreaker",
    description: "必须满足的条件",
  },
  {
    type: "p1",
    title: "P1 Highly Desired",
    description: "高优先级需求",
  },
  {
    type: "p2",
    title: "P2 Nice-to-have",
    description: "加分项",
  },
];

// 默认数据
const getDefaultData = (): {
  [key in CardType]: DragDropRecord[];
} => ({
  p0: [
    {
      id: "p0-1",
      title: "记录标题 1",
      description: "记录描述 1",
    },
    {
      id: "p0-2",
      title: "记录标题 2",
      description: "记录描述 2",
    },
  ],
  p1: [
    {
      id: "p1-1",
      title: "记录标题 3",
      description: "记录描述 3",
    },
    {
      id: "p1-2",
      title: "记录标题 4",
      description: "记录描述 4",
    },
  ],
  p2: [
    {
      id: "p2-1",
      title: "记录标题 5",
      description: "记录描述 5",
    },
    {
      id: "p2-2",
      title: "记录标题 6",
      description: "记录描述 6",
    },
  ],
});

// 预览位置类型
interface PreviewPosition {
  cardType: CardType;
  recordId: string | null; // null 表示卡片底部
  position: "before" | "after"; // 在记录上方还是下方
}

// 可拖拽记录项组件
interface SortableRecordItemProps {
  record: DragDropRecord;
  cardType: CardType;
}

const SortableRecordItem = ({ record, cardType }: SortableRecordItemProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: record.id,
    data: {
      type: "record",
      record,
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

// 卡片组件
interface CardProps {
  config: CardConfig;
  records: DragDropRecord[];
  allRecords: DragDropRecord[];
  previewPosition?: PreviewPosition | null;
  activeRecord?: DragDropRecord | null;
  isActive?: boolean;
}

const Card = ({ config, records, isActive }: CardProps) => {
  const recordIds = records.map((r) => r.id);
  const { setNodeRef } = useDroppable({
    id: `card-${config.type}`,
    data: {
      type: "card",
      cardType: config.type,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={styles.card}
      data-card-type={config.type}
      data-is-over={isActive}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>{config.title}</div>
        <div className={styles.cardDescription}>{config.description}</div>
        <div className={styles.cardAddButton}>+</div>
      </div>
      <SortableContext items={recordIds} strategy={verticalListSortingStrategy}>
        <div className={styles.cardContent}>
          {records.map((record) => (
            <SortableRecordItem
              key={record.id}
              record={record}
              cardType={config.type}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

// 主组件
const DragDropCards = ({ initialData, onDataChange }: DragDropCardsProps) => {
  const [data, setData] = useState<{
    [key in CardType]: DragDropRecord[];
  }>(initialData || getDefaultData());

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCardType, setActiveCardType] = useState<CardType | null>(null);

  const mousePositionRef = useRef<{ x: number; y: number } | null>(null);

  const originalDataRef = useRef<{
    [key in CardType]: DragDropRecord[];
  }>();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
    for (const records of Object.values(data)) {
      const record = records.find((r) => r.id === id);
      if (record) return record;
    }
    return undefined;
  };

  // 根据ID查找记录所在的卡片类型
  const findCardTypeByRecordId = (id: string): CardType | undefined => {
    for (const [cardType, records] of Object.entries(data)) {
      if (records.find((r) => r.id === id)) {
        return cardType as CardType;
      }
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    originalDataRef.current = { ...data };
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
      if (data[targetType].length === 0) {
        const newData = { ...data };
        newData[currentType] = newData[currentType].filter(
          (r) => r.id !== activeId
        );
        newData[targetType].push(activeRecord as DragDropRecord);
        setData(newData);
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
      const newData = { ...data };

      newData[currentType] = newData[currentType].filter(
        (r) => r.id !== activeId
      );
      const targetIndex = newData[targetType].findIndex((r) => r.id === overId);

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
        setData(newData);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    onDataChange?.(data);
    setActiveId(null);
    setActiveCardType(null);
  };

  const activeRecord = activeId ? findRecordById(activeId) : null;

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
            records={data[config.type]}
            allRecords={Object.values(data).flat()}
            activeRecord={activeRecord}
            isActive={activeCardType === config.type}
          />
        ))}
      </div>
      <DragOverlay>
        {activeRecord ? (
          <div className={styles.dragOverlay}>
            <div className={styles.recordItem}>
              <div className={styles.dragHandler}>
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
                <div className={styles.recordTitle}>{activeRecord.title}</div>
                <div className={styles.recordDescription}>
                  {activeRecord.description}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DragDropCards;
