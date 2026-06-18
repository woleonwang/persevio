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
import { Button, Dropdown, Empty, Input, message, Select, Spin } from "antd";
import { DownOutlined, SearchOutlined } from "@ant-design/icons";

import useJob from "@/hooks/useJob";
import { Get, Post } from "@/utils/request";
import {
  buildTalentDetailUrl,
  getCandidateCardData,
  getEvaluateResultLevel,
  getSourcingChannel,
  normalizeReport,
  parseJSON,
} from "@/utils";
import UploadCandidateModal from "./components/UploadCandidateModal";
import { DraggableCard, DroppableColumn } from "./components/utils";
import styles from "./style.module.less";
import {
  EVALUATE_INTERVIEW_RECOMMENDATION_KEYS,
  PREFIX_DEFAULT_STAGE_KEYS,
  SUFFIX_DEFAULT_STAGE_KEYS,
} from "@/utils/consts";
import useJobSourceChannelOptions from "@/hooks/useJobSourceChannelOptions";
import { storage, StorageKey } from "@/utils/storage";
import ListModeTable from "@/components/ListModeTable";
import { getStageKey } from "@/utils/talentStage";
import TalentEvaluateFeedbackWithReasonModal from "@/components/TalentEvaluateFeedbackWithReasonModal";
import MoveStageModal from "@/components/MoveStageModal";
import EvaluateFeedbackConversation from "@/components/EvaluateFeedbackConversation";

const PIPELINE_KANBAN_UNSUITABLE_TOGGLE_STAGE_IDS = [
  "applied",
  "started_ai_interview",
  "ai_interview_completed",
  "rejected",
] as const;

const isPipelineKanbanUnsuitableToggleStage = (stageId: string) =>
  (PIPELINE_KANBAN_UNSUITABLE_TOGGLE_STAGE_IDS as readonly string[]).includes(
    stageId,
  );

const JobPipeline = ({
  onChangeTab,
  onMarkViewed,
}: {
  onChangeTab: (tab: string) => void;
  onMarkViewed: () => void;
}) => {
  const { job } = useJob();
  const [loading, setLoading] = useState(true);
  const [talents, setTalents] = useState<TTalentListItem[]>([]);
  const [linkedinProfiles, setLinkedinProfiles] = useState<TLinkedinProfile[]>(
    [],
  );

  const [searchKeywords, setSearchKeywords] = useState<string>("");
  const [sourcingChannels, setSourcingChannels] = useState<string[]>([]);
  const [stageFilters, setStageFilters] = useState<string[]>([]);
  const [evaluateResultLevels, setEvaluateResultLevels] = useState<
    TInterviewRecommendation[]
  >([]);

  const { options: sourceChannelOptions } = useJobSourceChannelOptions({
    jobId: job ? job.invitation_token : undefined,
  });

  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [activeId, setActiveId] = useState<number>();
  const [uploadCandidateModalOpen, setUploadCandidateModalOpen] =
    useState(false);

  const [unsuitableExpandedByStage, setUnsuitableExpandedByStage] = useState<
    Record<string, boolean>
  >({});

  const [selectedTalentIds, setSelectedTalentIds] = useState<number[]>([]);
  const [batchMoveStageOpen, setBatchMoveStageOpen] = useState(false);
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [calibrationConversation, setCalibrationConversation] =
    useState<TStartCalibrationConversationParams | null>(null);

  const handleStartCalibrationConversation = (
    params: TStartCalibrationConversationParams,
  ) => {
    setCalibrationConversation(params);
  };

  const handleCloseCalibrationConversation = () => {
    setCalibrationConversation(null);
  };

  const { t } = useTranslation();
  const tKey = (key: string) => t(`job_details.pipeline_section.${key}`);

  const allStages = useMemo(() => {
    if (!job) return [];
    const stages = [
      ...PREFIX_DEFAULT_STAGE_KEYS.map((key, i) => ({
        id: key,
        name: t(`pipeline_section.${key}`),
        order: i,
        isDefault: true,
      })),
      ...(job.pipeline_stages ? JSON.parse(job.pipeline_stages) : []),
    ];

    SUFFIX_DEFAULT_STAGE_KEYS.forEach((key) => {
      stages.push({
        id: key,
        name: t(`pipeline_section.${key}`),
        order: stages.length,
        isDefault: true,
      });
    });
    return stages;
  }, [job]);

  const LOCKED_STAGE_KEYS = allStages
    .filter((s) => s.isDefault)
    .map((s) => s.id);

  const isStageLocked = (stageKey: string) =>
    LOCKED_STAGE_KEYS.includes(stageKey);

  useEffect(() => {
    const saved = storage.get<"list" | "kanban">(
      StorageKey.JOB_PIPELINE_VIEW_MODE,
    );
    if (saved === "list" || saved === "kanban") {
      setViewMode(saved);
    }
  }, []);

  useEffect(() => {
    fetchTalents();
  }, [job?.id]);

  useEffect(() => {
    setUnsuitableExpandedByStage(
      storage.get<Record<string, boolean>>(
        StorageKey.JOB_PIPELINE_KANBAN_UNSUITABLE_EXPANDED,
      ) ?? {},
    );
  }, []);

  const handleToggleUnsuitableExpanded = (stageId: string) => {
    setUnsuitableExpandedByStage((prev) => {
      const next = { ...prev, [stageId]: !prev[stageId] };
      storage.set(StorageKey.JOB_PIPELINE_KANBAN_UNSUITABLE_EXPANDED, next);
      return next;
    });
  };

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
        parsedEvaluateResult: normalizeReport(parseJSON(t.evaluate_json)),
      }));

      setTalents(
        parsedTalents.map((t) => ({
          ...t,
          stageKey: getStageKey(t),
          cachedViewedAt: t.viewed_at,
        })),
      );
      setLinkedinProfiles(data.linkedin_profiles ?? []);
    }
    setLoading(false);
  };

  const filteredList = useMemo(() => {
    return talents
      .filter((item) => {
        if (!searchKeywords) return true;
        const query = searchKeywords.trim().toLowerCase();
        const card = getCandidateCardData(item);
        if (query === card.basicInfo?.email) return true;

        const queryWithoutSpace = query.replace(/\s/g, "");
        if (queryWithoutSpace === card.basicInfo?.phone_number) return true;

        const queryWithCountryCode = queryWithoutSpace.startsWith("+")
          ? queryWithoutSpace
          : "+" + queryWithoutSpace;
        if (
          queryWithCountryCode ===
          (card.basicInfo?.country_code ?? "") +
            (card.basicInfo?.phone_number ?? "")
        )
          return true;

        if ((item.name ?? "").toLowerCase().includes(query)) return true;

        return false;
      })
      .filter((item) => {
        if (sourcingChannels.length === 0) return true;
        return sourcingChannels.includes(
          getSourcingChannel(item.source_channel),
        );
      })
      .filter((item) => {
        if (stageFilters.length === 0) return true;
        return stageFilters.includes(getStageKey(item));
      })
      .filter((item) => {
        if (evaluateResultLevels.length === 0) return true;
        const level = getEvaluateResultLevel(item.parsedEvaluateResult);
        return evaluateResultLevels.includes(level);
      });
  }, [
    talents,
    searchKeywords,
    sourcingChannels,
    stageFilters,
    evaluateResultLevels,
  ]);

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

  const handleChangeViewMode = (mode: "list" | "kanban") => {
    setViewMode(mode);
    setSelectedTalentIds([]);
    storage.set<"list" | "kanban">(StorageKey.JOB_PIPELINE_VIEW_MODE, mode);
  };

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

    const talentId = item.id;
    const prevStageId = item.stage_id;
    const prevStageKey = item.stageKey;
    const prevStatus = item.status;
    const newStageId =
      targetStageId === "ai_interview_completed" ? "" : targetStageId;

    setTalents((prev) =>
      prev.map((t) => {
        if (t.id !== talentId) return t;
        const newTalent = {
          ...t,
          stage_id: newStageId,
          status: "evaluate_succeed",
        };
        newTalent.stageKey = getStageKey(newTalent);
        return newTalent;
      }),
    );

    const { code } = await Post(
      `/api/jobs/${job!.invitation_token}/talents/${talentId}/stage`,
      { stage_id: newStageId },
    );

    if (code !== 0) {
      setTalents((prev) =>
        prev.map((t) =>
          t.id === talentId
            ? {
                ...t,
                stage_id: prevStageId,
                stageKey: prevStageKey,
                status: prevStatus,
              }
            : t,
        ),
      );
      message.error(t("save_failed"));
    } else {
      message.success(t("save_success"));
    }
  };

  const activeItem = activeId
    ? talents.find((i) => i.id === activeId)
    : undefined;

  const handleMarkViewed = (talentId: number) => {
    onMarkViewed();
    setTalents((prev) =>
      prev.map((t) =>
        t.id === talentId
          ? {
              ...t,
              viewed_at: t.viewed_at || new Date().toISOString(),
            }
          : t,
      ),
    );
  };

  if (!job) return <Spin />;

  return (
    <div className={styles.container}>
      <div className={styles.filterRow}>
        <div className={styles.viewToggle}>
          <Button
            className={styles.viewToggleBtn}
            type={viewMode === "list" ? "primary" : "default"}
            onClick={() => handleChangeViewMode("list")}
          >
            {tKey("list")}
          </Button>
          <Button
            className={styles.viewToggleBtn}
            type={viewMode === "kanban" ? "primary" : "default"}
            onClick={() => handleChangeViewMode("kanban")}
          >
            {tKey("kanban")}
          </Button>
        </div>
        <div className={styles.filterRowMain}>
          <Input
            className={styles.searchInput}
            placeholder={tKey("search_placeholder")}
            prefix={<SearchOutlined />}
            value={searchKeywords}
            onChange={(e) => setSearchKeywords(e.target.value)}
            allowClear
            style={{ width: 200 }}
          />
          <Select
            className={styles.filterSelect}
            placeholder={tKey("all_sourcing_channels")}
            value={sourcingChannels}
            onChange={setSourcingChannels}
            mode="multiple"
            maxTagCount={1}
            allowClear
            options={sourceChannelOptions}
            style={{ width: 200 }}
          />
          <Select
            className={styles.filterSelect}
            placeholder={tKey("all_stages")}
            value={stageFilters}
            onChange={setStageFilters}
            mode="multiple"
            maxTagCount={1}
            allowClear
            options={allStages.map((s) => ({ value: s.id, label: s.name }))}
            style={{ width: 180 }}
          />
          <Select
            className={styles.filterSelect}
            placeholder={tKey("all_fit_levels")}
            value={evaluateResultLevels}
            onChange={setEvaluateResultLevels}
            mode="multiple"
            maxTagCount={1}
            allowClear
            options={EVALUATE_INTERVIEW_RECOMMENDATION_KEYS.map((level) => ({
              label: t(`job_talents.evaluate_result_options.${level}`),
              value: level,
            }))}
            style={{ width: 200 }}
          />
        </div>
        {viewMode === "list" && (
          <div className={styles.filterRowRight}>
            <Dropdown
              trigger={["hover"]}
              menu={{
                items: [
                  {
                    key: "move_stage",
                    label: tKey("move_stage"),
                    onClick: () => {
                      if (selectedTalentIds.length === 0) {
                        message.warning(tKey("please_select_talents"));
                        return;
                      }
                      setBatchMoveStageOpen(true);
                    },
                  },
                  {
                    key: "reject",
                    label: tKey("reject"),
                    danger: true,
                    onClick: () => {
                      if (selectedTalentIds.length === 0) {
                        message.warning(tKey("please_select_talents"));
                        return;
                      }

                      if (
                        selectedTalentIds.every(
                          (id) =>
                            talents.find((t) => t.id === id)?.status ===
                            "rejected",
                        )
                      ) {
                        message.warning(
                          tKey("selected_talents_already_rejected"),
                        );
                        return;
                      }

                      setBatchRejectOpen(true);
                    },
                  },
                ],
              }}
            >
              <Button className={styles.inBatchBtn} variant="outlined">
                {tKey("in_batch")}
                <DownOutlined />
              </Button>
            </Dropdown>
          </div>
        )}
      </div>

      {loading && (
        <div className={styles.loading}>
          <Spin />
        </div>
      )}
      {viewMode === "kanban" ? (
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
                    buildTalentDetailUrl(job!.invitation_token, talent.id),
                    "_blank",
                  );
                }}
                onUpdateTalent={() => {
                  fetchTalents();
                }}
                onStartCalibrationConversation={
                  handleStartCalibrationConversation
                }
                renderReachedOutSummary={stage.id === "reached_out"}
                onGoToReachedOut={() => {
                  onChangeTab("outreachCampaigns");
                }}
                onMarkViewed={handleMarkViewed}
                unsuitableCollapseEnabled={isPipelineKanbanUnsuitableToggleStage(
                  stage.id,
                )}
                showUnsuitableExpanded={
                  unsuitableExpandedByStage[stage.id] === true
                }
                onToggleUnsuitableExpanded={() =>
                  handleToggleUnsuitableExpanded(stage.id)
                }
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
                  onStartCalibrationConversation={() => {}}
                  onViewed={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className={styles.listBoard}>
          {filteredList.length === 0 ? (
            <div className={styles.listBoardEmpty}>
              <Empty />
            </div>
          ) : (
            <ListModeTable
              allStages={allStages}
              items={filteredList}
              selectedRowKeys={selectedTalentIds}
              onSelectedRowKeysChange={setSelectedTalentIds}
              onRowClick={(talent) => {
                window.open(
                  buildTalentDetailUrl(job!.invitation_token, talent.id),
                  "_blank",
                );
              }}
              onUpdateTalent={fetchTalents}
              onStartCalibrationConversation={
                handleStartCalibrationConversation
              }
              onMarkViewed={onMarkViewed}
            />
          )}
        </div>
      )}
      {job && (
        <UploadCandidateModal
          open={uploadCandidateModalOpen}
          jobId={job.invitation_token}
          onCancel={() => setUploadCandidateModalOpen(false)}
          onSuccess={() => void fetchTalents()}
        />
      )}
      {job && (
        <MoveStageModal
          open={batchMoveStageOpen}
          jobId={job.invitation_token}
          talentIds={selectedTalentIds}
          allStages={allStages}
          onCancel={() => setBatchMoveStageOpen(false)}
          onOk={() => {
            setBatchMoveStageOpen(false);
            setSelectedTalentIds([]);
            fetchTalents();
          }}
        />
      )}
      {job && (
        <TalentEvaluateFeedbackWithReasonModal
          jobId={job.invitation_token}
          talentIds={selectedTalentIds}
          open={batchRejectOpen}
          onOk={() => {
            setBatchRejectOpen(false);
            setSelectedTalentIds([]);
            fetchTalents();
          }}
          onCancel={() => setBatchRejectOpen(false)}
        />
      )}
      {job && calibrationConversation && (
        <EvaluateFeedbackConversation
          open
          jobId={calibrationConversation.jobId}
          talentId={calibrationConversation.talentId}
          source={calibrationConversation.source}
          needConfirm={calibrationConversation.needConfirm}
          onCancel={handleCloseCalibrationConversation}
        />
      )}
    </div>
  );
};

export default JobPipeline;
