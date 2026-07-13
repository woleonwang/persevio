import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Spin, Table, Tooltip, message } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import { CloseOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Line } from "@ant-design/charts";
import classnames from "classnames";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import OrgNodeTreeSelect from "@/components/OrgNodeTreeSelect";
import { Get } from "@/utils/request";

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
import Icon from "@/components/Icon";
import MailBolt from "@/assets/icons/mail-bolt";
import FilterDropdown from "./components/DropdownFilter";

const EVAL_STACK_STYLE: Record<
  string,
  { bg: string; label: string; color?: string }
> = {
  absolutely: { bg: "#5C92EA", label: "Absolutely", color: "#fff" },
  yes: { bg: "#85DCFF", label: "Yes", color: "#1d1d1f" },
  yes_but: { bg: "#8BB68E", label: "Yes, but", color: "#1d1d1f" },
  maybe: { bg: "#FFB27C", label: "Maybe", color: "#1d1d1f" },
  no: { bg: "#ED7676", label: "No", color: "#fff" },
};

const REJECT_STACK_STYLE: Record<
  string,
  { bg: string; label: string; color?: string }
> = {
  not_shortlisted: { bg: "#4671B8", label: "Not Shortlisted", color: "#fff" },
  did_not_pass_interview: {
    bg: "#7E9AC9",
    label: "Did Not Pass Interview",
    color: "#fff",
  },
  headcount_freeze: {
    bg: "#A1B4D4",
    label: "Headcount Freeze",
    color: "#1d1d1f",
  },
  candidate_withdrew: {
    bg: "#C5D2E8",
    label: "Candidate Withdrew",
    color: "#1d1d1f",
  },
  other: { bg: "#E8EFFB", label: "Others", color: "#1d1d1f" },
};

const REJECTED_FILTER_OPTIONS: {
  value: TDashboardRejectedFilter;
  labelKey: "filter_all" | "filter_excl_rejected" | "filter_only_rejected";
}[] = [
  { value: "all", labelKey: "filter_all" },
  { value: "excl_rejected", labelKey: "filter_excl_rejected" },
  { value: "only_rejected", labelKey: "filter_only_rejected" },
];

const TREND_GRANULARITY_OPTIONS: TTrendGranularity[] = [
  "daily",
  "weekly",
  "monthly",
];

type TJobListItem = IJob & {
  total_candidates?: number;
  candidates_passed_screening?: number;
};

function DashboardSection({
  loading,
  children,
  className,
}: {
  loading?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={classnames(styles.sectionPanel, className)}>
      {loading && (
        <div className={styles.sectionOverlay}>
          <Spin />
        </div>
      )}
      {children}
    </div>
  );
}

function SegmentControl<T extends string>({
  value,
  options,
  onChange,
  labels,
}: {
  value: T;
  options: T[];
  onChange: (value: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <div className={styles.segmentControl}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={classnames(styles.segmentOption, {
            [styles.segmentOptionActive]: option === value,
          })}
          onClick={() => onChange(option)}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}

const DashboardPage = () => {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const navigate = useNavigate();

  const [metaLoading, setMetaLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(true);
  const [applications, setApplications] = useState<TDashboardApplication[]>([]);
  const [jobs, setJobs] = useState<TJobListItem[]>([]);
  const [orgNodes, setOrgNodes] = useState<IOrgNode[]>([]);

  const [datePreset, setDatePreset] = useState<TDashboardDatePreset>("30d");
  const [rejectedFilter, setRejectedFilter] =
    useState<TDashboardRejectedFilter>("all");
  const [trendGranularity, setTrendGranularity] =
    useState<TTrendGranularity>("daily");
  const [enabledTrendSeries, setEnabledTrendSeries] = useState<
    Set<TTrendSeriesKey>
  >(() => new Set(TREND_SERIES.filter((s) => s.defaultOn).map((s) => s.key)));

  const [drilldownTeamId, setDrilldownTeamId] = useState<number | null>(null);
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);

  const [teamPage, setTeamPage] = useState(1);
  const [teamSort, setTeamSort] = useState<{
    field: string;
    order: "ascend" | "descend";
  }>({ field: "lastPostedAt", order: "descend" });

  const fetchMeta = async () => {
    setMetaLoading(true);
    const [jobsRes, orgRes] = await Promise.all([
      Get<{ jobs: TJobListItem[] }>("/api/jobs", { light: 1 }),
      Get<{ org_nodes: IOrgNode[] }>("/api/org_nodes"),
    ]);
    if (jobsRes.code === 0) {
      setJobs(jobsRes.data?.jobs ?? []);
    }
    if (orgRes.code === 0) {
      setOrgNodes(orgRes.data?.org_nodes ?? []);
    }
    setMetaLoading(false);
  };

  const fetchApplications = async () => {
    setAppsLoading(true);
    const params = buildDashboardQueryParams(datePreset);
    const appsRes = await Get<{ applications: TDashboardApplication[] }>(
      "/api/dashboard/applications",
      params,
    );
    if (appsRes.code === 0) {
      setApplications(appsRes.data?.applications ?? []);
    } else {
      message.error(t("fetch_failed"));
    }
    setAppsLoading(false);
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [datePreset]);

  const filteredApps = useMemo(
    () => filterApplicationsByRejected(applications, rejectedFilter),
    [applications, rejectedFilter],
  );

  const kpi = useMemo(
    () => computeKpiMetrics(filteredApps, jobs),
    [filteredApps, jobs],
  );

  const trendData = useMemo(
    () =>
      buildTrendChartData(filteredApps, trendGranularity, enabledTrendSeries),
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
          ? a.lastPostedAt
            ? new Date(a.lastPostedAt).getTime()
            : 0
          : ((a[field as keyof TDashboardPivotRow] as number) ?? 0);
      const bv =
        field === "lastPostedAt"
          ? b.lastPostedAt
            ? new Date(b.lastPostedAt).getTime()
            : 0
          : ((b[field as keyof TDashboardPivotRow] as number) ?? 0);
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
    navigate(`${base}/standard-board?tab=analytics`);
  };

  const renderFunnelCount = (count: number, pct?: string) => (
    <div>
      <span className={styles.numMain}>{formatDashboardNumber(count)}</span>
      {pct != null && <span className={styles.numSub}>{pct}</span>}
    </div>
  );

  const renderDistributionLegend = (
    keys: readonly string[],
    styleMap: Record<string, { bg: string; label: string; color?: string }>,
    className?: string,
  ) => (
    <div
      className={classnames(styles.distributionLegend, className)}
      aria-hidden="true"
    >
      {keys.map((key) => {
        const meta = styleMap[key];
        if (!meta) return null;
        return (
          <span key={key}>
            <i style={{ background: meta.bg }} />
            {meta.label}
          </span>
        );
      })}
    </div>
  );

  const renderDistributionBar = (
    total: number,
    counts: Record<string, number>,
    styleMap: Record<string, { bg: string; label: string; color?: string }>,
    keys: readonly string[],
    barClassName: string,
  ) => {
    if (total <= 0) return null;
    return (
      <div className={barClassName}>
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
              <span style={{ width: `${pct}%`, background: meta.bg }} />
            </Tooltip>
          );
        })}
      </div>
    );
  };

  const buildAiScreeningColumns = (
    sortable: boolean,
  ): ColumnsType<TDashboardPivotRow> => [
    {
      title: t("col_applications"),
      dataIndex: "applications",
      align: "right",
      className: classnames(styles.funnelCol, styles.funnelFlowCell),
      sorter: sortable ? true : undefined,
      sortOrder:
        sortable && teamSort.field === "applications"
          ? teamSort.order
          : undefined,
      render: (v: number) => formatDashboardNumber(v),
    },
    {
      title: t("col_responded"),
      dataIndex: "responded",
      align: "right",
      className: classnames(styles.funnelCol, styles.funnelFlowCell),
      sorter: sortable ? true : undefined,
      sortOrder:
        sortable && teamSort.field === "responded" ? teamSort.order : undefined,
      render: (v: number, row) =>
        renderFunnelCount(v, formatDashboardPct(v, row.applications)),
    },
    {
      title: t("col_completed"),
      dataIndex: "completed",
      align: "right",
      className: classnames(styles.funnelCol, styles.funnelFlowCell),
      sorter: sortable ? true : undefined,
      sortOrder:
        sortable && teamSort.field === "completed" ? teamSort.order : undefined,
      render: (v: number, row) =>
        renderFunnelCount(v, formatDashboardPct(v, row.responded)),
    },
    {
      title: t("col_maybe_plus"),
      dataIndex: "maybePlus",
      align: "right",
      className: styles.funnelCol,
      sorter: sortable ? true : undefined,
      sortOrder:
        sortable && teamSort.field === "maybePlus" ? teamSort.order : undefined,
      render: (v: number, row) =>
        renderFunnelCount(v, formatDashboardPct(v, row.completed)),
    },
  ];

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
      title: t("col_ai_screening"),
      children: buildAiScreeningColumns(true),
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
            <span className={styles.rowNameSecondary}>{row.secondary}</span>
          )}
        </div>
      ),
    },
    {
      title: t("col_ai_screening"),
      children: buildAiScreeningColumns(false),
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
    sorter:
      | SorterResult<TDashboardPivotRow>
      | SorterResult<TDashboardPivotRow>[],
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
      <div className={styles.dashboardScroll}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{t("title")}</h1>
          <p className={styles.pageSub}>{t("subtitle")}</p>
        </header>

        <div className={styles.dashboardContent}>
          <div className={styles.dashboardToolbar}>
            <FilterDropdown
              label={t("application_date")}
              value={datePreset}
              options={DATE_PRESET_OPTIONS.map((option) => ({
                value: option.key,
                label: option.label,
              }))}
              onChange={setDatePreset}
              showCalendarIcon
            />
            <FilterDropdown
              label={t("candidate_scope")}
              value={rejectedFilter}
              options={REJECTED_FILTER_OPTIONS.map((option) => ({
                value: option.value,
                label: t(option.labelKey),
              }))}
              onChange={setRejectedFilter}
            />
          </div>

          <DashboardSection loading={appsLoading} className={styles.kpiPanel}>
            <div className={styles.kpiScroll}>
              <div className={styles.overallKpiLayout}>
                <article
                  className={styles.openJobCard}
                  onClick={() => navigate("/app/jobs")}
                >
                  <p className={styles.metricLabel}>
                    {t("open_jobs")}{" "}
                    <Tooltip title={t("open_jobs_tooltip")}>
                      <InfoCircleOutlined />
                    </Tooltip>
                  </p>
                  <div className={styles.metricBody}>
                    <strong className={classnames(styles.metricValue)}>
                      {metaLoading ? "—" : formatDashboardNumber(kpi.openJobs)}
                    </strong>
                    <div className={styles.metricFooter}>
                      <div className={styles.pendingIntake}>
                        <div className={styles.pendingIntakeLabel}>
                          {t("pending_intake")}
                        </div>
                        <div className={styles.pendingIntakeCount}>
                          {metaLoading
                            ? "—"
                            : formatDashboardNumber(kpi.pendingIntake)}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                <div className={styles.kpiRightPanel}>
                  <div className={styles.metricCluster}>
                    <article
                      className={classnames(
                        styles.metricCard,
                        styles.metricCardPrimary,
                      )}
                    >
                      <p className={styles.metricLabel}>{t("applications")}</p>
                      <div className={classnames(styles.metricBody)}>
                        <strong className={styles.metricValue}>
                          {showFunnelMuted ? (
                            <span className={styles.numDash}>—</span>
                          ) : (
                            formatDashboardNumber(kpi.applications)
                          )}
                        </strong>
                        <Icon
                          icon={<MailBolt />}
                          style={{
                            position: "absolute",
                            color: "rgba(217, 217, 217, 1)",
                            fontSize: 72,
                            right: 10,
                            bottom: 0,
                          }}
                        />
                      </div>
                    </article>

                    <article className={styles.metricCard}>
                      <p className={styles.metricLabel}>
                        {t("responded")}{" "}
                        <Tooltip title={t("responded_tooltip")}>
                          <InfoCircleOutlined />
                        </Tooltip>
                      </p>
                      <div className={styles.metricBody}>
                        <strong className={styles.metricValue}>
                          {showFunnelMuted ? (
                            <span className={styles.numDash}>—</span>
                          ) : (
                            formatDashboardNumber(kpi.responded)
                          )}
                        </strong>
                        {!showFunnelMuted && (
                          <>
                            <p className={styles.metricNote}>
                              {formatDashboardPct(
                                kpi.responded,
                                kpi.applications,
                              )}{" "}
                              {t("of_applications")}
                            </p>
                            <div className={styles.metricFooter}>
                              <dl className={styles.metricPairs}>
                                <div className={styles.metricPairRow}>
                                  <dt>{t("never_started")}</dt>
                                  <dd>
                                    {formatDashboardNumber(kpi.neverStarted)}
                                  </dd>
                                </div>
                                <div
                                  className={classnames(styles.metricPairRow)}
                                >
                                  <dt>{t("of_applications_with_symbol")}</dt>
                                  <dd>
                                    {formatDashboardPct(
                                      kpi.neverStarted,
                                      kpi.applications,
                                    )}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                          </>
                        )}
                      </div>
                    </article>

                    <article className={styles.metricCard}>
                      <p className={styles.metricLabel}>{t("completed")}</p>
                      <div className={styles.metricBody}>
                        <strong className={styles.metricValue}>
                          {showFunnelMuted ? (
                            <span className={styles.numDash}>—</span>
                          ) : (
                            formatDashboardNumber(kpi.completed)
                          )}
                        </strong>
                        {!showFunnelMuted && (
                          <p className={styles.metricNote}>
                            {formatDashboardPct(kpi.completed, kpi.responded)}{" "}
                            {t("of_responded")}
                          </p>
                        )}
                        {!showFunnelMuted && (
                          <div className={styles.metricFooter}>
                            <dl className={styles.metricPairs}>
                              <div className={styles.metricPairRow}>
                                <dt>{t("in_progress")}</dt>
                                <dd>{formatDashboardNumber(kpi.inProgress)}</dd>
                              </div>
                              <div
                                className={classnames(
                                  styles.metricPairRow,
                                  styles.metricPairSub,
                                )}
                              >
                                <dt>{t("of_responded_with_symbol")}</dt>
                                <dd>
                                  {formatDashboardPct(
                                    kpi.inProgress,
                                    kpi.responded,
                                  )}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        )}
                      </div>
                    </article>

                    <article
                      className={classnames(
                        styles.metricCard,
                        styles.metricCardResult,
                      )}
                    >
                      <p className={styles.metricLabel}>
                        {t("results")}{" "}
                        <Tooltip title={t("results_tooltip")}>
                          <InfoCircleOutlined />
                        </Tooltip>
                      </p>
                      <div className={styles.metricBody}>
                        <strong className={styles.metricValue}>
                          {showFunnelMuted ? (
                            <span className={styles.numDash}>—</span>
                          ) : (
                            `${kpi.maybePlusPct.toFixed(1)}%`
                          )}
                        </strong>
                        {!showFunnelMuted && (
                          <p className={styles.metricNote}>
                            {t("maybe_or_above")}
                          </p>
                        )}
                        {!showFunnelMuted && (
                          <div className={styles.metricFooter}>
                            <div className={styles.metricDivider} />
                            {renderDistributionLegend(
                              EVALUATION_STACK_KEYS,
                              EVAL_STACK_STYLE,
                            )}
                            {renderDistributionBar(
                              kpi.completed,
                              kpi.evalStack,
                              EVAL_STACK_STYLE,
                              EVALUATION_STACK_KEYS,
                              styles.resultBar,
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  </div>

                  <article className={styles.rejectedCard}>
                    <p className={styles.metricLabel}>{t("rejected")}</p>
                    <div className={styles.metricBody}>
                      <strong className={styles.metricValue}>
                        {showRejectedMuted ? (
                          <span className={styles.numDash}>—</span>
                        ) : (
                          formatDashboardNumber(kpi.rejected)
                        )}
                      </strong>
                      {!showRejectedMuted && (
                        <p className={styles.metricNote}>
                          {formatDashboardPct(kpi.rejected, kpi.applications)}{" "}
                          {t("of_applications")}
                        </p>
                      )}
                      {!showRejectedMuted && (
                        <div className={styles.metricFooter}>
                          <div className={styles.metricDivider} />
                          {renderDistributionLegend(
                            REJECT_STACK_KEYS,
                            REJECT_STACK_STYLE,
                          )}
                          {renderDistributionBar(
                            kpi.rejected,
                            kpi.rejectStack,
                            REJECT_STACK_STYLE,
                            REJECT_STACK_KEYS,
                            styles.rejectedBar,
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </DashboardSection>

          <DashboardSection loading={appsLoading} className={styles.trendPanel}>
            <div className={styles.panelHeading}>
              <h2 className={styles.panelTitle}>{t("trends")}</h2>
              <SegmentControl
                value={trendGranularity}
                options={TREND_GRANULARITY_OPTIONS}
                onChange={setTrendGranularity}
                labels={{
                  daily: t("granularity_daily"),
                  weekly: t("granularity_weekly"),
                  monthly: t("granularity_monthly"),
                }}
              />
            </div>
            <div className={styles.legendRow}>
              {TREND_SERIES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={classnames(styles.legendChip, {
                    [styles.legendChipMuted]: !enabledTrendSeries.has(s.key),
                  })}
                  onClick={() => toggleTrendSeries(s.key)}
                >
                  <span
                    className={styles.legendDot}
                    style={{ background: s.color }}
                  />
                  {s.label}
                </button>
              ))}
            </div>
            {enabledTrendSeries.size === 0 ? (
              <div className={styles.chartEmpty}>{t("trends_empty")}</div>
            ) : (
              <div className={styles.chartWrap}>
                <Line {...lineConfig} />
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            loading={appsLoading}
            className={styles.tableSection}
          >
            <div className={styles.sectionHeadingRow}>
              <h2 className={styles.sectionHeading}>{t("by_team")}</h2>
              {drilldownTeamId != null && (
                <span className={styles.titleChip}>
                  {orgNodes.find((n) => n.id === drilldownTeamId)?.name}
                  <CloseOutlined
                    onClick={() => setDrilldownTeamId(null)}
                    style={{ fontSize: 10, cursor: "pointer" }}
                  />
                </span>
              )}
              {!drilldownTeamId && (
                <div className={styles.filterButton}>
                  <OrgNodeTreeSelect
                    multiple
                    allowClear
                    style={{ width: "100%" }}
                    value={selectedDeptIds}
                    maxTagCount="responsive"
                    placeholder={t("filter_departments")}
                    onChange={(v: { value: number }[]) => {
                      setSelectedDeptIds(v.map((item) => item.value));
                      setTeamPage(1);
                    }}
                  />
                </div>
              )}
            </div>
            <div className={styles.tableWrap}>
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
            {drilldownTeamId == null && teamRows.length > 0 && (
              <p className={styles.tableFootnote}>
                {t("teams_footnote", {
                  start: teamRows.length ? (teamPage - 1) * 10 + 1 : 0,
                  end: Math.min(teamPage * 10, teamRows.length),
                  total: teamRows.length,
                })}
              </p>
            )}
          </DashboardSection>

          <DashboardSection
            loading={appsLoading}
            className={styles.tableSection}
          >
            <div className={styles.sectionHeadingRow}>
              <h2 className={styles.sectionHeading}>{t("by_job")}</h2>
              <p className={styles.sectionHint}>{t("by_job_hint")}</p>
            </div>
            <div className={styles.tableWrap}>
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
          </DashboardSection>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
