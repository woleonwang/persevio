export const SOURCING_CHANNEL_OPTIONS = [
  { value: "persevio", label: "Persevio" },
  { value: "direc", label: "Direc" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "jobstreet", label: "JobStreet" },
  { value: "mycareersfuture", label: "MyCareersFuture" },
];

export type TExtractBasicInfo = {
  years_of_experience: string;
  current_compensation: string;
  visa: string;
  work_experiences: { company_name: string; job_title: string }[];
};

export type TExtractEvaluateResult = {
  overall_recommendation?: { result: string; caveat?: string };
  result?: string;
  thumbnail_summary?: string;
  summary?: string;
};

export type TTalentListItem = TTalent & {
  basicInfo: TExtractBasicInfo;
  parsedEvaluateResult: TExtractEvaluateResult;
  job_apply: { interview_finished_at?: string };
  interviews: { scheduled_at?: string }[];
  stageKey?: string;
};

export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const getStageKey = (talent: TTalentListItem): string => {
  const key = talent.stageKey;
  if (!key) {
    if (talent.job_apply?.interview_finished_at) {
      return "ai_interview_completed";
    }
    if (talent.interviews?.length > 0) {
      return "started_ai_interview";
    }
    return "applied";
  }
  return key;
};
