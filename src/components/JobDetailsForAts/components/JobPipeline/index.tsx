import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import { Button, Empty, Input, message, Select, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";

import useJob from "@/hooks/useJob";
import { Get, Post } from "@/utils/request";
import { parseJSON } from "@/utils";
import {
  DraggableCard,
  DroppableColumn,
  SOURCING_CHANNEL_OPTIONS,
  getStageKey,
  type TTalentListItem,
} from "./components";
import styles from "./style.module.less";
import { DEFAULT_STAGE_KEYS } from "@/utils/consts";

const JobPipeline = () => {
  const { job } = useJob();
  const [loading, setLoading] = useState(true);
  const [talents, setTalents] = useState<TTalentFromApi[]>([]);

  const [searchName, setSearchName] = useState<string>("");
  const [sourcingChannel, setSourcingChannel] = useState<string | undefined>();
  const [stageFilter, setStageFilter] = useState<string | undefined>();

  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [activeId, setActiveId] = useState<string | null>(null);

  const { t } = useTranslation();
  const tKey = (key: string) => t(`job_details.pipeline_section.${key}`);

  const allStages = useMemo(() => {
    if (!job) return [];
    return [
      ...DEFAULT_STAGE_KEYS.map((key, i) => ({
        id: key,
        name: t(`pipeline_section.${key}`),
        order: i,
        isDefault: true,
      })),
      ...(job.pipeline_stages ? JSON.parse(job.pipeline_stages) : []),
    ];
  }, [job]);

  const LOCKED_STAGE_KEYS = DEFAULT_STAGE_KEYS.slice(
    0,
    DEFAULT_STAGE_KEYS.length - 1
  );
  const isStageLocked = (stageKey: string) =>
    LOCKED_STAGE_KEYS.includes(stageKey);

  useEffect(() => {
    if (!job?.id) return;

    const fetchData = async () => {
      setLoading(true);
      const { code, data } = await Get<{
        talents: TTalentFromApi[];
      }>(`/api/talents?job_id=${job.id}`);

      if (code === 0) {
        setTalents(
          (data.talents ?? []).map((t) => ({
            ...t,
            basicInfo: parseJSON(t.basic_info_json),
            parsedEvaluateResult: parseJSON(t.evaluate_json),
          }))
        );
      }
      setLoading(false);
    };

    fetchData();
  }, [job?.id]);

  const mergedList: TDataSourceItem[] = useMemo(() => {
    return talents.map((talent) => {
      const item: TDataSourceItem = {
        id: `talent-${talent.id}`,
        talent: talent as TDataSourceItem["talent"],
        stageKey: "",
      };
      return {
        ...item,
        stageKey: getStageKey(item),
      };
    });
  }, [talents]);

  const filteredList = useMemo(() => {
    return mergedList
      .filter((item) => {
        if (!searchName) return true;
        const name = item.talent?.name || "";
        return name.toLowerCase().includes(searchName.toLowerCase());
      })
      .filter((item) => {
        if (!sourcingChannel) return true;
        const sc = item.talent.source_channel || "customer";
        const normalized = sc === "customer" ? "persevio" : sc;
        return normalized === sourcingChannel;
      })
      .filter((item) => {
        if (!stageFilter) return true;
        return getStageKey(item) === stageFilter;
      });
  }, [mergedList, searchName, sourcingChannel, stageFilter]);

  const itemsByStage = useMemo(() => {
    const map: Record<string, TDataSourceItem[]> = {};
    allStages.forEach((s) => {
      map[s.id] = filteredList.filter((item) => getStageKey(item) === s.id);
    });
    return map;
  }, [filteredList, allStages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id as string;
    const overId = over.id as string;
    if (!overId.startsWith("stage-")) return;

    const targetStageId = overId.replace("stage-", "");
    const targetStage = allStages.find((s) => s.id === targetStageId);
    if (!targetStage || isStageLocked(targetStage.id)) return;

    const item = mergedList.find((i) => i.id === itemId);
    if (!item) return;

    const currentStageKey = getStageKey(item);
    if (isStageLocked(currentStageKey)) return;

    const talentId = item.talent.id;
    const prevStageKey = item.talent.stage_key;
    const newStageKey =
      targetStageId === "ai_interview_completed" ? "" : targetStageId;

    setTalents((prev) =>
      prev.map((t) =>
        t.id === talentId ? { ...t, stage_key: newStageKey } : t
      )
    );

    const { code } = await Post(
      `/api/jobs/${job!.id}/talents/${talentId}/stage`,
      { stage_id: newStageKey }
    );

    if (code !== 0) {
      setTalents((prev) =>
        prev.map((t) =>
          t.id === talentId ? { ...t, stage_key: prevStageKey } : t
        )
      );
      message.error(t("job_settings.save_failed"));
    } else {
      message.success(t("job_details.saveSuccess"));
    }
  };

  const activeItem = activeId
    ? mergedList.find((i) => i.id === activeId)
    : undefined;

  if (!job) return <Spin />;

  return (
    <div className={styles.container}>
      <div className={styles.filterRow}>
        <Input
          className={styles.searchInput}
          placeholder={tKey("search_placeholder")}
          prefix={<SearchOutlined />}
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          allowClear
        />
        <Select
          className={styles.filterSelect}
          placeholder={tKey("all_sourcing_channels")}
          value={sourcingChannel}
          onChange={setSourcingChannel}
          allowClear
          options={[
            { value: undefined, label: tKey("all_sourcing_channels") },
            ...SOURCING_CHANNEL_OPTIONS,
          ]}
        />
        <Select
          className={styles.filterSelect}
          placeholder={tKey("all_stages")}
          value={stageFilter}
          onChange={setStageFilter}
          allowClear
          options={[
            { value: undefined, label: tKey("all_stages") },
            ...allStages.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        <Select
          className={styles.filterSelect}
          placeholder={tKey("all_fit_levels")}
          allowClear
          options={[{ value: undefined, label: tKey("all_fit_levels") }]}
        />
        <Select
          className={styles.filterSelect}
          placeholder={tKey("rank_by")}
          allowClear
          options={[{ value: undefined, label: tKey("rank_by") }]}
        />
        <div className={styles.viewToggle}>
          <Button
            className={styles.viewToggleBtn}
            type={viewMode === "list" ? "primary" : "default"}
            onClick={() => setViewMode("list")}
          >
            {tKey("list")}
          </Button>
          <Button
            className={styles.viewToggleBtn}
            type={viewMode === "kanban" ? "primary" : "default"}
            onClick={() => setViewMode("kanban")}
          >
            {tKey("kanban")}
          </Button>
        </div>
        <Button type="primary" className={styles.addCandidateBtn}>
          + {tKey("add_candidate")}
        </Button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <Spin />
        </div>
      ) : viewMode === "kanban" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.kanbanBoard}>
            {allStages.map((stage) => (
              <DroppableColumn
                key={stage.id}
                stage={stage}
                items={itemsByStage[stage.id] ?? []}
                isLocked={isStageLocked(stage.id)}
                onCardClick={() => {}}
                renderReachedOutSummary={stage.id === "reached_out"}
              />
            ))}
          </div>
          <DragOverlay>
            {activeItem ? (
              <div style={{ width: 280 }}>
                <DraggableCard
                  item={activeItem}
                  isDraggable
                  onCardClick={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <Empty description="List view" />
      )}
    </div>
  );
};

export default JobPipeline;
