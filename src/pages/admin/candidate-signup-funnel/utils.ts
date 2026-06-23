import {
  DEFAULT_TRACKING_SOURCES,
  getSourcingChannel,
} from "@/utils";

export type TSatisfactionRating = {
  overall_experience: string;
  understanding_accuracy: string;
  question_relevance: string;
  improvement_suggestion?: string | null;
};

export type TEventTrack = {
  id: number;
  user_id?: number | null;
  company_id?: number | null;
  job_id?: number | null;
  job_apply_id?: number | null;
  event_name: string;
  session_id: string;
  user_agent?: string;
  extra_params: string;
  created_at: string;
  satisfaction_rating?: TSatisfactionRating | null;
};

export const FUNNEL_STEPS = [
  { key: "job_apply_page_view", label: "Job Page Viewed" },
  { key: "enter_apply_flow", label: "Enter Apply Flow" },
  { key: "personal_info_filled", label: "Contact Info Submitted" },
  { key: "resume_uploaded", label: "Resume Submitted" },
  { key: "registration_completed", label: "Registration Completed" },
  { key: "assessment_viewed", label: "Assessment Viewed" },
  { key: "conversation_started", label: "Conversation Started" },
  { key: "conversation_completed", label: "Conversation Completed" },
  { key: "wrap_up_viewed", label: "Wrap-Up Viewed" },
] as const;

export type TFunnelStepKey = (typeof FUNNEL_STEPS)[number]["key"];

/** Step 3（Contact Info）及之后用 cohort 统计 */
export const COHORT_START_INDEX = 2;

export const FUNNEL_SOURCE_OTHERS = "others";

export const FUNNEL_BUILTIN_SOURCES: readonly string[] =
  DEFAULT_TRACKING_SOURCES;

export type TDeviceType = "mobile" | "tablet" | "desktop";

export type TFunnelFilters = {
  since: string;
  until: string;
  source?: string;
  jobId?: number;
  device?: TDeviceType;
};

export const DEVICE_OPTIONS: Array<{ value: TDeviceType; label: string }> = [
  { value: "mobile", label: "Mobile" },
  { value: "tablet", label: "Tablet" },
  { value: "desktop", label: "Desktop" },
];

export const parseExtraParams = (raw: string): Record<string, unknown> => {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
};

export const normalizeEventTrafficSource = (track: TEventTrack): string => {
  const extra = parseExtraParams(track.extra_params);
  const raw = extra.traffic_source;
  return getSourcingChannel(typeof raw === "string" ? raw : "");
};

export const matchesSourceFilter = (
  normalizedSource: string,
  filter?: string,
): boolean => {
  if (!filter) {
    return true;
  }
  if (filter === FUNNEL_SOURCE_OTHERS) {
    return !FUNNEL_BUILTIN_SOURCES.includes(normalizedSource);
  }
  return normalizedSource === filter;
};

export const parseDeviceFromUserAgent = (userAgent: string): TDeviceType => {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) {
    return "tablet";
  }
  if (/android/.test(ua) && !/mobile/.test(ua)) {
    return "tablet";
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)) {
    return "mobile";
  }
  return "desktop";
};

export const inTimeRange = (
  createdAt: string,
  since: string,
  until: string,
): boolean => {
  const day = createdAt.slice(0, 10);
  return day >= since && day <= until;
};

export const matchesEventFilters = (
  track: TEventTrack,
  filters: TFunnelFilters,
  options?: { requireUserId?: boolean },
): boolean => {
  if (options?.requireUserId && !track.user_id) {
    return false;
  }
  if (!inTimeRange(track.created_at, filters.since, filters.until)) {
    return false;
  }
  if (filters.jobId) {
    if (!track.job_id || track.job_id !== filters.jobId) {
      return false;
    }
  }
  if (
    !matchesSourceFilter(normalizeEventTrafficSource(track), filters.source)
  ) {
    return false;
  }
  if (filters.device) {
    const device = parseDeviceFromUserAgent(track.user_agent || "");
    if (device !== filters.device) {
      return false;
    }
  }
  return true;
};

export const matchesContactInfoFilters = (
  track: TEventTrack,
  filters: TFunnelFilters,
): boolean => matchesEventFilters(track, filters, { requireUserId: true });

export const matchesPreFunnelFilters = (
  track: TEventTrack,
  filters: TFunnelFilters,
): boolean => matchesEventFilters(track, filters);

export const getEventUniqueKey = (track: TEventTrack): string => {
  if (track.user_id) {
    return `user:${track.user_id}`;
  }
  if (track.session_id) {
    return `session:${track.session_id}:job:${track.job_id ?? 0}`;
  }
  return `id:${track.id}`;
};

export const filterEvents = (
  tracks: TEventTrack[],
  eventName: string,
): TEventTrack[] => tracks.filter((track) => track.event_name === eventName);

export const countPreFunnelEvents = (
  tracks: TEventTrack[],
  eventName: string,
  filters: TFunnelFilters,
): number => {
  const keys = new Set<string>();
  for (const track of filterEvents(tracks, eventName)) {
    if (!matchesPreFunnelFilters(track, filters)) {
      continue;
    }
    keys.add(getEventUniqueKey(track));
  }
  return keys.size;
};

export const buildCohortPool = (
  tracks: TEventTrack[],
  filters: TFunnelFilters,
): Set<number> => {
  const pool = new Set<number>();
  for (const track of filterEvents(tracks, "personal_info_filled")) {
    if (!matchesContactInfoFilters(track, filters)) {
      continue;
    }
    pool.add(track.user_id!);
  }
  return pool;
};

export const getCohortUsersWithEvent = (
  tracks: TEventTrack[],
  pool: Set<number>,
  eventName: string,
): Set<number> => {
  const users = new Set<number>();
  for (const track of filterEvents(tracks, eventName)) {
    if (track.user_id && pool.has(track.user_id)) {
      users.add(track.user_id);
    }
  }
  return users;
};

export const countCohortUsersWithEvent = (
  tracks: TEventTrack[],
  pool: Set<number>,
  eventName: string,
): number => getCohortUsersWithEvent(tracks, pool, eventName).size;

export const isCohortStepKey = (key: TFunnelStepKey): boolean => {
  const index = FUNNEL_STEPS.findIndex((step) => step.key === key);
  return index >= COHORT_START_INDEX;
};

export const formatPercent = (numerator: number, denominator: number): string => {
  if (denominator <= 0) {
    return "—";
  }
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
};

export type TBreakdownRow = {
  key: string;
  label: string;
  count: number;
  share: string;
  conversionToNext?: string;
};

export const breakdownByExtraParam = (
  tracks: TEventTrack[],
  eventName: string,
  paramKey: string,
  nextEventName?: string,
  pool?: Set<number>,
  filters?: TFunnelFilters,
): TBreakdownRow[] => {
  if (pool) {
    const buckets = new Map<string, Set<number>>();

    for (const track of filterEvents(tracks, eventName)) {
      if (!track.user_id || !pool.has(track.user_id)) {
        continue;
      }
      const extra = parseExtraParams(track.extra_params);
      const raw = extra[paramKey];
      const label =
        raw === undefined || raw === null || raw === ""
          ? "(empty)"
          : String(raw);
      if (!buckets.has(label)) {
        buckets.set(label, new Set());
      }
      buckets.get(label)!.add(track.user_id);
    }

    const total = countCohortUsersWithEvent(tracks, pool, eventName);
    const nextUserIds = nextEventName
      ? getCohortUsersWithEvent(tracks, pool, nextEventName)
      : undefined;

    return [...buckets.entries()]
      .map(([label, userIds]) => {
        let conversionToNext: string | undefined;
        if (nextUserIds) {
          let converted = 0;
          for (const userId of userIds) {
            if (nextUserIds.has(userId)) {
              converted += 1;
            }
          }
          conversionToNext = formatPercent(converted, userIds.size);
        }
        return {
          key: label,
          label,
          count: userIds.size,
          share: formatPercent(userIds.size, total),
          conversionToNext,
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  const buckets = new Map<string, Set<string>>();

  for (const track of filterEvents(tracks, eventName)) {
    if (filters && !matchesPreFunnelFilters(track, filters)) {
      continue;
    }
    const uniqueKey = getEventUniqueKey(track);
    const extra = parseExtraParams(track.extra_params);
    const raw = extra[paramKey];
    const label =
      raw === undefined || raw === null || raw === ""
        ? "(empty)"
        : String(raw);
    if (!buckets.has(label)) {
      buckets.set(label, new Set());
    }
    buckets.get(label)!.add(uniqueKey);
  }

  const total = [...buckets.values()].reduce((sum, keys) => sum + keys.size, 0);
  const nextKeys = nextEventName
    ? new Set(
        filterEvents(tracks, nextEventName)
          .filter(
            (track) => !filters || matchesPreFunnelFilters(track, filters),
          )
          .map((track) => getEventUniqueKey(track)),
      )
    : undefined;

  return [...buckets.entries()]
    .map(([label, keys]) => {
      let conversionToNext: string | undefined;
      if (nextKeys) {
        let converted = 0;
        for (const key of keys) {
          if (nextKeys.has(key)) {
            converted += 1;
          }
        }
        conversionToNext = formatPercent(converted, keys.size);
      }
      return {
        key: label,
        label,
        count: keys.size,
        share: formatPercent(keys.size, total),
        conversionToNext,
      };
    })
    .sort((a, b) => b.count - a.count);
};

export const percentile = (values: number[], p: number): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return Math.round(sorted[index]);
};

export const numericExtraParamStats = (
  tracks: TEventTrack[],
  eventName: string,
  paramKey: string,
  pool?: Set<number>,
  filters?: TFunnelFilters,
) => {
  const values: number[] = [];
  for (const track of filterEvents(tracks, eventName)) {
    if (pool) {
      if (!track.user_id || !pool.has(track.user_id)) {
        continue;
      }
    } else if (filters && !matchesPreFunnelFilters(track, filters)) {
      continue;
    }
    const extra = parseExtraParams(track.extra_params);
    const raw = extra[paramKey];
    if (typeof raw === "number" && Number.isFinite(raw)) {
      values.push(raw);
    } else if (typeof raw === "string" && raw.trim() !== "") {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        values.push(parsed);
      }
    }
  }
  return {
    count: values.length,
    p50: percentile(values, 50),
    p75: percentile(values, 75),
    p90: percentile(values, 90),
  };
};

export type TFunnelStepRow = {
  key: TFunnelStepKey;
  label: string;
  count: number;
  stepConversion: string;
  barPercent: number;
};

export const buildFunnelRows = (
  tracks: TEventTrack[],
  filters: TFunnelFilters,
): TFunnelStepRow[] => {
  const pool = buildCohortPool(tracks, filters);
  const counts = FUNNEL_STEPS.map((step, index) => {
    let count: number;
    if (index < COHORT_START_INDEX) {
      count = countPreFunnelEvents(tracks, step.key, filters);
    } else if (step.key === "personal_info_filled") {
      count = pool.size;
    } else {
      count = countCohortUsersWithEvent(tracks, pool, step.key);
    }
    return { ...step, count };
  });

  const baseCount = counts[0]?.count || 1;

  return counts.map((step, index) => {
    const prevCount = index > 0 ? counts[index - 1].count : step.count;
    return {
      key: step.key,
      label: step.label,
      count: step.count,
      stepConversion: index === 0 ? "—" : formatPercent(step.count, prevCount),
      barPercent: Math.min(100, Math.round((step.count / baseCount) * 100)),
    };
  });
};

export const REGISTRATION_STEP3_DIAGNOSTIC_EVENTS = [
  { eventName: "registration_google_clicked", label: "Google clicked" },
  { eventName: "registration_linkedin_clicked", label: "LinkedIn clicked" },
  { eventName: "registration_otp_clicked", label: "Email OTP clicked" },
  { eventName: "auth_oauth_failed", label: "OAuth failed / cancelled" },
  { eventName: "auth_otp_failed", label: "OTP verify failed" },
] as const;

export type TRegistrationDiagnosticCountRow = {
  key: string;
  label: string;
  count: number;
};

export const countRawRegistrationDiagnosticEvents = (
  tracks: TEventTrack[],
  eventName: string,
  pool: Set<number>,
  filters: TFunnelFilters,
): number => {
  let count = 0;
  for (const track of filterEvents(tracks, eventName)) {
    if (!track.user_id || !pool.has(track.user_id)) {
      continue;
    }
    if (!matchesEventFilters(track, filters, { requireUserId: true })) {
      continue;
    }
    count += 1;
  }
  return count;
};

export const buildRegistrationDiagnosticCounts = (
  tracks: TEventTrack[],
  pool: Set<number>,
  filters: TFunnelFilters,
): TRegistrationDiagnosticCountRow[] =>
  REGISTRATION_STEP3_DIAGNOSTIC_EVENTS.map(({ eventName, label }) => ({
    key: eventName,
    label,
    count: countRawRegistrationDiagnosticEvents(
      tracks,
      eventName,
      pool,
      filters,
    ),
  }));

export const collectJobIdsFromTracks = (tracks: TEventTrack[]): number[] => {
  const ids = new Set<number>();
  for (const track of tracks) {
    if (track.job_id) {
      ids.add(track.job_id);
    }
  }
  return [...ids].sort((a, b) => a - b);
};

export type TStepDetailConfig = {
  title: string;
  breakdowns?: Array<{
    title: string;
    paramKey: string;
    nextEventName?: string;
  }>;
  numericStats?: Array<{
    title: string;
    paramKey: string;
  }>;
};

export const STEP_DETAIL_CONFIG: Partial<Record<TFunnelStepKey, TStepDetailConfig>> = {
  job_apply_page_view: {
    title: "Pre-funnel",
    breakdowns: [{ title: "Traffic source", paramKey: "traffic_source" }],
  },
  enter_apply_flow: {
    title: "Enter apply flow",
    breakdowns: [{ title: "Traffic source", paramKey: "traffic_source" }],
  },
  personal_info_filled: {
    title: "Step 1 — Contact info",
    breakdowns: [
      {
        title: "Traffic source",
        paramKey: "traffic_source",
        nextEventName: "resume_uploaded",
      },
    ],
  },
  resume_uploaded: {
    title: "Step 2 — Resume",
    breakdowns: [
      {
        title: "File type",
        paramKey: "file_type",
        nextEventName: "registration_completed",
      },
    ],
  },
  registration_completed: {
    title: "Step 3 — Registration",
    breakdowns: [
      {
        title: "Registration method",
        paramKey: "registration_method",
        nextEventName: "assessment_viewed",
      },
    ],
  },
  assessment_viewed: {
    title: "Step 4 — Assessment",
    breakdowns: [
      {
        title: "Fit tier",
        paramKey: "fit_tier",
        nextEventName: "conversation_started",
      },
    ],
    numericStats: [
      {
        title: "Assessment generation time (ms)",
        paramKey: "assessment_generation_time_ms",
      },
    ],
  },
  conversation_started: {
    title: "Step 5 — Conversation started",
    breakdowns: [
      {
        title: "Channel",
        paramKey: "conversation_channel",
        nextEventName: "conversation_completed",
      },
    ],
  },
  conversation_completed: {
    title: "Step 5 — Conversation completed",
    breakdowns: [
      {
        title: "Channel",
        paramKey: "conversation_channel",
        nextEventName: "wrap_up_viewed",
      },
    ],
  },
  wrap_up_viewed: {
    title: "Step 6 — Wrap-up",
    breakdowns: [{ title: "Arrival source", paramKey: "arrival_source" }],
  },
};
