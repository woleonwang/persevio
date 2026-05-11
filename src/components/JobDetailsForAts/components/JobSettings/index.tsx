import { useEffect, useMemo, useState, useRef } from "react";
import { Button, Input, message, Select, Switch } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
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
import { getInitials } from "../JobPipeline/components/utils";
import OrgNodeTreeSelect from "@/components/OrgNodeTreeSelect";

const DEFAULT_STAGES = [
  "Reached Out",
  "Applied",
  "Started AI Interview",
  "AI Interview Completed",
];

const REJECTED_STAGE_NAME = "Rejected";

const COLLABORATOR_ROLE_OPTIONS: {
  value: TJobCollaboratorRole;
  labelKey: "role_recruiter" | "role_hiring_manager";
}[] = [
  { value: "recruiter", labelKey: "role_recruiter" },
  { value: "hiring_manager", labelKey: "role_hiring_manager" },
];

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  isDefault: boolean;
}

interface IProps {
  jobId: string | number;
}

type AddCollaboratorSelectOption = {
  value: number;
  label: string;
  staffEmail: string;
};

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [customizedPipelineStages, setCustomizedPipelineStages] = useState<
    PipelineStage[]
  >([]);
  const [collaborators, setCollaborators] = useState<TJobCollaborator[]>([]);
  const [newStaffId, setNewStaffId] = useState<number | undefined>(undefined);
  const [newCollaboratorRole, setNewCollaboratorRole] =
    useState<TJobCollaboratorRole>("hiring_manager");
  const [collabUpdating, setCollabUpdating] = useState(false);

  const [orgNodeId, setOrgNodeId] = useState<number | undefined>(undefined);
  const [orgNodeUpdating, setOrgNodeUpdating] = useState(false);

  const { job, fetchJob } = useJob();
  const { staffs } = useStaffs({
    includeDeactivated: true,
  });

  const getStaffEmail = (staff: IStaffWithAccount) =>
    staff.account?.username || staff.phone || "-";

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
            order: i + DEFAULT_STAGES.length,
            isDefault: false,
          }),
        ),
      );
    }
  }, [job?.pipeline_stages]);

  useEffect(() => {
    setOrgNodeId(job?.org_node_id ?? undefined);
  }, [job?.org_node_id]);

  useEffect(() => {
    if (jobId) {
      fetchCollaborators();
    }
  }, [jobId]);

  const fetchCollaborators = async () => {
    const { code, data } = await Get<TJobCollaboratorsResponse>(
      `/api/jobs/${jobId}/collaborators`,
    );
    if (code === 0) {
      setCollaborators(data.job_collaborators ?? []);
    }
  };

  const handleAddCollaborator = async () => {
    if (!newStaffId) return;

    setCollabUpdating(true);
    const { code } = await Post(`/api/jobs/${jobId}/collaborators`, {
      staff_id: newStaffId,
      role: newCollaboratorRole,
    });
    if (code === 0) {
      message.success(tKey("save_success"));
      setNewStaffId(undefined);
      await fetchCollaborators();
    } else {
      message.error(tKey("save_failed"));
    }
    setCollabUpdating(false);
  };

  const handleToggleConfidential = (checked: boolean) => {
    if (!job) return;

    // 关闭 -> 开启：先弹确认，再更新
    if (!job.is_confidential && checked) {
      confirmModal({
        title: "You are making this job a Confidential Search",
        content: (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ margin: 0 }}>
              We will create an anonymized version of this job posting that
              removes your company name and any identifying details. It will be
              posted under Persevio as if we are your agency, posting on your
              behalf.
            </p>
            <p style={{ margin: 0 }}>
              Candidates will know this is a confidential search, but will not
              know which company is hiring. Viona will discuss the role
              requirements with candidates during prescreening, but will not
              disclose any information that could directly or indirectly
              identify your company. Your company's identity will only be
              disclosed when you choose to — typically when you shortlist
              candidates for further conversations.
            </p>
            <p style={{ margin: 0 }}>
              All other aspects of the hiring process remain the same:
              candidates will go through Viona&apos;s prescreening, and you will
              receive assessment reports as usual.
            </p>
          </div>
        ),
        styles: {
          content: {
            width: 600,
          },
        },
        okText: "Proceed",
        cancelText: "Cancel",
        onOk: async () => {
          const { code } = await Post(`/api/jobs/${jobId}`, {
            is_confidential: true,
          });
          if (code === 0) {
            message.success(t("job_details.saveSuccess"));
            fetchJob();
          }
        },
      });

      return;
    }

    // 其它情况（开启 -> 关闭 或重复点击）：直接更新
    (async () => {
      const { code } = await Post(`/api/jobs/${jobId}`, {
        is_confidential: checked,
      });
      if (code === 0) {
        message.success(t("job_details.saveSuccess"));
        fetchJob();
      }
    })();
  };

  const handleUpdateOrgNode = async (next: unknown) => {
    if (!jobId) return;
    const nextId =
      typeof next === "number"
        ? next
        : typeof next === "string"
          ? Number(next)
          : 0;

    if (Number.isNaN(nextId)) return;
    if (orgNodeId === nextId) return;

    setOrgNodeUpdating(true);
    setOrgNodeId(nextId === 0 ? undefined : nextId);

    const { code } = await Post(`/api/jobs/${jobId}`, {
      org_node_id: nextId,
    });
    if (code === 0) {
      message.success(tKey("save_success"));
      fetchJob();
    } else {
      message.error(tKey("save_failed"));
      fetchJob();
    }
    setOrgNodeUpdating(false);
  };

  const handleRemoveCollaborator = (collaborator: TJobCollaborator) => {
    const staffName =
      collaborator.staff?.name ||
      staffs.find((staff) => staff.id === collaborator.staff_id)?.name ||
      "";
    confirmModal({
      title: tKey("remove_collaborator_title"),
      content: tKey("remove_collaborator_content").replace(
        "{{name}}",
        staffName,
      ),
      onOk: async () => {
        setCollabUpdating(true);
        const { code } = await Post(
          `/api/jobs/${jobId}/collaborators/${collaborator.id}/destroy`,
        );
        if (code === 0) {
          message.success(tKey("save_success"));
          await fetchCollaborators();
        } else {
          message.error(tKey("save_failed"));
        }
        setCollabUpdating(false);
      },
    });
  };

  const handleUpdateCollaboratorRole = async (
    collaborator: TJobCollaborator,
    role: TJobCollaboratorRole,
  ) => {
    if (collaborator.role === role) return;

    setCollabUpdating(true);
    const { code } = await Post(
      `/api/jobs/${jobId}/collaborators/${collaborator.id}`,
      { role },
    );
    if (code === 0) {
      message.success(tKey("save_success"));
      await fetchCollaborators();
    } else {
      message.error(tKey("save_failed"));
    }
    setCollabUpdating(false);
  };

  const assignedStaffIds = useMemo(() => {
    const staffIds = new Set<number>();
    collaborators.forEach((collaborator) => {
      staffIds.add(collaborator.staff_id);
    });
    return staffIds;
  }, [collaborators]);

  const collaboratorCards = useMemo(() => {
    const cards: Array<{
      key: string;
      staff: IStaffWithAccount;
      isOwner: boolean;
      collaborator?: TJobCollaborator;
    }> = [];

    const ownerStaff = staffs.find((staff) => staff.id === job?.staff_id);
    if (ownerStaff) {
      cards.push({
        key: `owner-${ownerStaff.id}`,
        staff: ownerStaff,
        isOwner: true,
      });
    }

    [...collaborators]
      .sort((left, right) => {
        if (left.role === right.role) {
          return left.id - right.id;
        }
        if (left.role === "recruiter") return -1;
        if (right.role === "recruiter") return 1;
        return left.id - right.id;
      })
      .forEach((collaborator) => {
        const staff = staffs.find(
          (staff) => staff.id === collaborator.staff_id,
        );
        if (!staff) return;

        cards.push({
          key: `collaborator-${collaborator.id}`,
          collaborator,
          staff,
          isOwner: false,
        });
      });

    return cards;
  }, [job, collaborators, staffs]);

  const addCollaboratorSelectOptions = useMemo<AddCollaboratorSelectOption[]>(
    () =>
      staffs
        .filter(
          (staff) =>
            !assignedStaffIds.has(staff.id) && staff.status === "active",
        )
        .map((staff) => ({
          value: staff.id,
          label: staff.name,
          staffEmail: getStaffEmail(staff),
        })),
    [staffs, assignedStaffIds],
  );

  const roleOptions = COLLABORATOR_ROLE_OPTIONS.map((option) => ({
    value: option.value,
    label: tKey(option.labelKey),
  }));

  const renderRoleTag = (
    role: TJobCollaboratorRole,
    collaborator?: TJobCollaborator,
  ) => {
    const roleClassName =
      role === "owner"
        ? styles.roleTagOwner
        : role === "recruiter"
          ? styles.roleTagRecruiter
          : styles.roleTagHiringManager;

    const label =
      role === "owner"
        ? tKey("role_owner")
        : role === "recruiter"
          ? tKey("role_recruiter")
          : tKey("role_hiring_manager");

    if (!collaborator) {
      return (
        <span className={classnames(styles.roleTag, roleClassName)}>
          {label}
        </span>
      );
    }

    return (
      <Select
        className={classnames(styles.roleTagSelect, roleClassName)}
        value={role}
        options={roleOptions}
        onChange={(nextRole: TJobCollaboratorRole) =>
          handleUpdateCollaboratorRole(collaborator, nextRole)
        }
        disabled={collabUpdating}
        popupMatchSelectWidth={false}
        variant="borderless"
      />
    );
  };

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
      order: customizedPipelineStages.length + DEFAULT_STAGES.length,
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
    if (editingName.trim() === "" || !stage) return;
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
        <div className={styles.sectionTitle}>{tKey("org_node")}</div>
        <div className={styles.addCollaboratorRow}>
          <OrgNodeTreeSelect
            style={{ flex: "auto" }}
            placeholder={tKey("org_node_placeholder")}
            allowClear
            disabled={orgNodeUpdating}
            value={orgNodeId}
            onChange={(val) => handleUpdateOrgNode(val)}
          />
        </div>
        <div className={styles.readonlyField}>
          <div className={styles.sectionTitle}>
            {tKey("apply_inbound_email")}
          </div>
          <div className={styles.readonlyFieldRow}>
            <Input
              readOnly
              value={job?.apply_inbound_email || "-"}
              placeholder="-"
            />
            <Button
              onClick={async () => {
                if (!job?.apply_inbound_email) {
                  message.error(tKey("copy_failed"));
                  return;
                }
                try {
                  await navigator.clipboard.writeText(job.apply_inbound_email);
                  message.success(tKey("copy_success"));
                } catch {
                  message.error(tKey("copy_failed"));
                }
              }}
            >
              {tKey("copy")}
            </Button>
          </div>
        </div>
      </div>

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
          <LockedStageItem key="rejected" name={REJECTED_STAGE_NAME} />
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
        <div
          className={classnames(
            styles.sectionTitle,
            styles.collaboratorSectionTitle,
          )}
        >
          {tKey("collaborators")}
        </div>
        <div className={styles.collaboratorAddRow}>
          <div className={styles.addComposer}>
            <Select<number, AddCollaboratorSelectOption>
              className={styles.collaboratorSearch}
              placeholder={tKey("add_collaborator_placeholder")}
              options={addCollaboratorSelectOptions}
              value={newStaffId}
              onChange={setNewStaffId}
              showSearch
              allowClear
              suffixIcon={<SearchOutlined className={styles.searchIcon} />}
              listItemHeight={48}
              optionRender={(oriOption) => {
                const data = oriOption.data as AddCollaboratorSelectOption;
                return (
                  <div className={styles.collaboratorSelectOption}>
                    <div className={styles.collaboratorSelectOptionName}>
                      {data.label}
                    </div>
                    <div className={styles.collaboratorSelectOptionEmail}>
                      {data.staffEmail}
                    </div>
                  </div>
                );
              }}
              labelRender={(props) => {
                const staff = staffs.find((s) => s.id === props.value);
                return staff?.name ?? String(props.label ?? "");
              }}
              filterOption={(input, option) => {
                const q = input.trim().toLowerCase();
                if (!q) return true;
                if (!option) return false;
                const data = option as AddCollaboratorSelectOption;
                const name = String(data.label ?? "").toLowerCase();
                const email = String(data.staffEmail ?? "").toLowerCase();
                return name.includes(q) || email.includes(q);
              }}
            />
            <Select
              className={styles.addRoleSelect}
              value={newCollaboratorRole}
              options={roleOptions}
              onChange={setNewCollaboratorRole}
            />
          </div>
          <Button
            className={styles.addCollaboratorBtn}
            variant="outlined"
            color="primary"
            icon={<PlusOutlined />}
            onClick={handleAddCollaborator}
            loading={collabUpdating}
            disabled={!newStaffId}
          >
            {tKey("add")}
          </Button>
        </div>
        <div className={styles.collaboratorCards}>
          {collaboratorCards.map(({ key, staff, isOwner, collaborator }) => {
            return (
              <div key={key} className={styles.collaboratorCard}>
                <div
                  className={classnames(styles.collaboratorAvatar, {
                    [styles.collaboratorAvatarOwner]: isOwner,
                  })}
                >
                  {getInitials(staff.name)}
                </div>
                <div className={styles.collaboratorInfo}>
                  <div className={styles.collaboratorNameRow}>
                    <div className={styles.collaboratorName}>{staff.name}</div>
                    <div className={styles.roleTags}>
                      {isOwner && renderRoleTag("owner")}
                      {!isOwner &&
                        collaborator?.role &&
                        renderRoleTag(collaborator.role, collaborator)}
                    </div>
                  </div>
                  <div className={styles.collaboratorEmail}>
                    {getStaffEmail(staff)}
                  </div>
                </div>
                {!isOwner && collaborator && (
                  <Button
                    className={styles.removeCollaboratorBtn}
                    variant="outlined"
                    color="danger"
                    icon={<Icon icon={<Delete />} style={{ fontSize: 16 }} />}
                    onClick={() => handleRemoveCollaborator(collaborator)}
                    loading={collabUpdating}
                  >
                    {tKey("remove")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Is confidential</div>
        <Switch
          checked={!!job?.is_confidential}
          onChange={handleToggleConfidential}
        />
      </div>
    </div>
  );
};

export default JobSettings;
