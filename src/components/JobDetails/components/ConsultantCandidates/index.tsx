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
  linkedin_profile_id?: number;
  talent_id?: number;
  job_apply_id?: number;
  candidate_type: "passive" | "active";
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

type TSelectedCandidate = {
  linkedinProfileId?: number;
  talentId?: number;
  jobApplyId?: number;
  candidateType: "passive" | "active";
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "assessed_not_sent", label: "Assessed, not sent" },
  { value: "sent", label: "Sent" },
  { value: "in_process", label: "In process" },
  { value: "chat_completed", label: "Chat completed and beyond" },
];

const AUDIENCE_FILTER_OPTIONS = [
  { value: "all", label: "All candidates" },
  { value: "sourced_by_me", label: "Sourced by me" },
  { value: "active_applicants", label: "Active applicants" },
];

const ConsultantCandidates = (props: IProps) => {
  const { jobId, showSourcedBy = true } = props;
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<TCandidateRow[]>([]);
  const [funnel, setFunnel] = useState<TFunnelStage[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [nameQuery, setNameQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<TSelectedCandidate>();

  useEffect(() => {
    fetchFunnel();
  }, [jobId]);

  useEffect(() => {
    fetchCandidates();
  }, [jobId, statusFilter, audienceFilter, nameQuery]);

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
    if (audienceFilter && audienceFilter !== "all") {
      params.set("audience", audienceFilter);
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

  const openCandidateDetail = (row: TCandidateRow) => {
    setSelectedCandidate({
      linkedinProfileId: row.linkedin_profile_id,
      talentId: row.talent_id,
      jobApplyId: row.job_apply_id,
      candidateType: row.candidate_type,
    });
  };

  const rowKey = (row: TCandidateRow) =>
    `${row.candidate_type}-${row.linkedin_profile_id || 0}-${row.talent_id || 0}-${row.job_apply_id || 0}`;

  const uniqueSourcers = Array.from(
    new Set(candidates.map((c) => c.sourced_by_id).filter(Boolean)),
  );
  const shouldShowSourcedBy =
    showSourcedBy &&
    uniqueSourcers.length > 1 &&
    audienceFilter !== "active_applicants";

  const columns: ColumnsType<TCandidateRow> = [
    {
      title: "Name",
      dataIndex: "name",
      render: (name: string, row) => (
        <div className={styles.nameCell}>
          <span
            className={styles.nameLink}
            onClick={() => openCandidateDetail(row)}
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
      <div className={styles.funnelSection}>
        <div className={styles.funnelTitle}>Candidates sourced by me</div>
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
      </div>

      <div className={styles.filterSection}>
        <Select
          value={audienceFilter}
          options={AUDIENCE_FILTER_OPTIONS}
          onChange={setAudienceFilter}
          style={{ width: 220 }}
        />
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
          rowKey={rowKey}
          loading={loading}
          columns={columns}
          dataSource={candidates}
          pagination={{ pageSize: 50, showSizeChanger: false }}
          locale={{ emptyText: "No candidates yet." }}
          onRow={(row) => ({
            onClick: () => openCandidateDetail(row),
          })}
        />
      </div>

      <ConsultantCandidateDetail
        jobId={jobId}
        linkedinProfileId={selectedCandidate?.linkedinProfileId}
        talentId={selectedCandidate?.talentId}
        jobApplyId={selectedCandidate?.jobApplyId}
        candidateType={selectedCandidate?.candidateType}
        open={!!selectedCandidate}
        onClose={() => setSelectedCandidate(undefined)}
      />
    </div>
  );
};

export default ConsultantCandidates;
