import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Segmented,
  Select,
  Spin,
  Table,
  Tooltip,
  message,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import { CloseOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Line } from "@ant-design/charts";
import classnames from "classnames";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import OrgNodeTreeSelect from "@/components/OrgNodeTreeSelect";
import { Get } from "@/utils/request";
import globalStore from "@/store/global";

import styles from "./style.module.less";
import {
  DATE_PRESET_OPTIONS,
  EVALUATION_STACK_KEYS,
  REJECT_STACK_KEYS,
  TREND_SERIES,
  TDashboardApplication,
  TDashboardDatePreset,
  TDashboardPivotRow,
  TDashboardRejectedFilter,
  TTrendGranularity,
  TTrendSeriesKey,
  buildDashboardQueryParams,
  buildTrendChartData,
  computeJobPivotRows,
  computeKpiMetrics,
  computeTeamPivotRows,
  daysOpen,
  filterApplicationsByRejected,
  formatDashboardNumber,
  formatDashboardPct,
  formatPostedDate,
} from "./utils";

const EVAL_STACK_STYLE: Record<string, { bg: string; label: string; color?: string }> = {
  absolutely: { bg: "#c8e6c9", label: "Absolutely" },
  yes: { bg: "#bbdefb", label: "Yes" },
  yes_but: { bg: "#dcedc8", label: "Yes, but" },
  maybe: { bg: "#ffe0b2", label: "Maybe" },
  no: { bg: "#e8e8eb", label: "No" },
};

const REJECT_STACK_STYLE: Record<string, { bg: string; label: string; color?: string }> = {
  not_shortlisted: { bg: "#6e7e94", label: "Not Shortlisted", color: "#fff" },
  did_not_pass_interview: { bg: "#8896aa", label: "Did Not Pass", color: "#fff" },
  headcount_freeze: { bg: "#bec7d4", label: "Freeze" },
  candidate_withdrew: { bg: "#a3afc0", label: "Withdrew", color: "#fff" },
  other: { bg: "#d2d8e0", label: "Others" },
};

type TJobListItem = IJob & {
  total_candidates?: number;
  candidates_passed_screening?: number;
};

const DashboardPage = () => {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const navigate = useNavigate();
  const { mode } = globalStore;

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<TDashboardApplication[]>([]);
  const [jobs, setJobs] = useState<TJobListItem[]>([]);
  const [orgNodes, setOrgNodes] = useState<IOrgNode[]>([]);

  const [datePreset, setDatePreset] = useState<TDashboardDatePreset>("30d");
  const [rejectedFilter, setRejectedFilter] =
    useState<TDashboardRejectedFilter>("all");
  const [trendGranularity, setTrendGranularity] =
    useState<TTrendGranularity>("daily");
  const [enabledTrendSeries, setEnabledTrendSeries] = useState<Set<TTrendSeriesKey>>(
    () => new Set(TREND_SERIES.filter((s) => s.defaultOn).map((s) => s.key)),
  );

  const [drilldownTeamId, setDrilldownTeamId] = useState<number | null>(null);
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);
  const [deptFilterOpen, setDeptFilterOpen] = useState(false);
  const [deptDraft, setDeptDraft] = useState<number[]>([]);

  const [teamPage, setTeamPage] = useState(1);
  const [teamSort, setTeamSort] = useState<{
    field: string;
    order: "ascend" | "descend";
  }>({ field: "lastPostedAt", order: "descend" });

  useEffect(() => {
    fetchDashboardData();
  }, [datePreset]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const params = buildDashboardQueryParams(datePreset);
    const [appsRes, jobsRes, orgRes] = await Promise.all([
      Get<{ applications: TDashboardApplication[] }>(
        "/api/dashboard/applications",
        params,
      ),
      Get<{ jobs: TJobListItem[] }>("/api/jobs", { light: 1 }),
      Get<{ org_nodes: IOrgNode[] }>("/api/org_nodes"),
    ]);
    if (appsRes.code === 0) {
      setApplications(appsRes.data?.applications ?? []);
    } else {
      message.error(t("fetch_failed"));
    }
    if (jobsRes.code === 0) {
      setJobs(jobsRes.data?.jobs ?? []);
    }
    if (orgRes.code === 0) {
      setOrgNodes(orgRes.data?.org_nodes ?? []);
    }
    setLoading(false);
  };

  const filteredApps = useMemo(
    () => filterApplicationsByRejected(applications, rejectedFilter),
    [applications, rejectedFilter],
  );

  const kpi = useMemo(
    () => computeKpiMetrics(filteredApps, jobs),
    [filteredApps, jobs],
  );

  const trendData = useMemo(
    () => buildTrendChartData(filteredApps, trendGranularity, enabledTrendSeries),
    [filteredApps, trendGranularity, enabledTrendSeries],
  );

  const teamRows = useMemo(() => {
    const rows = computeTeamPivotRows(
      filteredApps,
      jobs,
      orgNodes,
      selectedDeptIds.length ? selectedDeptIds : null,
    );
    const sorted = [...rows].sort((a, b) => {
      const dir = teamSort.order === "ascend" ? 1 : -1;
      const field = teamSort.field;
      const av =
        field === "lastPostedAt"
          ? (a.lastPostedAt ? new Date(a.lastPostedAt).getTime() : 0)
          : (a[field as keyof TDashboardPivotRow] as number) ?? 0;
      const bv =
        field === "lastPostedAt"
          ? (b.lastPostedAt ? new Date(b.lastPostedAt).getTime() : 0)
          : (b[field as keyof TDashboardPivotRow] as number) ?? 0;
      return av === bv ? 0 : av > bv ? dir : -dir;
    });
    return sorted;
  }, [filteredApps, jobs, orgNodes, selectedDeptIds, teamSort]);

  const teamPageRows = useMemo(() => {
    const start = (teamPage - 1) * 10;
    return teamRows.slice(start, start + 10);
  }, [teamRows, teamPage]);

  const jobRowsTop10 = useMemo(
    () => computeJobPivotRows(filteredApps, jobs, orgNodes, { limit: 10 }),
    [filteredApps, jobs, orgNodes],
  );

  const drilldownJobRows = useMemo(() => {
    if (drilldownTeamId == null) return [];
    return computeJobPivotRows(filteredApps, jobs, orgNodes, {
      orgNodeId: drilldownTeamId,
    });
  }, [filteredApps, jobs, orgNodes, drilldownTeamId]);

  const toggleTrendSeries = (key: TTrendSeriesKey) => {
    setEnabledTrendSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const navigateToJob = (row: TDashboardPivotRow) => {
    if (!row.invitationToken) return;
    const base = `/app/jobs/${row.invitationToken}`;
    navigate(mode === "standard" ? `${base}/standard-board` : `${base}/board`);
  };

  const renderFunnelCount = (count: number, pct?: string) => (
    <div>
      <div className={styles.numMain}>{formatDashboardNumber(count)}</div>
      {pct != null && <div className={styles.numSub}>{pct}</div>}
    </div>
  );

  const renderStackBar = (
    total: number,
    counts: Record<string, number>,
    styleMap: Record<string, { bg: string; label: string; color?: string }>,
    keys: readonly string[],
  ) => {
    if (total <= 0) return null;
    return (
      <div className={styles.kpiStackbarWrap}>
        <div className={styles.kpiStackbar}>
          {keys.map((key) => {
            const count = counts[key] ?? 0;
            if (count <= 0) return null;
            const pct = (count / total) * 100;
            const meta = styleMap[key];
            return (
              <Tooltip
                key={key}
                title={`${meta.label}: ${count}, ${pct.toFixed(1)}%`}
              >
                <div
                  className={styles.stackSeg}
                  style={{
                    width: `${pct}%`,
                    background: meta.bg,
                    color: meta.color ?? "#1d1d1f",
                  }}
                >
                  {pct >= 12 ? meta.label : ""}
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    );
  };

  const teamColumns: ColumnsType<TDashboardPivotRow> = [
    {
      title: (
        <span>
          {t("col_team")}{" "}
          <Tooltip title={t("team_direct_tooltip")}>
            <InfoCircleOutlined />
          </Tooltip>
        </span>
      ),
      dataIndex: "name",
      render: (_, row) => (
        <Tooltip title={row.pathTooltip || row.name}>
          <span className={styles.rowName}>{row.name}</span>
        </Tooltip>
      ),
    },
    {
      title: t("col_open_jobs"),
      dataIndex: "openJobs",
      align: "right",
      sorter: true,
      sortOrder: teamSort.field === "openJobs" ? teamSort.order : undefined,
      render: (v: number) => formatDashboardNumber(v ?? 0),
    },
    {
      title: t("col_applications"),
      dataIndex: "applications",
      align: "right",
      className: styles.funnelCol,
      sorter: true,
      sortOrder: teamSort.field === "applications" ? teamSort.order : undefined,
      render: (v: number) => formatDashboardNumber(v),
    },
    {
      title: t("col_responded"),
      dataIndex: "responded",
      align: "right",
      className: styles.funnelCol,
      sorter: true,
      sortOrder: teamSort.field === "responded" ? teamSort.order : undefined,
      render: (v: number, row) =>
        renderFunnelCount(v, formatDashboardPct(v, row.applications)),
    },
    {
      title: t("col_completed"),
      dataIndex: "completed",
      align: "right",
      className: styles.funnelCol,
      sorter: true,
      sortOrder: teamSort.field === "completed" ? teamSort.order : undefined,
      render: (v: number, row) =>
        renderFunnelCount(v, formatDashboardPct(v, row.responded)),
    },
    {
      title: t("col_maybe_plus"),
      dataIndex: "maybePlus",
      align: "right",
      className: styles.funnelCol,
      sorter: true,
      sortOrder: teamSort.field === "maybePlus" ? teamSort.order : undefined,
      render: (v: number, row) =>
        renderFunnelCount(v, formatDashboardPct(v, row.completed)),
    },
    {
      title: t("col_active"),
      dataIndex: "active",
      align: "right",
      sorter: true,
      sortOrder: teamSort.field === "active" ? teamSort.order : undefined,
      render: (v: number) => formatDashboardNumber(v),
    },
    {
      title: t("col_rejected"),
      dataIndex: "rejected",
      align: "right",
      sorter: true,
      sortOrder: teamSort.field === "rejected" ? teamSort.order : undefined,
      render: (v: number) => formatDashboardNumber(v),
    },
    {
      title: t("col_last_posted"),
      dataIndex: "lastPostedAt",
      align: "right",
      sorter: true,
      defaultSortOrder: "descend",
      sortOrder: teamSort.field === "lastPostedAt" ? teamSort.order : undefined,
      render: (v: string | null) => formatPostedDate(v),
    },
  ];

  const jobColumns: ColumnsType<TDashboardPivotRow> = [
    {
      title: t("col_job"),
      dataIndex: "name",
      render: (_, row) => (
        <div>
          <div className={styles.rowName}>{row.name}</div>
          {row.secondary && (
            <div className={styles.rowNameSecondary}>{row.secondary}</div>
          )}
        </div>
      ),
    },
    {
      title: t("col_applications"),
      dataIndex: "applications",
      align: "right",
      className: styles.funnelCol,
      render: (v: number) => formatDashboardNumber(v),
    },
    {
      title: t("col_responded"),
      dataIndex: "responded",
      align: "right",
      className: styles.funnelCol,
      render: (v: number, row) =>
        renderFunnelCount(v, formatDashboardPct(v, row.applications)),
    },
    {
      title: t("col_completed"),
      dataIndex: "completed",
      align: "right",
      className: styles.funnelCol,
      render: (v: number, row) =>
        renderFunnelCount(v, formatDashboardPct(v, row.responded)),
    },
    {
      title: t("col_maybe_plus"),
      dataIndex: "maybePlus",
      align: "right",
      className: styles.funnelCol,
      render: (v: number, row) =>
        renderFunnelCount(v, formatDashboardPct(v, row.completed)),
    },
    {
      title: t("col_active"),
      dataIndex: "active",
      align: "right",
      render: (v: number) => formatDashboardNumber(v),
    },
    {
      title: t("col_rejected"),
      dataIndex: "rejected",
      align: "right",
      render: (v: number) => formatDashboardNumber(v),
    },
    {
      title: t("col_last_posted"),
      dataIndex: "lastPostedAt",
      align: "right",
      render: (v: string | null) => {
        const openDays = daysOpen(v);
        return (
          <div>
            <div className={styles.numMain}>{formatPostedDate(v)}</div>
            {openDays != null && (
              <div className={styles.numSub}>
                {t("days_open", { count: openDays })}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  const onTeamTableChange = (
    pagination: TablePaginationConfig,
    _filters: unknown,
    sorter: SorterResult<TDashboardPivotRow> | SorterResult<TDashboardPivotRow>[],
  ) => {
    if (pagination.current) setTeamPage(pagination.current);
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    if (single?.field && single.order) {
      setTeamSort({
        field: String(single.field),
        order: single.order,
      });
    }
  };

  const showRejectedMuted = rejectedFilter === "excl_rejected";
  const showFunnelMuted = rejectedFilter === "only_rejected";

  const lineConfig = {
    data: trendData,
    xField: "bucketLabel",
    yField: "value",
    seriesField: "series",
    height: 320,
    autoFit: true,
    smooth: true,
    connectNulls: true,
    legend: false as const,
    animation: false as const,
    point: { size: 3 },
    color: TREND_SERIES.map((s) => s.color),
  };

  return (
    <div className={styles.pageWrap}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>{t("title")}</div>
        <div className={styles.pageSub}>{t("subtitle")}</div>
      </div>

      <div className={styles.container}>
        <div className={styles.filterBar}>
          <span className={styles.filterLabel}>{t("application_date")}</span>
          <Select
            value={datePreset}
            style={{ width: 160 }}
            options={DATE_PRESET_OPTIONS.map((o) => ({
              value: o.key,
              label: o.label,
            }))}
            onChange={(v) => setDatePreset(v)}
          />
          <Segmented
            value={rejectedFilter}
            options={[
              { label: t("filter_all"), value: "all" },
              { label: t("filter_excl_rejected"), value: "excl_rejected" },
              { label: t("filter_only_rejected"), value: "only_rejected" },
            ]}
            onChange={(v) => setRejectedFilter(v as TDashboardRejectedFilter)}
          />
        </div>

        <Spin spinning={loading}>
          <div className={styles.kpiRow}>
            <div
              className={classnames(styles.kpiCard, styles.kpiOpenJobs)}
              onClick={() => navigate("/app/jobs")}
            >
              <div className={styles.kpiMain}>
                <div className={styles.kpiLabel}>
                  {t("open_jobs")}{" "}
                  <Tooltip title={t("open_jobs_tooltip")}>
                    <InfoCircleOutlined />
                  </Tooltip>
                </div>
                <div className={classnames(styles.kpiValue, styles.kpiValueLink)}>
                  {formatDashboardNumber(kpi.openJobs)}
                </div>
              </div>
              <div className={styles.kpiStatusbar}>
                <div className={classnames(styles.kpiStatusbarRow, styles.primary)}>
                  <span className={styles.kpiStatusbarLabel}>
                    {t("pending_intake")}
                  </span>
                  <span className={styles.kpiStatusbarValue}>
                    {formatDashboardNumber(kpi.pendingIntake)}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.kpiVertDivider} />

            <div className={styles.kpiFunnel}>
              <div className={classnames(styles.kpiCard, styles.kpiFunnelCard)}>
                <div className={styles.kpiMain}>
                  <div className={styles.kpiLabel}>{t("applications")}</div>
                  <div className={styles.kpiValue}>
                    {showFunnelMuted ? (
                      <span className={styles.numDash}>—</span>
                    ) : (
                      formatDashboardNumber(kpi.applications)
                    )}
                  </div>
                </div>
              </div>
              <span className={styles.kpiArrow}>▸</span>
              <div className={classnames(styles.kpiCard, styles.kpiFunnelCard)}>
                <div className={styles.kpiMain}>
                  <div className={styles.kpiLabel}>
                    {t("responded")}{" "}
                    <Tooltip title={t("responded_tooltip")}>
                      <InfoCircleOutlined />
                    </Tooltip>
                  </div>
                  <div className={styles.kpiValue}>
                    {showFunnelMuted ? (
                      <span className={styles.numDash}>—</span>
                    ) : (
                      formatDashboardNumber(kpi.responded)
                    )}
                  </div>
                  {!showFunnelMuted && (
                    <div className={styles.kpiSub}>
                      {formatDashboardPct(kpi.responded, kpi.applications)}{" "}
                      {t("of_applications")}
                    </div>
                  )}
                </div>
                {!showFunnelMuted && (
                  <div className={styles.kpiStatusbar}>
                    <div className={classnames(styles.kpiStatusbarRow, styles.primary)}>
                      <span className={styles.kpiStatusbarLabel}>
                        {t("never_started")}
                      </span>
                      <span className={styles.kpiStatusbarValue}>
                        {formatDashboardNumber(kpi.neverStarted)}
                      </span>
                    </div>
                    <div className={styles.kpiStatusbarRow}>
                      <span className={styles.kpiStatusbarSublabel}>
                        {t("of_applications")}
                      </span>
                      <span className={styles.kpiStatusbarSubvalue}>
                        {formatDashboardPct(kpi.neverStarted, kpi.applications)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <span className={styles.kpiArrow}>▸</span>
              <div className={classnames(styles.kpiCard, styles.kpiFunnelCard)}>
                <div className={styles.kpiMain}>
                  <div className={styles.kpiLabel}>{t("completed")}</div>
                  <div className={styles.kpiValue}>
                    {showFunnelMuted ? (
                      <span className={styles.numDash}>—</span>
                    ) : (
                      formatDashboardNumber(kpi.completed)
                    )}
                  </div>
                  {!showFunnelMuted && (
                    <div className={styles.kpiSub}>
                      {formatDashboardPct(kpi.completed, kpi.responded)}{" "}
                      {t("of_responded")}
                    </div>
                  )}
                </div>
                {!showFunnelMuted && (
                  <div className={styles.kpiStatusbar}>
                    <div className={classnames(styles.kpiStatusbarRow, styles.primary)}>
                      <span className={styles.kpiStatusbarLabel}>
                        {t("in_progress")}
                      </span>
                      <span className={styles.kpiStatusbarValue}>
                        {formatDashboardNumber(kpi.inProgress)}
                      </span>
                    </div>
                    <div className={styles.kpiStatusbarRow}>
                      <span className={styles.kpiStatusbarSublabel}>
                        {t("of_responded")}
                      </span>
                      <span className={styles.kpiStatusbarSubvalue}>
                        {formatDashboardPct(kpi.inProgress, kpi.responded)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <span className={styles.kpiArrow}>▸</span>
              <div className={classnames(styles.kpiCard, styles.kpiFunnelCard)}>
                <div className={styles.kpiMain}>
                  <div className={styles.kpiLabel}>
                    {t("results")}{" "}
                    <Tooltip title={t("results_tooltip")}>
                      <InfoCircleOutlined />
                    </Tooltip>
                  </div>
                  <div className={styles.kpiValue}>
                    {showFunnelMuted ? (
                      <span className={styles.numDash}>—</span>
                    ) : (
                      `${kpi.maybePlusPct.toFixed(1)}%`
                    )}
                  </div>
                  {!showFunnelMuted && (
                    <div className={styles.kpiSub}>{t("maybe_or_above")}</div>
                  )}
                </div>
                {!showFunnelMuted &&
                  renderStackBar(
                    kpi.completed,
                    kpi.evalStack,
                    EVAL_STACK_STYLE,
                    EVALUATION_STACK_KEYS,
                  )}
              </div>
            </div>

            <div className={classnames(styles.kpiCard, styles.kpiRejected)}>
              <div className={styles.kpiMain}>
                <div className={styles.kpiLabel}>{t("rejected")}</div>
                <div className={styles.kpiValue}>
                  {showRejectedMuted ? (
                    <span className={styles.numDash}>—</span>
                  ) : (
                    formatDashboardNumber(kpi.rejected)
                  )}
                </div>
                {!showRejectedMuted && (
                  <div className={styles.kpiSub}>
                    {formatDashboardPct(kpi.rejected, kpi.applications)}{" "}
                    {t("of_applications")}
                  </div>
                )}
              </div>
              {!showRejectedMuted &&
                renderStackBar(
                  kpi.rejected,
                  kpi.rejectStack,
                  REJECT_STACK_STYLE,
                  REJECT_STACK_KEYS,
                )}
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              {t("trends")}
              <div className={styles.sectionTitleSpacer} />
              <Segmented
                value={trendGranularity}
                options={[
                  { label: t("granularity_daily"), value: "daily" },
                  { label: t("granularity_weekly"), value: "weekly" },
                  { label: t("granularity_monthly"), value: "monthly" },
                ]}
                onChange={(v) => setTrendGranularity(v as TTrendGranularity)}
              />
            </div>
            <div className={styles.trendLegend}>
              {TREND_SERIES.map((s) => (
                <span
                  key={s.key}
                  className={classnames(styles.legendItem, {
                    [styles.off]: !enabledTrendSeries.has(s.key),
                  })}
                  onClick={() => toggleTrendSeries(s.key)}
                >
                  <span
                    className={styles.legendDot}
                    style={{ background: s.color }}
                  />
                  {s.label}
                </span>
              ))}
            </div>
            {enabledTrendSeries.size === 0 ? (
              <div className={styles.chartEmpty}>{t("trends_empty")}</div>
            ) : (
              <div className={styles.chartWrap}>
                <Line {...lineConfig} />
              </div>
            )}
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              <span>{t("by_team")}</span>
              {drilldownTeamId != null && (
                <span className={styles.titleChip}>
                  {orgNodes.find((n) => n.id === drilldownTeamId)?.name}
                  <CloseOutlined
                    onClick={() => setDrilldownTeamId(null)}
                    style={{ fontSize: 10, cursor: "pointer" }}
                  />
                </span>
              )}
              <div className={styles.sectionTitleSpacer} />
              {!drilldownTeamId && (
                <Button onClick={() => {
                  setDeptDraft(selectedDeptIds);
                  setDeptFilterOpen(true);
                }}>
                  {t("filter_departments")}
                </Button>
              )}
            </div>
            {drilldownTeamId == null ? (
              <Table
                rowKey="key"
                columns={teamColumns}
                dataSource={teamPageRows}
                pagination={{
                  current: teamPage,
                  pageSize: 10,
                  total: teamRows.length,
                  showSizeChanger: false,
                }}
                onChange={onTeamTableChange}
                onRow={(row) => ({
                  onClick: () => setDrilldownTeamId(Number(row.key)),
                  style: { cursor: "pointer" },
                })}
              />
            ) : (
              <Table
                rowKey="key"
                columns={jobColumns}
                dataSource={drilldownJobRows}
                pagination={false}
                onRow={(row) => ({
                  onClick: () => navigateToJob(row),
                  style: { cursor: "pointer" },
                })}
              />
            )}
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              {t("by_job")}
              <span className={styles.topnHint}>{t("by_job_hint")}</span>
            </div>
            <Table
              rowKey="key"
              columns={jobColumns}
              dataSource={jobRowsTop10}
              pagination={false}
              onRow={(row) => ({
                onClick: () => navigateToJob(row),
                style: { cursor: "pointer" },
              })}
            />
          </div>
        </Spin>
      </div>

      <Modal
        title={t("filter_departments")}
        open={deptFilterOpen}
        onCancel={() => setDeptFilterOpen(false)}
        onOk={() => {
          setSelectedDeptIds(deptDraft);
          setTeamPage(1);
          setDeptFilterOpen(false);
        }}
      >
        <OrgNodeTreeSelect
          multiple
          style={{ width: "100%" }}
          value={deptDraft}
          onChange={(v) => setDeptDraft((v as number[]) ?? [])}
          placeholder={t("filter_departments_placeholder")}
        />
      </Modal>
    </div>
  );
};

export default DashboardPage;
