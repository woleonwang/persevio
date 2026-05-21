import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Select, message } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Post } from "@/utils/request";
import styles from "./style.module.less";

interface IProps {
  jobInvitationToken: string;
  talentId: number;
  talentRecruiters?: TTalentRecruiter[];
  jobCollaborators?: TJobCollaborator[];
  popoverContainerRef: React.RefObject<HTMLElement | null>;
  onUpdate: (talentRecruiters: TTalentRecruiter[]) => void;
}

const getAssignedStaffIds = (talentRecruiters: TTalentRecruiter[]) =>
  talentRecruiters.map((item) => item.staff_id);

const isSameStaffIds = (left: number[], right: number[]) =>
  left.length === right.length &&
  left.every((staffId) => right.includes(staffId));

const AssignedRecruiters = ({
  jobInvitationToken,
  talentId,
  talentRecruiters = [],
  jobCollaborators,
  popoverContainerRef,
  onUpdate,
}: IProps) => {
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_talents.${key}`);

  const [isEditing, setIsEditing] = useState(false);
  const [draftStaffIds, setDraftStaffIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const selectRef = useRef<React.ComponentRef<typeof Select>>(null);

  const selectableOptions = useMemo(
    () =>
      (jobCollaborators ?? [])
        .filter((collaborator) => collaborator.role === "recruiter")
        .map((collaborator) => ({
          value: collaborator.staff_id,
          label:
            collaborator.staff?.name?.trim() || String(collaborator.staff_id),
        })),
    [jobCollaborators],
  );

  useEffect(() => {
    if (isEditing) {
      selectRef.current?.focus();
    }
  }, [isEditing]);

  const handleStartEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isSaving) return;
    setDraftStaffIds(getAssignedStaffIds(talentRecruiters));
    setIsEditing(true);
  };

  const handleCancel = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isSaving) return;
    setIsEditing(false);
  };

  const handleSave = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isEditing || isSaving) return;

    const originalStaffIds = getAssignedStaffIds(talentRecruiters);
    if (isSameStaffIds(draftStaffIds, originalStaffIds)) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const { code, data } = await Post<{
      talent_recruiters: TTalentRecruiter[];
    }>(
      `/api/jobs/${jobInvitationToken}/talents/${talentId}/recruiters/replace`,
      { staff_ids: draftStaffIds },
    );
    setIsSaving(false);

    if (code === 0 && data?.talent_recruiters) {
      onUpdate(data.talent_recruiters);
      message.success(t("assigned_recruiters_save_success"));
      setIsEditing(false);
      return;
    }

    message.error(t("assigned_recruiters_save_failed"));
  };

  return (
    <div className={styles.assignedRecruitersRow}>
      <div className={styles.assignedRecruitersLabel}>
        {t("assigned_recruiters")}
      </div>
      {isEditing ? (
        <div className={styles.assignedRecruitersEditor}>
          <Select
            ref={selectRef}
            mode="multiple"
            showSearch
            autoFocus
            disabled={isSaving}
            className={styles.assignedRecruitersSelect}
            placeholder={t("assigned_recruiters_placeholder")}
            value={draftStaffIds}
            options={selectableOptions}
            optionFilterProp="label"
            placement="topLeft"
            getPopupContainer={() =>
              popoverContainerRef.current ?? document.body
            }
            onChange={(values) => {
              setDraftStaffIds(values as number[]);
            }}
            onClick={(event) => event.stopPropagation()}
          />
          <div className={styles.assignedRecruitersActions}>
            <Button
              type="primary"
              shape="circle"
              size="small"
              icon={<CheckOutlined />}
              loading={isSaving}
              onClick={(event) => {
                void handleSave(event);
              }}
            />
            <Button
              shape="circle"
              size="small"
              icon={<CloseOutlined />}
              disabled={isSaving}
              onClick={handleCancel}
            />
          </div>
        </div>
      ) : (
        <div
          className={styles.assignedRecruitersChipArea}
          onClick={handleStartEdit}
        >
          {talentRecruiters.length > 0 ? (
            <div className={styles.assignedRecruitersChipWrap}>
              {talentRecruiters.map((item) => (
                <span key={item.id} className={styles.personChip}>
                  {item.staff?.name?.trim() || "-"}
                </span>
              ))}
            </div>
          ) : (
            <span className={styles.assignedRecruitersPlaceholder}>
              {t("assigned_recruiters_placeholder")}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignedRecruiters;
