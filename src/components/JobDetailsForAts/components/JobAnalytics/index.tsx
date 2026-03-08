import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, Spin, Table } from "antd";
import useJob from "@/hooks/useJob";
import { Get } from "@/utils/request";
import { getSourcingChannel, parseJSON, SOURCING_CHANNEL_KEYS } from "@/utils";
import {
  getStageEntryTime,
  getStageKey,
  type TTalentListItem,
} from "../JobPipeline/components/utils";
import {
  PREFIX_DEFAULT_STAGE_KEYS,
  SUFFIX_DEFAULT_STAGE_KEYS,
} from "@/utils/consts";
import { FUNNEL_COLORS, FUNNEL_BG_COLORS } from "./colors";
import styles from "./style.module.less";
import useSourcingChannels from "@/hooks/useSourcingChannels";

const HOURS_PER_DAY = 24;
const MS_PER_HOUR = 60 * 60 * 1000;

function computeAvgDaysInStage(
  stageId: string,
  talentsInStage: TTalentListItem[],
): number | null {
  const now = Date.now();

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
  talentsInStage: TTalentListItem[],
  t: (key: string) => string,
): string {
  const countBySource: Record<string, number> = {};
  for (const t of talentsInStage) {
    const src = getSourcingChannel(t.source_channel);
    countBySource[src] = (countBySource[src] ?? 0) + 1;
  }
  const entries = Object.entries(countBySource);
  if (entries.length === 0) return "--";
  const [topKey] = entries.sort((a, b) => b[1] - a[1])[0];
  if (SOURCING_CHANNEL_KEYS.includes(topKey)) {
    return t(`sourcing_channel.${topKey}`);
  } else {
    return topKey;
  }
}

const FUNNEL_BOTTOM_WIDTH = 229;

const JobAnalytics = () => {
  const { job } = useJob();
  const [loading, setLoading] = useState(true);
  const [talents, setTalents] = useState<TTalentListItem[]>([]);
  const [sourcingChannel, setSourcingChannel] = useState<string | undefined>();
  const [timeRange, setTimeRange] = useState<string>("all");

  const { t } = useTranslation();
  const tKey = (key: string) => t(`job_details.analytics_section.${key}`);
  const pipelineTKey = (key: string) => t(`pipeline_section.${key}`);
  const { customSources } = useSourcingChannels({
    jobId: job?.id,
  });

  const allStages = useMemo(() => {
    if (!job) return [];
    const stages = [
      ...PREFIX_DEFAULT_STAGE_KEYS.filter((key) => key !== "reached_out").map(
        (key, i) => ({
          id: key,
          name: pipelineTKey(key),
          order: i,
          isDefault: true,
        }),
      ),
      ...(job.pipeline_stages ? JSON.parse(job.pipeline_stages) : []),
    ];
    SUFFIX_DEFAULT_STAGE_KEYS.forEach((key) => {
      stages.push({
        id: key,
        name: pipelineTKey(key),
        order: stages.length,
        isDefault: true,
      });
    });
    return stages;
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
        }
      })
      .finally(() => setLoading(false));
  }, [job?.id]);

  const filteredTalents = useMemo(() => {
    return talents.filter((item) => {
      if (
        sourcingChannel &&
        getSourcingChannel(item.source_channel) !== sourcingChannel
      )
        return false;
      if (timeRange === "last30") {
        const created = item.created_at
          ? new Date(item.created_at).getTime()
          : 0;
        if (Date.now() - created > 30 * 24 * MS_PER_HOUR) return false;
      }
      return true;
    });
  }, [talents, sourcingChannel, timeRange]);

  const stageStats = useMemo(() => {
    const result: {
      stageId: string;
      stageName: string;
      candidates: number;
      avgDaysInStage: number | null;
      topSource: string;
      percentageName?: string;
    }[] = [];

    for (let i = 0; i < allStages.length; i++) {
      const stage = allStages[i];

      const talentsInStage = filteredTalents.filter(
        (t) => t.stageKey === stage.id,
      );

      const avgDaysInStage = computeAvgDaysInStage(stage.id, talentsInStage);
      const topSource = getTopSource(talentsInStage, t);

      let percentageName = "";
      if (stage.id === "applied") {
        percentageName = "Starting";
      } else if (stage.id === "started_ai_interview") {
        percentageName = "Started AI Interview/Applied";
      } else if (stage.id === "ai_interview_completed") {
        percentageName = "AI Interview Completed/Started AI Interview";
      } else if (stage.id === "shortlisted") {
        percentageName = "Shortlisted/Applied";
      } else if (stage.id === "rejected") {
        percentageName = "Rejected/Applied";
      }

      result.push({
        stageId: stage.id,
        stageName: stage.name,
        candidates: talentsInStage.length,
        avgDaysInStage: avgDaysInStage != null ? avgDaysInStage : null,
        topSource,
        percentageName,
      });
    }
    return result;
  }, [allStages, filteredTalents, tKey]);

  const funnelCumulativeCounts = useMemo(() => {
    const arr: number[] = [];
    let sum = 0;
    for (let i = stageStats.length - 1; i >= 0; i--) {
      if (i === stageStats.length - 1) {
        arr[i] = stageStats[i].candidates;
      } else {
        sum += stageStats[i].candidates;
        arr[i] = sum;
      }
      if (i === 0) {
        arr[i] += arr[arr.length - 1]; // applied 数量包含 rejected
      }
    }
    return arr;
  }, [stageStats]);

  const funnelWidths = useMemo(() => {
    const n = stageStats.length;
    return Array.from({ length: n }, (_, i) => {
      const layersFromBottom = n - 1 - i;
      if (layersFromBottom === 0) return FUNNEL_BOTTOM_WIDTH;
      const stepSum = Array.from(
        { length: layersFromBottom },
        (_, j) => 22 + j * 2,
      ).reduce((a, b) => a + b, 0);
      return FUNNEL_BOTTOM_WIDTH + stepSum;
    });
  }, [stageStats.length]);

  const getConversionRate = (index: number) => {
    if (index === 0) return "--";

    const stage = allStages[index];
    const allTalentCount = filteredTalents.length;

    const denominator = [
      "started_ai_interview",
      "shortlisted",
      "rejected",
    ].includes(stage.id)
      ? allTalentCount
      : stage.id === "ai_interview_completed"
        ? filteredTalents.filter((t) => !!t.job_apply?.interview_started_at)
            .length
        : funnelCumulativeCounts[index - 1];

    const numerator = getNumerator(index);

    if (denominator == null || numerator == null || denominator === 0)
      return "0%";
    return `${Math.round((Math.min(numerator, denominator) / denominator) * 100)}%`;
  };

  const getNumerator = (index: number) => {
    const stage = allStages[index];
    if (stage.id === "started_ai_interview") {
      return filteredTalents.filter((t) => !!t.job_apply?.interview_started_at)
        .length;
    } else if (stage.id === "ai_interview_completed") {
      return filteredTalents.filter((t) => !!t.job_apply?.interview_finished_at)
        .length;
    }
    return funnelCumulativeCounts[index];
  };

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
          options={[
            ...SOURCING_CHANNEL_KEYS.map((key) => ({
              value: key,
              label: t(`sourcing_channel.${key}`),
            })),
            ...customSources.map((cs) => ({
              value: cs.name,
              label: cs.name,
            })),
          ]}
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
            <div className={styles.funnelSectionWrap}>
              <div className={styles.funnelWrap}>
                {stageStats.map((row, index) => {
                  const topW = funnelWidths[index];
                  const bottomW =
                    index < stageStats.length - 1
                      ? funnelWidths[index + 1]
                      : Math.max(topW - 22, 40);
                  const leftBottomX = (topW - bottomW) / 2;
                  const rightBottomX = (topW + bottomW) / 2;
                  const clipPath = `polygon(0 0, ${topW}px 0, ${rightBottomX}px 100%, ${leftBottomX}px 100%)`;
                  const bgClipPath = `polygon(${18 * index - ((index - 1) * index) / 2}px 0, 100% 0, calc(100% - ${11 + index}px) 100%, ${18 * index - ((index - 1) * index) / 2 + 18 - index}px 100%)`;

                  return (
                    <div
                      key={row.stageId}
                      className={styles.funnelRow}
                      style={{
                        backgroundColor:
                          FUNNEL_BG_COLORS[index % FUNNEL_BG_COLORS.length],
                        clipPath: bgClipPath,
                      }}
                    >
                      <div
                        className={styles.funnelBarWrap}
                        style={{
                          width:
                            stageStats.length > 0 ? funnelWidths[0] : undefined,
                        }}
                      >
                        <div
                          className={styles.funnelBar}
                          style={{
                            width: topW,
                            backgroundColor:
                              FUNNEL_COLORS[index % FUNNEL_COLORS.length],
                            clipPath,
                          }}
                        >
                          <span className={styles.funnelStageName}>
                            {row.stageName}
                          </span>
                        </div>
                      </div>
                      <div className={styles.funnelRight}>
                        <div className={styles.conversionText}>
                          {row.percentageName ||
                            `${row.stageName}/${stageStats[index - 1].stageName}`}
                          : {getConversionRate(index)}
                        </div>
                        <div className={styles.totalCountText}>
                          {getNumerator(index)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                {
                  title: tKey("stage"),
                  dataIndex: "stageName",
                  key: "stageName",
                },
                {
                  title: tKey("candidates"),
                  key: "numerator",
                  render: (_: unknown, _row: unknown, index: number) => {
                    return getNumerator(index);
                  },
                },
                {
                  title: tKey("conversion_rate"),
                  key: "conversionRate",
                  render: (_: unknown, _row: unknown, index: number) => {
                    return getConversionRate(index);
                  },
                },
                {
                  title: tKey("avg_days_in_stage"),
                  key: "avgDaysInStage",
                  render: (
                    _: unknown,
                    row: {
                      avgDaysInStage: number | null;
                    },
                  ) =>
                    row.avgDaysInStage != null
                      ? row.avgDaysInStage.toFixed(1)
                      : "--",
                },
                {
                  title: tKey("top_source"),
                  dataIndex: "topSource",
                  key: "topSource",
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default JobAnalytics;
