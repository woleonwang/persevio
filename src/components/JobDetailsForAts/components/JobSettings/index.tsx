import { useEffect, useState, useRef } from "react";
import { Button, Input, message, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import classnames from "classnames";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";

import { Get, Post } from "@/utils/request";
import { confirmModal } from "@/utils";
import Icon from "@/components/Icon";
import Delete from "@/assets/icons/delete";
import LockCheck from "@/assets/icons/lock-check";
import styles from "./style.module.less";
import useJob from "@/hooks/useJob";
import useStaffs from "@/hooks/useStaffs";
import { getInitials } from "../JobPipeline/components";

const DEFAULT_STAGES = [
  "Reached Out",
  "Applied",
  "Started AI Interview",
  "AI Interview Completed",
];

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  isDefault: boolean;
}

interface IProps {
  jobId: number;
}

const LockedStageItem = ({ name }: { name: string }) => (
  <div className={classnames(styles.stageItem, styles.stageItemLocked)}>
    <div className={styles.stageDragHandleLocked}>
      <div className={styles.dragDots}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <span key={i} />
        ))}
      </div>
    </div>
    <div className={styles.stageNameLocked}>{name}</div>
    <Icon
      icon={<LockCheck />}
      style={{ fontSize: 20, color: "rgba(193, 193, 193, 1)" }}
    />
  </div>
);

const SortableStageItem = ({
  stage,
  onEdit,
  onDelete,
  isEditing,
  editingName,
  onEditingNameChange,
  onBlur,
  inputRef,
}: {
  stage: PipelineStage;
  onEdit: (name: string) => void;
  onDelete: () => void;
  isEditing: boolean;
  editingName: string;
  onEditingNameChange: (v: string) => void;
  onBlur: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.stageItem}>
      <div className={styles.stageDragHandle} {...attributes} {...listeners}>
        <div className={styles.dragDots}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <span key={i} />
          ))}
        </div>
      </div>
      {isEditing ? (
        <Input
          ref={(el) => {
            (
              inputRef as React.MutableRefObject<HTMLInputElement | null>
            ).current = el?.input ?? null;
          }}
          className={styles.stageInput}
          value={editingName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          onBlur={onBlur}
          onPressEnter={onBlur}
          placeholder="Stage name"
          autoFocus
        />
      ) : (
        <div className={styles.stageName} onClick={() => onEdit(stage.name)}>
          {stage.name}
        </div>
      )}
      <div className={styles.stageDelete} onClick={onDelete}>
        <Icon
          icon={<Delete />}
          style={{ fontSize: 20, color: "rgba(193, 193, 193, 1)" }}
        />
      </div>
    </div>
  );
};

const JobSettings = ({ jobId }: IProps) => {
  const { t } = useTranslation();
  const tKey = (key: string) => t(`job_settings.${key}`);
  const tCollab = (key: string) =>
    t(`job_details.job_collaborator_modal.${key}`);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [customizedPipelineStages, setCustomizedPipelineStages] = useState<
    PipelineStage[]
  >([]);

  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [newStaffId, setNewStaffId] = useState<number | undefined>(undefined);
  const [collabUpdating, setCollabUpdating] = useState(false);

  const { job } = useJob();
  const { staffs } = useStaffs();

  const defaultStages: PipelineStage[] = DEFAULT_STAGES.map((name, i) => ({
    id: `default-${i}`,
    name,
    order: i,
    isDefault: true,
  }));

  useEffect(() => {
    if (job?.pipeline_stages) {
      setCustomizedPipelineStages(
        (job.pipeline_stages ? JSON.parse(job.pipeline_stages) : []).map(
          (s: PipelineStage, i: number) => ({
            id: s.id,
            name: s.name,
            order: i + 4,
            isDefault: false,
          }),
        ),
      );
    }
  }, [job?.pipeline_stages]);

  useEffect(() => {
    if (jobId) {
      fetchCollaborators();
    }
  }, [jobId]);

  const fetchCollaborators = async () => {
    const { code, data } = await Get<{ job_collaborators: TJobCollaborator[] }>(
      `/api/jobs/${jobId}/collaborators`,
    );
    if (code === 0) {
      setSelectedStaffIds(
        data.job_collaborators.map((collab) => collab.staff_id),
      );
    }
  };

  const handleUpdateCollaborators = async (staffIds: number[]) => {
    setCollabUpdating(true);
    const { code } = await Post(`/api/jobs/${jobId}/collaborators`, {
      staff_ids: staffIds,
    });
    if (code === 0) {
      setSelectedStaffIds(staffIds);
      message.success(t("job_details.saveSuccess"));
    } else {
      message.error(tKey("save_failed"));
    }
    setCollabUpdating(false);
  };

  const handleAddCollaborator = () => {
    if (!newStaffId || selectedStaffIds.includes(newStaffId)) return;
    handleUpdateCollaborators([...selectedStaffIds, newStaffId]);
    setNewStaffId(undefined);
  };

  const handleRemoveCollaborator = (staffId: number) => {
    const staff = staffs.find((s) => s.id === staffId);
    confirmModal({
      title: tKey("remove_collaborator_title"),
      content: tKey("remove_collaborator_content").replace(
        "{{name}}",
        staff?.name || "",
      ),
      onOk: () => {
        handleUpdateCollaborators(
          selectedStaffIds.filter((id) => id !== staffId),
        );
      },
    });
  };

  const collaboratorStaffs = selectedStaffIds
    .map((id) => staffs.find((s) => s.id === id))
    .filter(Boolean) as IStaff[];
  const staffOptions = staffs
    .filter((s) => !selectedStaffIds.includes(s.id))
    .map((s) => ({ value: s.id, label: s.name }));

  const saveStages = async (newStages: PipelineStage[]) => {
    const { code } = await Post(`/api/jobs/${jobId}`, {
      pipeline_stages: JSON.stringify(newStages),
    });
    if (code === 0) {
      message.success(tKey("save_success"));
    } else {
      message.error(tKey("save_failed"));
    }
  };

  const handleAddStage = () => {
    const newStage: PipelineStage = {
      id: uuidv4(),
      name: "",
      order: customizedPipelineStages.length + 4,
      isDefault: false,
    };
    setCustomizedPipelineStages([...customizedPipelineStages, newStage]);
    setEditingId(newStage.id);
    setEditingName("");
  };

  const handleEditStart = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleEditEnd = (id: string) => {
    const stage = customizedPipelineStages.find((s) => s.id === id);
    if (!stage) return;
    const newName = editingName.trim();
    const newStages = customizedPipelineStages.map((s) =>
      s.id === id ? { ...s, name: newName || s.name } : s,
    );
    setCustomizedPipelineStages(newStages);
    setEditingId(null);
    setEditingName("");
    saveStages(newStages);
  };

  const handleDelete = (id: string) => {
    const stage = customizedPipelineStages.find((s) => s.id === id);
    confirmModal({
      title: tKey("delete_stage_title"),
      content: tKey("delete_stage_content").replace(
        "{{name}}",
        stage?.name || tKey("unnamed_stage"),
      ),
      onOk: () => {
        const newStages = customizedPipelineStages
          .filter((s) => s.id !== id)
          .map((s, i) => ({ ...s, order: i }));
        setCustomizedPipelineStages(newStages);
        setEditingId(null);
        saveStages(newStages);
      },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const customIds = customizedPipelineStages.map((s) => s.id);
    const oldIndex = customIds.indexOf(active.id as string);
    const newIndex = customIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...customizedPipelineStages];
    const [removed] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, removed);
    const newStages = [
      ...reordered.map((s, i) => ({ ...s, order: defaultStages.length + i })),
    ];
    setCustomizedPipelineStages(newStages);
    saveStages(newStages);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{tKey("pipeline_stages")}</div>
        <div className={styles.sectionDesc}>{tKey("pipeline_stages_desc")}</div>
        <div className={styles.stageList}>
          {defaultStages.map((stage) => (
            <LockedStageItem key={stage.id} name={stage.name} />
          ))}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={customizedPipelineStages.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {customizedPipelineStages.map((stage) => (
                <SortableStageItem
                  key={stage.id}
                  stage={stage}
                  onEdit={(name) => handleEditStart(stage.id, name)}
                  onDelete={() => handleDelete(stage.id)}
                  isEditing={editingId === stage.id}
                  editingName={editingName}
                  onEditingNameChange={setEditingName}
                  onBlur={() => handleEditEnd(stage.id)}
                  inputRef={inputRef}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <Button
          variant="outlined"
          color="primary"
          icon={<PlusOutlined />}
          onClick={handleAddStage}
          className={styles.addStageBtn}
        >
          {tKey("add_stage")}
        </Button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          {tKey("assigned_collaborators")}
        </div>
        <div className={styles.collaboratorCards}>
          {collaboratorStaffs.map((staff) => (
            <div key={staff.id} className={styles.collaboratorCard}>
              <div className={styles.collaboratorAvatar}>
                {getInitials(staff.name)}
              </div>
              <div className={styles.collaboratorInfo}>
                <div className={styles.collaboratorName}>{staff.name}</div>
                <div className={styles.collaboratorEmail}>
                  {(staff as IStaffWithAccount)?.account?.username ||
                    staff.phone ||
                    "-"}
                </div>
              </div>
              <Button
                variant="outlined"
                color="default"
                icon={
                  <Icon
                    icon={<Delete />}
                    style={{ fontSize: 16, color: "rgba(193, 193, 193, 1)" }}
                  />
                }
                onClick={() => handleRemoveCollaborator(staff.id)}
                loading={collabUpdating}
              >
                {tKey("remove")}
              </Button>
            </div>
          ))}
        </div>
        <div className={styles.addCollaborator}>
          <div className={styles.sectionTitle}>{tKey("add_collaborator")}</div>
          <div className={styles.addCollaboratorRow}>
            <Select
              placeholder={tCollab("select_placeholder")}
              options={staffOptions}
              value={newStaffId}
              onChange={setNewStaffId}
              style={{ width: 784 }}
              showSearch
              allowClear
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCollaborator}
              loading={collabUpdating}
              disabled={!newStaffId}
            >
              {tKey("add")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSettings;
