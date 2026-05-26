import { useEffect, useState } from "react";
import { Modal, Table } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { Get } from "@/utils/request";
import styles from "./style.module.less";
import { parseJSON } from "@/utils";

const PAGE_SIZE = 10;

interface IProps {
  open: boolean;
  jobId: string | number;
  staffs: Array<{ id: number; name: string }>;
  onClose: () => void;
}

const JobActivityLogsModal = ({ open, jobId, staffs, onClose }: IProps) => {
  const { t } = useTranslation();
  const tKey = (key: string, params?: Record<string, string>) =>
    t(`job_settings.${key}`, params);
  const [logs, setLogs] = useState<TJobActiveLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !jobId) return;

    const fetchLogs = async () => {
      setLoading(true);
      const { code, data } = await Get<{
        job_active_logs: TJobActiveLog[];
      }>(`/api/jobs/${jobId}/job_active_logs`);
      if (code === 0) {
        setLogs(data.job_active_logs ?? []);
      } else {
        setLogs([]);
      }
      setLoading(false);
    };

    void fetchLogs();
  }, [open, jobId]);

  const getStaffNameById = (staffId: number): string =>
    staffs.find((staff) => staff.id === staffId)?.name ?? "-";

  const formatCollaboratorRole = (role: string): string => {
    if (role === "recruiter") return tKey("role_recruiter");
    if (role === "hiring_manager") return tKey("role_hiring_manager");
    return role ?? "-";
  };

  const getJobActiveLogDescription = (log: TJobActiveLog): string => {
    const content = parseJSON(log.content);

    switch (log.event_type) {
      case "create":
        return tKey("activity_log_description.create");
      case "delist":
        return tKey("activity_log_description.delist");
      case "publish":
        return tKey("activity_log_description.publish");
      case "pipeline_stage_add":
        return tKey("activity_log_description.pipeline_stage_add", {
          stage_name: String(content.stage_name ?? "-"),
        });
      case "pipeline_stage_rename":
        return tKey("activity_log_description.pipeline_stage_rename", {
          old_stage_name: String(content.old_stage_name ?? "-"),
          new_stage_name: String(content.new_stage_name ?? "-"),
        });
      case "pipeline_stage_remove":
        return tKey("activity_log_description.pipeline_stage_remove", {
          stage_name: String(content.stage_name ?? "-"),
        });
      case "pipeline_stage_reorder":
        return tKey("activity_log_description.pipeline_stage_reorder", {
          stage_name: String(content.stage_name ?? "-"),
        });
      case "collaborator_add": {
        const staffId = Number(content.staff_id);
        const name = getStaffNameById(staffId);
        return tKey("activity_log_description.collaborator_add", {
          name,
          role: formatCollaboratorRole(String(content.role ?? "")),
        });
      }
      case "collaborator_edit": {
        const staffId = Number(content.staff_id);
        const name = getStaffNameById(staffId);
        return tKey("activity_log_description.collaborator_edit", {
          name,
          role: formatCollaboratorRole(String(content.role ?? "")),
        });
      }
      case "collaborator_remove": {
        const staffId = Number(content.staff_id);
        const name = getStaffNameById(staffId);
        return tKey("activity_log_description.collaborator_remove", {
          name,
        });
      }
      case "confidentiality_set": {
        const isConfidential = Boolean(content.is_confidential);
        return tKey("activity_log_description.confidentiality_set", {
          value: isConfidential
            ? tKey("activity_log_confidential_yes")
            : tKey("activity_log_confidential_no"),
        });
      }
      case "custom_source_add":
        return tKey("activity_log_description.custom_source_add", {
          source_name: String(content.source_name ?? "-"),
        });
      case "jrd_edit_ai":
        return tKey("activity_log_description.jrd_edit_ai");
      case "jrd_edit_manual":
        return tKey("activity_log_description.jrd_edit_manual");
      case "jd_edit_manual":
        return tKey("activity_log_description.jd_edit_manual");
      default:
        return "-";
    }
  };

  const columns = [
    {
      title: tKey("activity_log_time"),
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      className: styles.tableCellNowrap,
      render: (createdAt: string) =>
        dayjs(createdAt).format("YYYY/MM/DD HH:mm"),
    },
    {
      title: tKey("activity_log_action_col"),
      dataIndex: "event_type",
      key: "event_type",
      width: 180,
      className: styles.tableCellNowrap,
      render: (eventType: string) => tKey(`activity_log_action.${eventType}`),
    },
    {
      title: tKey("activity_log_description_col"),
      dataIndex: "description",
      key: "description",
      className: styles.descriptionCell,
      render: (_: unknown, record: TJobActiveLog) =>
        getJobActiveLogDescription(record),
    },
    {
      title: tKey("activity_log_operated_by"),
      dataIndex: "staff_id",
      key: "staff_id",
      width: 160,
      className: styles.tableCellNowrap,
      render: (_: unknown, record: TJobActiveLog) => (
        <span className={styles.staffChip}>
          {getStaffNameById(record.staff_id)}
        </span>
      ),
    },
  ];

  return (
    <Modal
      title={tKey("activity_logs_title")}
      open={open}
      onCancel={onClose}
      footer={null}
      width={960}
      destroyOnClose
    >
      <Table<TJobActiveLog>
        rowKey="id"
        columns={columns}
        dataSource={logs}
        loading={loading}
        pagination={{
          pageSize: PAGE_SIZE,
          showSizeChanger: false,
          showTotal: (total, range) =>
            t("pagination_total", {
              rangeStart: range[0],
              rangeEnd: range[1],
              total,
            }),
        }}
      />
    </Modal>
  );
};

export default JobActivityLogsModal;
