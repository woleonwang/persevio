import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const SGT = "Asia/Singapore";

export type TDashboardRejectedFilter =
  | "all"
  | "excl_rejected"
  | "only_rejected";
export type TDashboardDatePreset =
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "since_posted";
export type TTrendGranularity = "daily" | "weekly" | "monthly";

export type TDashboardApplication = {
  application_id: number;
  job_id: number;
  applied_at: string;
  is_rejected: boolean;
  reject_reason_type: string | null;
  ai_screening_responded: boolean;
  ai_screening_completed: boolean;
  interview_recommendation: string | null;
  current_stage_key: string;
  stage_entered_at: string;
};

export type TDashboardDatePresetOption = {
  key: TDashboardDatePreset;
  label: string;
  days?: number;
  sincePosted?: boolean;
};

export const DATE_PRESET_OPTIONS: TDashboardDatePresetOption[] = [
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "since_posted", label: "Since Posted", sincePosted: true },
];

export const MAYBE_OR_ABOVE = new Set([
  "absolutely",
  "yes",
  "yes_but",
  "maybe",
]);

export const EVALUATION_STACK_KEYS = [
  "absolutely",
  "yes",
  "yes_but",
  "maybe",
  "no",
] as const;

export const REJECT_STACK_KEYS = [
  "not_shortlisted",
  "did_not_pass_interview",
  "headcount_freeze",
  "candidate_withdrew",
  "other",
] as const;

export type TTrendSeriesKey =
  | "applications"
  | "responded"
  | "never_started"
  | "completed"
  | "in_progress"
  | "maybe_plus";

export const TREND_SERIES: {
  key: TTrendSeriesKey;
  label: string;
  color: string;
  defaultOn: boolean;
}[] = [
  {
    key: "applications",
    label: "Applications",
    color: "#3682FE",
    defaultOn: true,
  },
  {
    key: "responded",
    label: "AI Screening - Responded",
    color: "#7C36FE",
    defaultOn: true,
  },
  {
    key: "never_started",
    label: "AI Screening - Never Started",
    color: "#F9A930",
    defaultOn: false,
  },
  {
    key: "completed",
    label: "AI Screening - Completed",
    color: "#26BC5D",
    defaultOn: true,
  },
  {
    key: "in_progress",
    label: "AI Screening - In Progress",
    color: "#E03D3D",
    defaultOn: false,
  },
  {
    key: "maybe_plus",
    label: "AI Screening - Maybe or above",
    color: "#54D5EF",
    defaultOn: true,
  },
];

export type TDashboardKpiMetrics = {
  openJobs: number;
  pendingIntake: number;
  applications: number;
  responded: number;
  neverStarted: number;
  completed: number;
  inProgress: number;
  maybePlusCount: number;
  maybePlusPct: number;
  rejected: number;
  evalStack: Record<(typeof EVALUATION_STACK_KEYS)[number], number>;
  rejectStack: Record<(typeof REJECT_STACK_KEYS)[number], number>;
};

export type TDashboardPivotRow = {
  key: string;
  name: string;
  pathTooltip?: string;
  secondary?: string;
  openJobs?: number;
  applications: number;
  responded: number;
  completed: number;
  maybePlus: number;
  active: number;
  rejected: number;
  lastPostedAt: string | null;
  jobId?: number;
  invitationToken?: string;
};

export type TTrendPoint = {
  bucketKey: string;
  bucketLabel: string;
  series: string;
  value: number;
};

type TJobLight = Pick<
  IJob,
  | "id"
  | "name"
  | "posted_at"
  | "initial_posted_at"
  | "org_node_id"
  | "invitation_token"
>;

export function getJobLifecycleStatus(
  job: Pick<IJob, "posted_at" | "initial_posted_at">,
): "published" | "pending_intake" | "delisted" {
  if (job.posted_at) return "published";
  if (job.initial_posted_at) return "delisted";
  return "pending_intake";
}

export function getOrgNodePath(
  orgNodeId: number | null | undefined,
  nodes: IOrgNode[],
): string {
  if (!orgNodeId) return "";
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const parts: string[] = [];
  let current = byId.get(orgNodeId);
  while (current) {
    parts.unshift(current.name);
    current =
      current.parent_id != null ? byId.get(current.parent_id) : undefined;
  }
  return parts.join(" › ");
}

export function filterApplicationsByRejected(
  apps: TDashboardApplication[],
  filter: TDashboardRejectedFilter,
): TDashboardApplication[] {
  if (filter === "excl_rejected") {
    return apps.filter((a) => !a.is_rejected);
  }
  if (filter === "only_rejected") {
    return apps.filter((a) => a.is_rejected);
  }
  return apps;
}

export function formatDashboardPct(count: number, total: number): string {
  if (total <= 0) return "0.0%";
  return `${((count / total) * 100).toFixed(1)}%`;
}

export function formatDashboardNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function isMaybeOrAbove(rec: string | null | undefined): boolean {
  return rec != null && MAYBE_OR_ABOVE.has(rec);
}

function normalizeRejectReason(
  reason: string | null | undefined,
): (typeof REJECT_STACK_KEYS)[number] {
  if (!reason) return "other";
  if ((REJECT_STACK_KEYS as readonly string[]).includes(reason)) {
    return reason as (typeof REJECT_STACK_KEYS)[number];
  }
  return "other";
}

export function computeKpiMetrics(
  apps: TDashboardApplication[],
  jobs: TJobLight[],
): TDashboardKpiMetrics {
  const openJobs = jobs.filter(
    (j) => getJobLifecycleStatus(j) === "published",
  ).length;
  const pendingIntake = jobs.filter(
    (j) => getJobLifecycleStatus(j) === "pending_intake",
  ).length;

  const applications = apps.length;
  const responded = apps.filter((a) => a.ai_screening_responded).length;
  const neverStarted = applications - responded;
  const completed = apps.filter((a) => a.ai_screening_completed).length;
  const inProgress = responded - completed;
  const completedApps = apps.filter((a) => a.ai_screening_completed);
  const maybePlusCount = completedApps.filter((a) =>
    isMaybeOrAbove(a.interview_recommendation),
  ).length;
  const rejected = apps.filter((a) => a.is_rejected).length;

  const evalStack = {
    absolutely: 0,
    yes: 0,
    yes_but: 0,
    maybe: 0,
    no: 0,
  };
  for (const app of completedApps) {
    const key = (app.interview_recommendation ||
      "no") as keyof typeof evalStack;
    if (key in evalStack) evalStack[key] += 1;
  }

  const rejectStack = {
    not_shortlisted: 0,
    did_not_pass_interview: 0,
    headcount_freeze: 0,
    candidate_withdrew: 0,
    other: 0,
  };
  for (const app of apps.filter((a) => a.is_rejected)) {
    rejectStack[normalizeRejectReason(app.reject_reason_type)] += 1;
  }

  return {
    openJobs,
    pendingIntake,
    applications,
    responded,
    neverStarted,
    completed,
    inProgress,
    maybePlusCount,
    maybePlusPct: completed > 0 ? (maybePlusCount / completed) * 100 : 0,
    rejected,
    evalStack,
    rejectStack,
  };
}

function toSgt(appliedAt: string): Dayjs {
  return dayjs(appliedAt).tz(SGT);
}

function startOfWeekSunday(d: Dayjs): Dayjs {
  return d.subtract(d.day(), "day").startOf("day");
}

function formatDailyLabel(d: Dayjs): string {
  return d.format("D MMM");
}

function formatWeeklyLabel(start: Dayjs, end: Dayjs): string {
  return `${start.format("D MMM")} - ${end.format("D MMM")}`;
}

function formatMonthlyLabel(d: Dayjs): string {
  return d.format("MMM YYYY");
}

function emptyTrendCounts(): Record<TTrendSeriesKey, number> {
  return {
    applications: 0,
    responded: 0,
    never_started: 0,
    completed: 0,
    in_progress: 0,
    maybe_plus: 0,
  };
}

function bucketMeta(
  d: Dayjs,
  granularity: TTrendGranularity,
): { key: string; label: string; sort: number } {
  if (granularity === "daily") {
    const start = d.startOf("day");
    return {
      key: start.format("YYYY-MM-DD"),
      label: formatDailyLabel(start),
      sort: start.valueOf(),
    };
  }
  if (granularity === "weekly") {
    const start = startOfWeekSunday(d);
    const end = start.add(6, "day");
    return {
      key: start.format("YYYY-MM-DD"),
      label: formatWeeklyLabel(start, end),
      sort: start.valueOf(),
    };
  }
  const start = d.startOf("month");
  return {
    key: start.format("YYYY-MM"),
    label: formatMonthlyLabel(start),
    sort: start.valueOf(),
  };
}

function resolveTrendRange(
  preset: TDashboardDatePreset,
  rangeApps: TDashboardApplication[],
): { start: Dayjs; end: Dayjs } | null {
  const end = dayjs().tz(SGT).startOf("day");
  const opt = DATE_PRESET_OPTIONS.find((o) => o.key === preset)!;
  if (opt.sincePosted) {
    if (rangeApps.length === 0) return null;
    let start = toSgt(rangeApps[0].applied_at).startOf("day");
    for (const app of rangeApps) {
      const d = toSgt(app.applied_at).startOf("day");
      if (d.isBefore(start)) start = d;
    }
    return { start, end };
  }
  const days = opt.days ?? 30;
  return { start: end.subtract(days - 1, "day"), end };
}

function enumerateTrendBuckets(
  rangeStart: Dayjs,
  rangeEnd: Dayjs,
  granularity: TTrendGranularity,
): { key: string; label: string; sort: number }[] {
  const buckets: { key: string; label: string; sort: number }[] = [];
  if (granularity === "daily") {
    let cur = rangeStart.startOf("day");
    const end = rangeEnd.startOf("day");
    while (cur.valueOf() <= end.valueOf()) {
      buckets.push(bucketMeta(cur, granularity));
      cur = cur.add(1, "day");
    }
    return buckets;
  }
  if (granularity === "weekly") {
    let cur = startOfWeekSunday(rangeStart);
    const last = startOfWeekSunday(rangeEnd);
    while (cur.valueOf() <= last.valueOf()) {
      buckets.push(bucketMeta(cur, granularity));
      cur = cur.add(7, "day");
    }
    return buckets;
  }
  let cur = rangeStart.startOf("month");
  const last = rangeEnd.startOf("month");
  while (cur.valueOf() <= last.valueOf()) {
    buckets.push(bucketMeta(cur, granularity));
    cur = cur.add(1, "month");
  }
  return buckets;
}

function metricValue(
  app: TDashboardApplication,
  series: TTrendSeriesKey,
): number {
  switch (series) {
    case "applications":
      return 1;
    case "responded":
      return app.ai_screening_responded ? 1 : 0;
    case "never_started":
      return app.ai_screening_responded ? 0 : 1;
    case "completed":
      return app.ai_screening_completed ? 1 : 0;
    case "in_progress":
      return app.ai_screening_responded && !app.ai_screening_completed ? 1 : 0;
    case "maybe_plus":
      return app.ai_screening_completed &&
        isMaybeOrAbove(app.interview_recommendation)
        ? 1
        : 0;
    default:
      return 0;
  }
}

export function buildTrendChartData(
  apps: TDashboardApplication[],
  granularity: TTrendGranularity,
  enabledSeries: Set<TTrendSeriesKey>,
  datePreset: TDashboardDatePreset,
  rangeApps: TDashboardApplication[] = apps,
): TTrendPoint[] {
  const range = resolveTrendRange(datePreset, rangeApps);
  if (!range) return [];

  const bucketMap = new Map<
    string,
    { label: string; sort: number; counts: Record<TTrendSeriesKey, number> }
  >();

  for (const meta of enumerateTrendBuckets(
    range.start,
    range.end,
    granularity,
  )) {
    bucketMap.set(meta.key, {
      label: meta.label,
      sort: meta.sort,
      counts: emptyTrendCounts(),
    });
  }

  for (const app of apps) {
    const meta = bucketMeta(toSgt(app.applied_at), granularity);
    let bucket = bucketMap.get(meta.key);
    if (!bucket) {
      bucket = {
        label: meta.label,
        sort: meta.sort,
        counts: emptyTrendCounts(),
      };
      bucketMap.set(meta.key, bucket);
    }
    for (const s of TREND_SERIES) {
      bucket.counts[s.key] += metricValue(app, s.key);
    }
  }

  const sortedBuckets = [...bucketMap.entries()].sort(
    (a, b) => a[1].sort - b[1].sort,
  );
  const points: TTrendPoint[] = [];
  for (const [bucketKey, bucket] of sortedBuckets) {
    for (const s of TREND_SERIES) {
      if (!enabledSeries.has(s.key)) continue;
      points.push({
        bucketKey,
        bucketLabel: bucket.label,
        series: s.label,
        value: bucket.counts[s.key],
      });
    }
  }
  return points;
}

function aggregateAppsToPivot(
  apps: TDashboardApplication[],
): Omit<
  TDashboardPivotRow,
  | "key"
  | "name"
  | "pathTooltip"
  | "secondary"
  | "openJobs"
  | "lastPostedAt"
  | "jobId"
  | "invitationToken"
> {
  const applications = apps.length;
  const responded = apps.filter((a) => a.ai_screening_responded).length;
  const completed = apps.filter((a) => a.ai_screening_completed).length;
  const completedApps = apps.filter((a) => a.ai_screening_completed);
  const maybePlus = completedApps.filter((a) =>
    isMaybeOrAbove(a.interview_recommendation),
  ).length;
  const active = apps.filter((a) => !a.is_rejected).length;
  const rejected = apps.filter((a) => a.is_rejected).length;
  return { applications, responded, completed, maybePlus, active, rejected };
}

export function computeTeamPivotRows(
  apps: TDashboardApplication[],
  jobs: TJobLight[],
  orgNodes: IOrgNode[],
  selectedOrgNodeIds: number[] | null,
): TDashboardPivotRow[] {
  const publishedJobs = jobs.filter(
    (j) => getJobLifecycleStatus(j) === "published",
  );
  const jobsByOrg = new Map<number, TJobLight[]>();
  for (const job of publishedJobs) {
    if (!job.org_node_id) continue;
    if (!jobsByOrg.has(job.org_node_id)) jobsByOrg.set(job.org_node_id, []);
    jobsByOrg.get(job.org_node_id)!.push(job);
  }

  let teamIds = [...jobsByOrg.keys()];
  if (selectedOrgNodeIds?.length) {
    const allowed = new Set(selectedOrgNodeIds);
    teamIds = teamIds.filter((id) => allowed.has(id));
  }

  const appsByJob = new Map<number, TDashboardApplication[]>();
  for (const app of apps) {
    if (!appsByJob.has(app.job_id)) appsByJob.set(app.job_id, []);
    appsByJob.get(app.job_id)!.push(app);
  }

  return teamIds.map((orgNodeId) => {
    const teamJobs = jobsByOrg.get(orgNodeId) ?? [];
    const teamApps = teamJobs.flatMap((j) => appsByJob.get(j.id) ?? []);
    const agg = aggregateAppsToPivot(teamApps);
    const lastPosted =
      teamJobs
        .map((j) => j.posted_at)
        .filter(Boolean)
        .sort()
        .reverse()[0] ?? null;
    const node = orgNodes.find((n) => n.id === orgNodeId);
    return {
      key: String(orgNodeId),
      name: node?.name ?? String(orgNodeId),
      pathTooltip: getOrgNodePath(orgNodeId, orgNodes),
      openJobs: teamJobs.length,
      lastPostedAt: lastPosted,
      ...agg,
    };
  });
}

export function computeJobPivotRows(
  apps: TDashboardApplication[],
  jobs: TJobLight[],
  orgNodes: IOrgNode[],
  options?: { orgNodeId?: number; limit?: number },
): TDashboardPivotRow[] {
  let publishedJobs = jobs.filter(
    (j) => getJobLifecycleStatus(j) === "published",
  );
  if (options?.orgNodeId != null) {
    publishedJobs = publishedJobs.filter(
      (j) => j.org_node_id === options.orgNodeId,
    );
  }
  publishedJobs = [...publishedJobs].sort((a, b) => {
    const ta = a.posted_at ? dayjs(a.posted_at).valueOf() : 0;
    const tb = b.posted_at ? dayjs(b.posted_at).valueOf() : 0;
    return tb - ta;
  });
  if (options?.limit) {
    publishedJobs = publishedJobs.slice(0, options.limit);
  }

  const appsByJob = new Map<number, TDashboardApplication[]>();
  for (const app of apps) {
    if (!appsByJob.has(app.job_id)) appsByJob.set(app.job_id, []);
    appsByJob.get(app.job_id)!.push(app);
  }

  return publishedJobs.map((job) => {
    const jobApps = appsByJob.get(job.id) ?? [];
    const agg = aggregateAppsToPivot(jobApps);
    return {
      key: String(job.id),
      name: job.name,
      secondary: job.org_node_id
        ? orgNodes.find((n) => n.id === job.org_node_id)?.name
        : undefined,
      jobId: job.id,
      invitationToken: job.invitation_token,
      lastPostedAt: job.posted_at ?? null,
      ...agg,
    };
  });
}

export function daysOpen(postedAt: string | null): number | null {
  if (!postedAt) return null;
  return Math.max(
    0,
    dayjs()
      .tz(SGT)
      .startOf("day")
      .diff(dayjs(postedAt).tz(SGT).startOf("day"), "day"),
  );
}

export function formatPostedDate(postedAt: string | null): string {
  if (!postedAt) return "—";
  return dayjs(postedAt).tz(SGT).format("MMM D, YYYY");
}

export function buildDashboardQueryParams(
  preset: TDashboardDatePreset,
): Record<string, string | number> {
  const opt = DATE_PRESET_OPTIONS.find((o) => o.key === preset)!;
  if (opt.sincePosted) return { since_posted: 1 };
  return { days: opt.days ?? 30 };
}

export type TPipelineStageDef = {
  id: string;
  name: string;
};

export type TPipelineDistributionRow = {
  key: string;
  stageName: string;
  isActiveRow: boolean;
  count: number;
  pctOfActive: number;
  medianDays: number | null;
  p90Days: number | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function percentile(sortedAsc: number[], p: number): number | null {
  if (sortedAsc.length === 0) return null;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const idx = (sortedAsc.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
}

/** Pipeline Distribution: Active = not rejected; ignores Candidate scope. */
export function computePipelineDistribution(
  apps: TDashboardApplication[],
  stages: TPipelineStageDef[],
  nowMs: number = Date.now(),
): TPipelineDistributionRow[] {
  const activeApps = apps.filter((app) => !app.is_rejected);
  const activeCount = activeApps.length;

  const rows: TPipelineDistributionRow[] = [
    {
      key: "__active__",
      stageName: "(Active Applications)",
      isActiveRow: true,
      count: activeCount,
      pctOfActive: 100,
      medianDays: null,
      p90Days: null,
    },
  ];

  for (const stage of stages) {
    const inStage = activeApps.filter(
      (app) => app.current_stage_key === stage.id,
    );
    const days = inStage
      .map((app) => {
        const entered = new Date(app.stage_entered_at).getTime();
        if (Number.isNaN(entered)) return null;
        return (nowMs - entered) / MS_PER_DAY;
      })
      .filter((d): d is number => d != null && d >= 0)
      .sort((a, b) => a - b);

    rows.push({
      key: stage.id,
      stageName: stage.name,
      isActiveRow: false,
      count: inStage.length,
      pctOfActive: activeCount > 0 ? (inStage.length / activeCount) * 100 : 0,
      medianDays: percentile(days, 0.5),
      p90Days: percentile(days, 0.9),
    });
  }

  return rows;
}

export function formatPipelineDays(value: number | null): string {
  if (value == null) return "--";
  return value.toFixed(1);
}
