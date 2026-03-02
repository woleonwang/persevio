import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, Spin, Table } from "antd";
import useJob from "@/hooks/useJob";
import { Get } from "@/utils/request";
import { getSourcingChannel, parseJSON, SOURCING_CHANNEL_KEYS } from "@/utils";
import { getStageKey, type TTalentListItem } from "../JobPipeline/components";
import { DEFAULT_STAGE_KEYS } from "@/utils/consts";
import styles from "./style.module.less";

const HOURS_PER_DAY = 24;
const MS_PER_HOUR = 60 * 60 * 1000;

function getStageEntryTime(
  stageId: string,
  talent: TTalentListItem,
): number | null {
  if (talent.stage_updated_at) {
    return new Date(talent.stage_updated_at).getTime();
  }
  if (!DEFAULT_STAGE_KEYS.includes(stageId)) {
    return null;
  }
  switch (stageId) {
    case "applied":
      return talent.created_at ? new Date(talent.created_at).getTime() : null;
    case "started_ai_interview":
      return talent.job_apply?.interview_started_at
        ? new Date(talent.job_apply.interview_started_at).getTime()
        : null;
    case "ai_interview_completed":
      return talent.job_apply?.interview_finished_at
        ? new Date(talent.job_apply.interview_finished_at).getTime()
        : null;
    default:
      return null;
  }
}

function computeAvgDaysInStage(
  stageId: string,
  talentsInStage: TTalentListItem[],
  linkedinProfilesForReachedOut: TLinkedinProfile[],
): number | null {
  const now = Date.now();

  if (stageId === "reached_out") {
    if (linkedinProfilesForReachedOut.length === 0) return null;
    const totalHours = linkedinProfilesForReachedOut.reduce((sum, p) => {
      const entry = new Date(p.created_at).getTime();
      return sum + (now - entry) / MS_PER_HOUR;
    }, 0);
    return totalHours / linkedinProfilesForReachedOut.length / HOURS_PER_DAY;
  }

  const hoursList: number[] = [];
  for (const t of talentsInStage) {
    const entry = getStageEntryTime(stageId, t);
    if (entry == null) continue;
    hoursList.push((now - entry) / MS_PER_HOUR);
  }
  if (hoursList.length === 0) return null;
  const totalHours = hoursList.reduce((a, b) => a + b, 0);
  return totalHours / hoursList.length / HOURS_PER_DAY;
}

function getTopSource(
  stageId: string,
  talentsInStage: TTalentListItem[],
  _linkedinProfilesForReachedOut: TLinkedinProfile[],
  tKey: (key: string) => string,
): string {
  if (stageId === "reached_out") {
    return tKey("top_source_persevio_outreach");
  }
  const countBySource: Record<string, number> = {};
  for (const t of talentsInStage) {
    const src = getSourcingChannel(t.source_channel);
    countBySource[src] = (countBySource[src] ?? 0) + 1;
  }
  const entries = Object.entries(countBySource);
  if (entries.length === 0) return "--";
  const [topKey] = entries.sort((a, b) => b[1] - a[1])[0];
  return tKey(`sourcing_channel.${topKey}`);
}

const FUNNEL_BOTTOM_WIDTH = 229;
const FUNNEL_COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#14B8A6",
  "#22C55E",
  "#FCD34D",
  "#FB923C",
  "#F87171",
  "#EC4899",
  "#EF4444",
];

const JobAnalytics = () => {
  const { job } = useJob();
  const [loading, setLoading] = useState(true);
  const [talents, setTalents] = useState<TTalentListItem[]>([]);
  const [linkedinProfiles, setLinkedinProfiles] = useState<TLinkedinProfile[]>(
    [],
  );
  const [sourcingChannel, setSourcingChannel] = useState<string | undefined>();
  const [timeRange, setTimeRange] = useState<string>("all");

  const { t } = useTranslation();
  const tKey = (key: string) => t(`job_details.analytics_section.${key}`);
  const pipelineTKey = (key: string) => t(`pipeline_section.${key}`);

  const allStages = useMemo(() => {
    if (!job) return [];
    return [
      ...DEFAULT_STAGE_KEYS.map((key, i) => ({
        id: key,
        name: pipelineTKey(key),
        order: i,
        isDefault: true,
      })),
      ...(job.pipeline_stages ? JSON.parse(job.pipeline_stages) : []),
    ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [job]);

  useEffect(() => {
    if (!job?.id) return;
    setLoading(true);
    Get<{
      talents: TTalentListItem[];
      linkedin_profiles: TLinkedinProfile[];
    }>(`/api/talents?job_id=${job.id}`)
      .then(({ code, data }) => {
        if (code === 0) {
          const parsedTalents = (data.talents ?? []).map((t) => ({
            ...t,
            basicInfo: parseJSON(t.basic_info_json),
            parsedEvaluateResult: parseJSON(t.evaluate_json),
          }));
          setTalents(
            parsedTalents.map((t) => ({
              ...t,
              stageKey: getStageKey(t),
            })),
          );
          setLinkedinProfiles(data.linkedin_profiles ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [job?.id]);

  const filteredTalents = useMemo(() => {
    return talents.filter((item) => {
      if (sourcingChannel && getSourcingChannel(item.source_channel) !== sourcingChannel)
        return false;
      if (timeRange === "last30") {
        const created = item.created_at ? new Date(item.created_at).getTime() : 0;
        if (Date.now() - created > 30 * 24 * MS_PER_HOUR) return false;
      }
      return true;
    });
  }, [talents, sourcingChannel, timeRange]);

  const filteredLinkedinProfiles = useMemo(() => {
    return linkedinProfiles.filter((p) => {
      if (timeRange === "last30") {
        const created = new Date(p.created_at).getTime();
        if (Date.now() - created > 30 * 24 * MS_PER_HOUR) return false;
      }
      return true;
    });
  }, [linkedinProfiles, timeRange]);

  const stageStats = useMemo(() => {
    const result: {
      stageId: string;
      stageName: string;
      candidates: number;
      conversionRate: number | null;
      avgDaysInStage: number | null;
      topSource: string;
    }[] = [];

    let prevCount = 0;
    for (let i = 0; i < allStages.length; i++) {
      const stage = allStages[i];
      const isReachedOut = stage.id === "reached_out";
      const count = isReachedOut
        ? filteredLinkedinProfiles.length
        : filteredTalents.filter((t) => t.stageKey === stage.id).length;

      const conversionRate =
        i === 0 ? null : prevCount > 0 ? Math.round((count / prevCount) * 100) : null;

      const talentsInStage = isReachedOut
        ? []
        : filteredTalents.filter((t) => t.stageKey === stage.id);
      const linkedinForReachedOut = isReachedOut ? filteredLinkedinProfiles : [];

      const avgDaysInStage = computeAvgDaysInStage(
        stage.id,
        talentsInStage,
        linkedinForReachedOut,
      );
      const topSource = getTopSource(
        stage.id,
        talentsInStage,
        linkedinForReachedOut,
        tKey,
      );

      result.push({
        stageId: stage.id,
        stageName: stage.name,
        candidates: count,
        conversionRate,
        avgDaysInStage: avgDaysInStage != null ? avgDaysInStage : null,
        topSource,
      });
      prevCount = count;
    }
    return result;
  }, [allStages, filteredTalents, filteredLinkedinProfiles, tKey]);

  const funnelCumulativeCounts = useMemo(() => {
    const arr: number[] = [];
    let sum = 0;
    for (let i = stageStats.length - 1; i >= 0; i--) {
      sum += stageStats[i].candidates;
      arr[i] = sum;
    }
    return arr;
  }, [stageStats]);

  const funnelWidths = useMemo(() => {
    const n = stageStats.length;
    return Array.from({ length: n }, (_, i) => {
      const layersFromBottom = n - 1 - i;
      if (layersFromBottom === 0) return FUNNEL_BOTTOM_WIDTH;
      const stepSum = Array.from({ length: layersFromBottom }, (_, j) => 22 + j * 2).reduce(
        (a, b) => a + b,
        0,
      );
      return FUNNEL_BOTTOM_WIDTH + stepSum;
    });
  }, [stageStats.length]);

  if (!job) return <Spin />;

  return (
    <div className={styles.container}>
      <div className={styles.filterRow}>
        <Select
          className={styles.filterSelect}
          placeholder={tKey("all_sources")}
          value={sourcingChannel}
          onChange={setSourcingChannel}
          allowClear
          options={SOURCING_CHANNEL_KEYS.map((key) => ({
            value: key,
            label: tKey(`sourcing_channel.${key}`),
          }))}
          style={{ width: 160 }}
        />
        <Select
          className={styles.filterSelect}
          value={timeRange}
          onChange={setTimeRange}
          options={[
            { value: "all", label: tKey("all_time") },
            { value: "last30", label: tKey("last_30_days") },
          ]}
          style={{ width: 160 }}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>
          <Spin />
        </div>
      ) : (
        <>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>{tKey("pipeline_funnel")}</div>
            <div className={styles.funnelWrap}>
              {stageStats.map((row, index) => {
                const displayCount = funnelCumulativeCounts[index] ?? 0;
                const topW = funnelWidths[index];
                const bottomW =
                  index < stageStats.length - 1 ? funnelWidths[index + 1] : topW;
                const n = stageStats.length;
                const leftBottomX = (topW - bottomW) / 2;
                const rightBottomX = (topW + bottomW) / 2;
                const H = 36;
                const midY = H / 2;
                const curve = 2 + (n - 1 - index) * 0.8;
                const clipPath =
                  index < stageStats.length - 1
                    ? `path("M 0 0 Q ${leftBottomX / 2 + curve} ${midY} ${leftBottomX} ${H} L ${rightBottomX} ${H} Q ${(topW + rightBottomX) / 2 - curve} ${midY} ${topW} 0 Z")`
                    : undefined;

                return (
                  <div key={row.stageId} className={styles.funnelRow}>
                    <div
                      className={styles.funnelBarWrap}
                      style={{
                        width: stageStats.length > 0 ? funnelWidths[0] : undefined,
                      }}
                    >
                      <div
                        className={styles.funnelBar}
                        style={{
                          width: topW,
                          backgroundColor: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
                          clipPath,
                        }}
                      >
                        <span className={styles.funnelStageName}>
                          {row.stageName}
                        </span>
                      </div>
                    </div>
                    <div className={styles.funnelRight}>
                      {row.conversionRate != null && (
                        <span className={styles.conversionText}>
                          {tKey("conversion_rate_label")}: {row.conversionRate}%{" "}
                          {displayCount}
                        </span>
                      )}
                      {row.conversionRate == null && index === 0 && (
                        <span className={styles.conversionText}>
                          {tKey("starting")} {displayCount}
                        </span>
                      )}
                      {row.conversionRate == null && index > 0 && (
                        <span className={styles.conversionText}>
                          {displayCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              {tKey("detailed_stage_breakdown")}
            </div>
            <Table
              className={styles.table}
              dataSource={stageStats}
              rowKey="stageId"
              pagination={false}
              columns={[
                { title: tKey("stage"), dataIndex: "stageName", key: "stageName" },
                {
                  title: tKey("candidates"),
                  dataIndex: "candidates",
                  key: "candidates",
                },
                {
                  title: tKey("conversion_rate"),
                  key: "conversionRate",
                  render: (_: unknown, _row: unknown, index: number) => {
                    if (index === 0) return "--";
                    const prev = funnelCumulativeCounts[index - 1];
                    const curr = funnelCumulativeCounts[index];
                    if (prev == null || curr == null || prev === 0) return "--";
                    return `${Math.round((curr / prev) * 100)}%`;
                  },
                },
                {
                  title: tKey("avg_days_in_stage"),
                  key: "avgDaysInStage",
                  render: (_: unknown, row: {
                    conversionRate: number | null;
                    avgDaysInStage: number | null;
                  }) =>
                    row.avgDaysInStage != null ? row.avgDaysInStage.toFixed(1) : "--",
                },
                { title: tKey("top_source"), dataIndex: "topSource", key: "topSource" },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default JobAnalytics;
