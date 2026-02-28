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
import {
  EVALUATE_RESULT_LEVEL_KEYS,
  getEvaluateResultLevel,
  getSourcingChannel,
  parseJSON,
  SOURCING_CHANNEL_KEYS,
} from "@/utils";
import {
  DraggableCard,
  DroppableColumn,
  getStageKey,
  type TTalentListItem,
} from "./components";
import styles from "./style.module.less";
import { DEFAULT_STAGE_KEYS } from "@/utils/consts";

const JobPipeline = () => {
  const { job } = useJob();
  const [loading, setLoading] = useState(true);
  const [talents, setTalents] = useState<TTalentListItem[]>([]);
  const [linkedinProfiles, setLinkedinProfiles] = useState<TLinkedinProfile[]>(
    [],
  );

  const [searchName, setSearchName] = useState<string>("");
  const [sourcingChannel, setSourcingChannel] = useState<string | undefined>();
  const [stageFilter, setStageFilter] = useState<string | undefined>();
  const [evaluateResultLevel, setEvaluateResultLevel] = useState<
    TEvaluateResultLevel | undefined
  >();

  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [activeId, setActiveId] = useState<number>();

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
    DEFAULT_STAGE_KEYS.length - 1,
  );

  const isStageLocked = (stageKey: string) =>
    LOCKED_STAGE_KEYS.includes(stageKey);

  useEffect(() => {
    fetchTalents();
  }, [job?.id]);

  const fetchTalents = async () => {
    if (!job?.id) return;

    setLoading(true);
    const { code, data } = await Get<{
      talents: TTalentListItem[];
      linkedin_profiles: TLinkedinProfile[];
    }>(`/api/talents?job_id=${job.id}`);

    if (code === 0) {
      const parsedTalents = (data.talents ?? []).map((t) => ({
        ...t,
        basicInfo: parseJSON(t.basic_info_json),
        parsedEvaluateResult: parseJSON(t.evaluate_json),
      }));

      setTalents(
        parsedTalents.map((t) => ({
          ...t,
          stageKey: getStageKey(t),
        })),
      );
      setLinkedinProfiles(data.linkedin_profiles ?? []);
    }
    setLoading(false);
  };

  const filteredList = useMemo(() => {
    return talents
      .filter((item) => {
        if (!searchName) return true;
        const name = item.name || "";
        return name.toLowerCase().includes(searchName.toLowerCase());
      })
      .filter((item) => {
        if (!sourcingChannel) return true;
        return getSourcingChannel(item.source_channel) === sourcingChannel;
      })
      .filter((item) => {
        if (!stageFilter) return true;
        return getStageKey(item) === stageFilter;
      })
      .filter((item) => {
        if (!evaluateResultLevel) return true;
        return (
          getEvaluateResultLevel(
            item.parsedEvaluateResult?.overall_recommendation?.result ||
              item.parsedEvaluateResult?.result,
          ) === evaluateResultLevel
        );
      });
  }, [talents, searchName, sourcingChannel, stageFilter, evaluateResultLevel]);

  const itemsByStage = useMemo(() => {
    const map: Record<string, TTalentListItem[] | TLinkedinProfile[]> = {};
    allStages.forEach((s) => {
      map[s.id] = filteredList.filter((item) => item.stageKey === s.id);
    });

    map["reached_out"] = linkedinProfiles.map((p) => ({
      ...p,
      stageKey: "reached_out",
    }));
    return map;
  }, [filteredList, allStages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(undefined);

    if (!over) return;

    const itemId = active.id as number;
    const overId = over.id as string;
    if (!overId.startsWith("stage-")) return;

    const targetStageId = overId.replace("stage-", "");
    const targetStage = allStages.find((s) => s.id === targetStageId);
    if (!targetStage || isStageLocked(targetStage.id)) return;

    const item = talents.find((i) => i.id === itemId);
    if (!item) return;

    const currentStageKey = getStageKey(item);
    if (isStageLocked(currentStageKey)) return;

    const talentId = item.id;
    const prevStageId = item.stage_id;
    const prevStageKey = item.stageKey;
    const newStageId =
      targetStageId === "ai_interview_completed" ? "" : targetStageId;

    setTalents((prev) =>
      prev.map((t) => {
        if (t.id !== talentId) return t;
        const newTalent = {
          ...t,
          stage_id: newStageId,
        };
        newTalent.stageKey = getStageKey(newTalent);
        return newTalent;
      }),
    );

    const { code } = await Post(
      `/api/jobs/${job!.id}/talents/${talentId}/stage`,
      { stage_id: newStageId },
    );

    if (code !== 0) {
      setTalents((prev) =>
        prev.map((t) =>
          t.id === talentId
            ? { ...t, stage_id: prevStageId, stageKey: prevStageKey }
            : t,
        ),
      );
      message.error(t("job_settings.save_failed"));
    } else {
      message.success(t("job_details.saveSuccess"));
    }
  };

  const activeItem = activeId
    ? talents.find((i) => i.id === activeId)
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
          style={{ width: 150 }}
        />
        <Select
          className={styles.filterSelect}
          placeholder={tKey("all_sourcing_channels")}
          value={sourcingChannel}
          onChange={setSourcingChannel}
          allowClear
          options={SOURCING_CHANNEL_KEYS.map((key) => ({
            value: key,
            label: tKey(`sourcing_channel.${key}`),
          }))}
          style={{ width: 200 }}
        />
        <Select
          className={styles.filterSelect}
          placeholder={tKey("all_stages")}
          value={stageFilter}
          onChange={setStageFilter}
          allowClear
          options={allStages.map((s) => ({ value: s.id, label: s.name }))}
          style={{ width: 200 }}
        />
        <Select
          className={styles.filterSelect}
          placeholder={tKey("all_fit_levels")}
          value={evaluateResultLevel}
          onChange={setEvaluateResultLevel}
          allowClear
          options={EVALUATE_RESULT_LEVEL_KEYS.map((level) => ({
            label: t(`job_talents.evaluate_result_select_options.${level}`),
            value: level,
          }))}
          style={{ width: 200 }}
        />
        {/* <Select
          className={styles.filterSelect}
          placeholder={tKey("rank_by")}
          allowClear
          options={[{ value: undefined, label: tKey("rank_by") }]}
        /> */}
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
        {/* <Button type="primary" className={styles.addCandidateBtn}>
          + {tKey("add_candidate")}
        </Button> */}
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
                onCardClick={(talent) => {
                  window.open(
                    `/app/jobs/${talent.job_id}/standard-board/talents/${talent.id}`,
                    "_blank",
                  );
                }}
                onUpdateTalent={() => {
                  fetchTalents();
                }}
                renderReachedOutSummary={stage.id === "reached_out"}
              />
            ))}
          </div>
          <DragOverlay>
            {activeItem ? (
              <div>
                <DraggableCard
                  item={activeItem}
                  isDraggable={false}
                  disabledPopover
                  onCardClick={() => {}}
                  onUpdateTalent={() => {}}
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
