import { useState, useEffect } from "react";
import { Modal, Select, Button, message } from "antd";
import { Get, Post } from "@/utils/request";
import { copy } from "@/utils";
import { useTranslation } from "react-i18next";

interface IProps {
  open: boolean;
  onCancel: () => void;
  jobId: number;
}

const JobCollaboratorModal = ({ open, onCancel, jobId }: IProps) => {
  const [allStaffs, setAllStaffs] = useState<IStaffWithAccount[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [updating, setUpdating] = useState(false);

  const { t: originalT } = useTranslation();
  const t = (key: string) =>
    originalT(`job_details.job_collaborator_modal.${key}`);

  useEffect(() => {
    if (open && jobId) {
      fetchStaffs();
      fetchCollaborators();
    }
  }, [open, jobId]);

  const fetchStaffs = async () => {
    const { code, data } = await Get<{ staffs: IStaffWithAccount[] }>(
      "/api/staffs"
    );
    if (code === 0) {
      setAllStaffs(data.staffs);
    }
  };

  const fetchCollaborators = async () => {
    const { code, data } = await Get<{ job_collaborators: TJobCollaborator[] }>(
      `/api/jobs/${jobId}/collaborators`
    );
    if (code === 0) {
      setSelectedStaffIds(
        data.job_collaborators.map((collab) => collab.staff_id)
      );
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    const { code } = await Post(`/api/jobs/${jobId}/collaborators`, {
      staff_ids: selectedStaffIds,
    });

    if (code === 0) {
      message.success(originalT("update_succeed"));
      fetchCollaborators();
    } else {
      message.error(originalT("update_failed"));
    }
    setUpdating(false);
  };

  const handleCopyLink = async () => {
    const currentUrl = window.location.href;
    await copy(currentUrl);
    message.success(originalT("copied"));
  };

  const staffOptions = allStaffs.map((staff) => ({
    value: staff.id,
    label: staff.name,
  }));

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={t("title")}
      footer={null}
      width={600}
      centered
    >
      <div style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <Select
            mode="multiple"
            options={staffOptions}
            value={selectedStaffIds}
            onChange={setSelectedStaffIds}
            placeholder={t("select_placeholder")}
            style={{ flex: 1 }}
            showSearch
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
          <Button type="primary" onClick={handleUpdate} loading={updating}>
            {t("update")}
          </Button>
          <Button onClick={handleCopyLink}>{t("copy_link")}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default JobCollaboratorModal;
