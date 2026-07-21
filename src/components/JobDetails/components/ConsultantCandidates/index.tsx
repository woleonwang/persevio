import { useEffect, useState } from "react";
import { Input, Select, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { LinkOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { Get } from "@/utils/request";
import ConsultantCandidateDetail from "../ConsultantCandidateDetail";
import styles from "./style.module.less";

interface IProps {
  jobId: number;
  showSourcedBy?: boolean;
}

type TStageEvent = {
  stage: string;
  label: string;
  reached_at: string;
};

type TCandidateRow = {
  linkedin_profile_id: number;
  name: string;
  linkedin_url: string;
  current_title: string;
  current_company: string;
  fit_level: string;
  status: string;
  status_label: string;
  sourced_by_id: number;
  sourced_by_name: string;
  last_activity_at: string;
  stage_events: TStageEvent[];
};

type TFunnelStage = {
  stage: string;
  label: string;
  count: number;
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "assessed_not_sent", label: "Assessed, not sent" },
  { value: "sent", label: "Sent" },
  { value: "in_process", label: "In process" },
  { value: "chat_completed", label: "Chat completed and beyond" },
];

const ConsultantCandidates = (props: IProps) => {
  const { jobId, showSourcedBy = true } = props;
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<TCandidateRow[]>([]);
  const [funnel, setFunnel] = useState<TFunnelStage[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [nameQuery, setNameQuery] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<number>();

  useEffect(() => {
    fetchFunnel();
  }, [jobId]);

  useEffect(() => {
    fetchCandidates();
  }, [jobId, statusFilter, nameQuery]);

  const fetchFunnel = async () => {
    const { code, data } = await Get(
      `/api/admin/jobs/${jobId}/consultant/funnel`,
    );
    if (code === 0) {
      setFunnel(data.stages ?? []);
    }
  };

  const fetchCandidates = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (nameQuery.trim()) {
      params.set("name", nameQuery.trim());
    }
    const qs = params.toString();
    const { code, data } = await Get(
      `/api/admin/jobs/${jobId}/consultant/candidates${qs ? `?${qs}` : ""}`,
    );
    setLoading(false);
    if (code === 0) {
      setCandidates(data.candidates ?? []);
    }
  };

  const uniqueSourcers = Array.from(
    new Set(candidates.map((c) => c.sourced_by_id).filter(Boolean)),
  );
  const shouldShowSourcedBy = showSourcedBy && uniqueSourcers.length > 1;

  const columns: ColumnsType<TCandidateRow> = [
    {
      title: "Name",
      dataIndex: "name",
      render: (name: string, row) => (
        <div className={styles.nameCell}>
          <span
            className={styles.nameLink}
            onClick={() => setSelectedProfileId(row.linkedin_profile_id)}
          >
            {name || "—"}
          </span>
          {!!row.linkedin_url && (
            <a
              href={row.linkedin_url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <LinkOutlined />
            </a>
          )}
        </div>
      ),
    },
    {
      title: "Current title",
      dataIndex: "current_title",
      render: (v: string) => v || "—",
    },
    {
      title: "Current company",
      dataIndex: "current_company",
      render: (v: string) => v || "—",
    },
    {
      title: "Fit level",
      dataIndex: "fit_level",
      render: (v: string) => <Tag>{v || "No verdict"}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status_label",
      render: (v: string) => v || "—",
    },
    ...(shouldShowSourcedBy
      ? [
          {
            title: "Sourced by",
            dataIndex: "sourced_by_name",
            render: (v: string) => v || "—",
          } as ColumnsType<TCandidateRow>[number],
        ]
      : []),
    {
      title: "Last activity",
      dataIndex: "last_activity_at",
      render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "—"),
      defaultSortOrder: "descend",
      sorter: (a, b) =>
        dayjs(a.last_activity_at).valueOf() - dayjs(b.last_activity_at).valueOf(),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.funnelStrip}>
        {funnel.map((stage) => (
          <div
            key={stage.stage}
            className={`${styles.funnelItem} ${
              statusFilter === stage.stage ? styles.funnelItemActive : ""
            }`}
            onClick={() =>
              setStatusFilter(
                statusFilter === stage.stage ? "all" : stage.stage,
              )
            }
          >
            <div className={styles.funnelCount}>{stage.count}</div>
            <div className={styles.funnelLabel}>{stage.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.filterSection}>
        <Select
          value={statusFilter}
          options={STATUS_FILTER_OPTIONS}
          onChange={setStatusFilter}
          style={{ width: 260 }}
        />
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search by name"
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          style={{ width: 240 }}
        />
      </div>

      <div className={styles.tableSection}>
        <Table
          rowKey="linkedin_profile_id"
          loading={loading}
          columns={columns}
          dataSource={candidates}
          pagination={{ pageSize: 50, showSizeChanger: false }}
          locale={{ emptyText: "No sourced candidates yet." }}
          onRow={(row) => ({
            onClick: () => setSelectedProfileId(row.linkedin_profile_id),
          })}
        />
      </div>

      <ConsultantCandidateDetail
        jobId={jobId}
        linkedinProfileId={selectedProfileId}
        open={!!selectedProfileId}
        onClose={() => setSelectedProfileId(undefined)}
      />
    </div>
  );
};

export default ConsultantCandidates;
