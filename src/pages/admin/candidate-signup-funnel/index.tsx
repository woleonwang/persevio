import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Collapse,
  DatePicker,
  Empty,
  Progress,
  Select,
  Spin,
  Statistic,
  Table,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

import { Get } from "@/utils/request";

import {
  DEVICE_OPTIONS,
  FUNNEL_BUILTIN_SOURCES,
  FUNNEL_SOURCE_OTHERS,
  STEP_DETAIL_CONFIG,
  buildCohortPool,
  buildFunnelRows,
  breakdownByExtraParam,
  collectJobIdsFromTracks,
  countCohortUsersWithEvent,
  countPreFunnelEvents,
  formatPercent,
  isCohortStepKey,
  numericExtraParamStats,
  type TBreakdownRow,
  type TDeviceType,
  type TEventTrack,
  type TFunnelFilters,
  type TFunnelStepKey,
} from "./utils";
import styles from "./style.module.less";

type TFunnelPayload = {
  since: string;
  until: string;
  event_tracks: TEventTrack[];
};

type TJobOption = {
  id: number;
  name: string;
};

const breakdownColumns = (
  showConversion: boolean,
): ColumnsType<TBreakdownRow> => [
  { title: "Segment", dataIndex: "label", key: "label" },
  { title: "Count", dataIndex: "count", key: "count", width: 100 },
  { title: "Share", dataIndex: "share", key: "share", width: 100 },
  ...(showConversion
    ? [
        {
          title: "To next step",
          dataIndex: "conversionToNext",
          key: "conversionToNext",
          width: 120,
        },
      ]
    : []),
];

const CandidateSignupFunnel = () => {
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<TEventTrack[]>([]);
  const [dataSince, setDataSince] = useState<Dayjs>();
  const [dataUntil, setDataUntil] = useState<Dayjs>();
  const [jobNames, setJobNames] = useState<Record<number, string>>({});
  const [filters, setFilters] = useState<TFunnelFilters>({
    since: dayjs().subtract(30, "day").format("YYYY-MM-DD"),
    until: dayjs().format("YYYY-MM-DD"),
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [funnelRes, jobsRes] = await Promise.all([
          Get<TFunnelPayload>(
            "/api/admin/candidate_signup_funnel/event_tracks",
          ),
          Get<{ jobs: TJobOption[] }>("/api/admin/jobs/options"),
        ]);

        if (funnelRes.code === 0 && funnelRes.data) {
          const payload = funnelRes.data;
          setTracks(payload.event_tracks ?? []);
          const since = dayjs(payload.since);
          const until = dayjs(payload.until);
          setDataSince(since);
          setDataUntil(until);
          setFilters({
            since: since.format("YYYY-MM-DD"),
            until: until.format("YYYY-MM-DD"),
          });
        } else {
          setTracks([]);
        }

        if (jobsRes.code === 0 && jobsRes.data?.jobs) {
          const map: Record<number, string> = {};
          for (const job of jobsRes.data.jobs) {
            map[job.id] = job.name;
          }
          setJobNames(map);
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const funnelRows = useMemo(
    () => buildFunnelRows(tracks, filters),
    [tracks, filters],
  );
  const cohortPool = useMemo(
    () => buildCohortPool(tracks, filters),
    [tracks, filters],
  );

  const enterApplyCount = countPreFunnelEvents(
    tracks,
    "enter_apply_flow",
    filters,
  );
  const conversationCompletedCount = countCohortUsersWithEvent(
    tracks,
    cohortPool,
    "conversation_completed",
  );

  const jobSelectOptions = useMemo(() => {
    return collectJobIdsFromTracks(tracks).map((id) => ({
      value: id,
      label: jobNames[id] ? `${jobNames[id]} (#${id})` : `Job #${id}`,
    }));
  }, [tracks, jobNames]);

  const sourceSelectOptions = useMemo(
    () => [
      ...FUNNEL_BUILTIN_SOURCES.map((source) => ({
        value: source,
        label: source,
      })),
      { value: FUNNEL_SOURCE_OTHERS, label: "Others" },
    ],
    [],
  );

  const dateRange: [Dayjs, Dayjs] = [
    dayjs(filters.since),
    dayjs(filters.until),
  ];

  const disableDate = (current: Dayjs) => {
    if (!dataSince || !dataUntil) {
      return false;
    }
    return (
      current.isBefore(dataSince.startOf("day")) ||
      current.isAfter(dataUntil.endOf("day"))
    );
  };

  const collapseItems = funnelRows.map((row) => {
    const detail = STEP_DETAIL_CONFIG[row.key as TFunnelStepKey];
    const stepPool = isCohortStepKey(row.key) ? cohortPool : undefined;
    if (!detail) {
      return {
        key: row.key,
        label: (
          <div className={styles.collapseLabel}>
            <span>{row.label}</span>
            <span className={styles.collapseMeta}>
              {row.count.toLocaleString()} · step {row.stepConversion}
            </span>
          </div>
        ),
        children: (
          <Typography.Text type="secondary">No detail view.</Typography.Text>
        ),
      };
    }

    return {
      key: row.key,
      label: (
        <div className={styles.collapseLabel}>
          <span>{row.label}</span>
          <span className={styles.collapseMeta}>
            {row.count.toLocaleString()} · step {row.stepConversion}
          </span>
        </div>
      ),
      children: (
        <div className={styles.detailBlock}>
          {detail.numericStats?.map((stat) => {
            const result = numericExtraParamStats(
              tracks,
              row.key,
              stat.paramKey,
              stepPool,
              stepPool ? undefined : filters,
            );
            return (
              <Card
                key={stat.paramKey}
                size="small"
                title={stat.title}
                className={styles.detailCard}
              >
                <div className={styles.statsRow}>
                  <Statistic title="Samples" value={result.count} />
                  <Statistic title="p50" value={result.p50} suffix="ms" />
                  <Statistic title="p75" value={result.p75} suffix="ms" />
                  <Statistic title="p90" value={result.p90} suffix="ms" />
                </div>
              </Card>
            );
          })}
          {detail.breakdowns?.map((breakdown) => {
            const rows = breakdownByExtraParam(
              tracks,
              row.key,
              breakdown.paramKey,
              breakdown.nextEventName,
              stepPool,
              stepPool ? undefined : filters,
            );
            return (
              <Card
                key={breakdown.paramKey}
                size="small"
                title={breakdown.title}
                className={styles.detailCard}
              >
                {rows.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No data"
                  />
                ) : (
                  <Table
                    size="small"
                    pagination={false}
                    rowKey="key"
                    columns={breakdownColumns(!!breakdown.nextEventName)}
                    dataSource={rows}
                  />
                )}
              </Card>
            );
          })}
        </div>
      ),
    };
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>Candidate Signup Funnel</div>

      {loading ? (
        <div className={styles.loadingWrap}>
          <Spin size="large" />
        </div>
      ) : tracks.length === 0 ? (
        <Empty description="No funnel events in the last 30 days" />
      ) : (
        <div className={styles.body}>
          <div className={styles.filterRow}>
            <div className={styles.filterItem}>
              <DatePicker.RangePicker
                value={dateRange}
                allowClear={false}
                disabledDate={disableDate}
                onChange={(values) => {
                  if (!values?.[0] || !values[1]) {
                    return;
                  }
                  setFilters((prev) => ({
                    ...prev,
                    since: values[0]!.format("YYYY-MM-DD"),
                    until: values[1]!.format("YYYY-MM-DD"),
                  }));
                }}
              />
            </div>
            <div className={styles.filterItem}>
              <Select
                allowClear
                placeholder="All sources"
                style={{ minWidth: 160 }}
                value={filters.source}
                options={sourceSelectOptions}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, source: value }))
                }
              />
            </div>
            <div className={styles.filterItem}>
              <Select
                allowClear
                showSearch
                placeholder="All jobs"
                style={{ minWidth: 220 }}
                optionFilterProp="label"
                value={filters.jobId}
                options={jobSelectOptions}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, jobId: value }))
                }
              />
            </div>
            <div className={styles.filterItem}>
              <Select
                allowClear
                placeholder="All devices"
                style={{ minWidth: 140 }}
                value={filters.device}
                options={DEVICE_OPTIONS}
                onChange={(value: TDeviceType | undefined) =>
                  setFilters((prev) => ({ ...prev, device: value }))
                }
              />
            </div>
          </div>

          <Card className={styles.summaryCard}>
            <div className={styles.statsRow}>
              <Statistic
                title="End-to-end"
                value={formatPercent(
                  conversationCompletedCount,
                  enterApplyCount,
                )}
              />
            </div>
          </Card>

          <div className={styles.splitRow}>
            <div className={styles.funnelSection}>
              <Card title="Funnel" className={styles.funnelCard}>
                <div className={styles.funnelBars}>
                  {funnelRows.map((row, index) => (
                    <div key={row.key} className={styles.funnelBarRow}>
                      <div className={styles.funnelBarHead}>
                        <Typography.Text strong>{row.label}</Typography.Text>
                        <Typography.Text>
                          {row.count.toLocaleString()}
                        </Typography.Text>
                      </div>
                      <Progress
                        percent={Math.max(
                          row.barPercent,
                          row.count > 0 ? 2 : 0,
                        )}
                        showInfo={false}
                        strokeColor="#1677ff"
                        trailColor="#f0f0f0"
                      />
                      {index > 0 && (
                        <Typography.Text
                          type="secondary"
                          className={styles.funnelStepRate}
                        >
                          Step conversion: {row.stepConversion}
                        </Typography.Text>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className={styles.detailsSection}>
              <Card title="Step details" className={styles.detailsCard}>
                <Collapse items={collapseItems} />
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateSignupFunnel;
