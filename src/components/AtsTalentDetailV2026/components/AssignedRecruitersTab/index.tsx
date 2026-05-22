import { useState } from "react";
import { Button, Select, message } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import Icon from "@/components/Icon";
import Delete from "@/assets/icons/delete";
import { Post } from "@/utils/request";
import { getInitials } from "@/components/AtsTalentDetailV2026/utils/helpers";

import styles from "./style.module.less";
import useStaffs from "@/hooks/useStaffs";

type AddRecruiterSelectOption = {
  value: number;
  label: string;
  staffEmail: string;
};

interface IProps {
  jobId: string;
  talentId: number;
  talentRecruiters: TTalentRecruiter[];
  jobCollaborators?: TJobCollaborator[];
  onTalentRecruitersChange: (talentRecruiters: TTalentRecruiter[]) => void;
}

const getStaffEmail = (staff?: IStaffWithAccount) =>
  staff?.account?.username || staff?.phone || "-";

const AssignedRecruitersTab = ({
  jobId,
  talentId,
  talentRecruiters,
  jobCollaborators = [],
  onTalentRecruitersChange,
}: IProps) => {
  const { t } = useTranslation();
  const tKey = (key: string) => t(`talent_details.${key}`);

  const [newStaffId, setNewStaffId] = useState<number | undefined>(undefined);
  const [updating, setUpdating] = useState(false);
  const { staffs } = useStaffs({ includeDeactivated: true });

  const assignedStaffIds = new Set(
    talentRecruiters.map((item) => item.staff_id),
  );

  const handleAddRecruiter = async () => {
    if (!newStaffId) return;

    setUpdating(true);
    const { code, data } = await Post<{ talent_recruiter: TTalentRecruiter }>(
      `/api/jobs/${jobId}/talents/${talentId}/recruiters`,
      { staff_id: newStaffId },
    );
    setUpdating(false);

    if (code === 0 && data?.talent_recruiter) {
      onTalentRecruitersChange([...talentRecruiters, data.talent_recruiter]);
      setNewStaffId(undefined);
      message.success(t("job_talents.assigned_recruiters_save_success"));
      return;
    }

    message.error(t("job_talents.assigned_recruiters_save_failed"));
  };

  const getStaff = (staffId: number) => {
    return staffs.find((staff) => staff.id === staffId);
  };

  const handleRemoveRecruiter = async (recruiter: TTalentRecruiter) => {
    setUpdating(true);
    const { code } = await Post(
      `/api/jobs/${jobId}/talents/${talentId}/recruiters/${recruiter.id}/destroy`,
    );
    setUpdating(false);

    if (code === 0) {
      onTalentRecruitersChange(
        talentRecruiters.filter((item) => item.id !== recruiter.id),
      );
      message.success(t("job_talents.assigned_recruiters_save_success"));
      return;
    }

    message.error(t("job_talents.assigned_recruiters_save_failed"));
  };

  const addRecruiterSelectOptions: AddRecruiterSelectOption[] = jobCollaborators
    .filter(
      (collaborator) =>
        collaborator.role === "recruiter" &&
        collaborator.staff?.status !== "deactivated" &&
        !assignedStaffIds.has(collaborator.staff_id),
    )
    .map((collaborator) => {
      const staff = getStaff(collaborator.staff_id);
      return {
        value: collaborator.staff_id,
        label: staff?.name?.trim() || "-",
        staffEmail: getStaffEmail(getStaff(collaborator.staff_id)),
      };
    });

  return (
    <div className={styles.wrap}>
      <div className={styles.recruiterAddRow}>
        <div className={styles.addComposer}>
          <Select<number, AddRecruiterSelectOption>
            className={styles.recruiterSearch}
            placeholder={tKey("assign_recruiter_placeholder")}
            options={addRecruiterSelectOptions}
            value={newStaffId}
            onChange={setNewStaffId}
            showSearch
            allowClear
            suffixIcon={<SearchOutlined className={styles.searchIcon} />}
            listItemHeight={48}
            optionRender={(oriOption) => {
              const data = oriOption.data as AddRecruiterSelectOption;
              return (
                <div className={styles.recruiterSelectOption}>
                  <div className={styles.recruiterSelectOptionName}>
                    {data.label}
                  </div>
                  <div className={styles.recruiterSelectOptionEmail}>
                    {data.staffEmail}
                  </div>
                </div>
              );
            }}
            labelRender={(props) => {
              const option = addRecruiterSelectOptions.find(
                (item) => item.value === props.value,
              );
              return option?.label ?? String(props.label ?? "");
            }}
            filterOption={(input, option) => {
              const q = input.trim().toLowerCase();
              if (!q) return true;
              if (!option) return false;
              const data = option as AddRecruiterSelectOption;
              const name = String(data.label ?? "").toLowerCase();
              const email = String(data.staffEmail ?? "").toLowerCase();
              return name.includes(q) || email.includes(q);
            }}
          />
        </div>
        <Button
          className={styles.addRecruiterBtn}
          variant="outlined"
          color="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            void handleAddRecruiter();
          }}
          loading={updating}
          disabled={!newStaffId}
        >
          {t("job_settings.add")}
        </Button>
      </div>

      <div>
        {talentRecruiters.length === 0 ? (
          <div className={styles.emptyState}>
            {tKey("no_assigned_recruiters")}
          </div>
        ) : (
          <div className={styles.recruiterCards}>
            {talentRecruiters.map((recruiter: TTalentRecruiter) => {
              const staff = getStaff(recruiter.staff_id);
              const name = staff?.name || "-";

              return (
                <div key={recruiter.id} className={styles.recruiterCard}>
                  <div className={styles.recruiterAvatar}>
                    {getInitials(name)}
                  </div>
                  <div className={styles.recruiterInfo}>
                    <div className={styles.recruiterName}>{name}</div>
                    <div className={styles.recruiterEmail}>
                      {getStaffEmail(staff)}
                    </div>
                  </div>
                  <Button
                    className={styles.removeRecruiterBtn}
                    variant="outlined"
                    color="danger"
                    icon={<Icon icon={<Delete />} style={{ fontSize: 16 }} />}
                    onClick={() => handleRemoveRecruiter(recruiter)}
                    loading={updating}
                  >
                    {t("job_settings.remove")}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedRecruitersTab;
