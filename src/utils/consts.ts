export const SIDE_DOCUMENT_TYPES = [
  "realities-done",
  "responsibilities-done",
  "icp-done",
  "highlights-done",
  "role-essence-done",
  "cddreq-done",
  "cdd-profile-done",
  "sourcing-done",
  "summary-draft",
  "jd-draft",
];

export const PREFIX_DEFAULT_STAGE_KEYS = [
  "reached_out",
  "applied",
  "started_ai_interview",
  "ai_interview_completed",
];

export const SUFFIX_DEFAULT_STAGE_KEYS = ["rejected"];

export const DEFAULT_STAGE_KEYS = [
  ...PREFIX_DEFAULT_STAGE_KEYS,
  ...SUFFIX_DEFAULT_STAGE_KEYS,
];

export const TALENT_DETAIL_FROM = {
  local: "local",
  talents: "talents",
  pipeline: "pipeline",
} as const;

export type TTalentDetailFrom =
  (typeof TALENT_DETAIL_FROM)[keyof typeof TALENT_DETAIL_FROM];

export const SkillsFitKnownKeys: TSkillsFitKey[] = [
  "ideal",
  "good",
  "overqualified",
  "near_fit",
  "uncertain",
  "poor",
];
