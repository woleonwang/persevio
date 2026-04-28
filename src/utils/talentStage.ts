import { DEFAULT_STAGE_KEYS } from "@/utils/consts";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type TalentStageInfo = {
  status?: string;
  stage_id?: string;
  stage_updated_at?: string;
  created_at?: string;
  feedback_updated_at?: string;
  evaluate_status?: "pending" | "generating" | "ready" | "failed";
  evaluate_type?: "resume_based" | "post_interview";
  job_apply?: { interview_finished_at?: string; interview_started_at?: string };
  interviews?: { created_at?: string }[];
};

export function isInterviewCompleted(talent: TalentStageInfo): boolean {
  return (
    !!talent.job_apply?.interview_finished_at &&
    talent.evaluate_type === "post_interview" &&
    talent.evaluate_status === "ready"
  );
}

/** 与 JobAnalytics 一致：当前阶段进入时间（时间戳），用于计算 days in stage */
export function getStageEntryTime(
  stageId: string,
  talent: TalentStageInfo,
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
      return isInterviewCompleted(talent)
        ? new Date(talent.job_apply?.interview_finished_at ?? "").getTime()
        : null;
    case "shortlisted":
      return talent.interviews?.[0]?.created_at
        ? new Date(talent.interviews[0].created_at).getTime()
        : null;
    case "rejected":
      return talent.feedback_updated_at
        ? new Date(talent.feedback_updated_at).getTime()
        : null;
    default:
      return null;
  }
}

/** 与 JobAnalytics 一致：候选人在当前阶段的天数，无法计算时返回 null */
export function getDaysInStage(talent: TalentStageInfo): number | null {
  const stageKey = getStageKey(talent);
  const entry = getStageEntryTime(stageKey, talent);
  if (entry == null) return null;
  return (Date.now() - entry) / MS_PER_DAY;
}

export function getStageKey(talent: TalentStageInfo): string {
  // 优先级最高：status / stage_id 为 rejected 时，一律归入 rejected
  if (talent.status === "rejected" || talent.stage_id === "rejected") {
    return "rejected";
  }

  const key = talent.stage_id;
  if (!key) {
    // 无显式 stage 时，根据面试安排自动归类
    const hasScheduledInterview =
      Array.isArray(talent.interviews) && talent.interviews.length > 0;
    if (hasScheduledInterview) {
      return "shortlisted";
    }

    if (isInterviewCompleted(talent)) {
      return "ai_interview_completed";
    }
    if (talent.job_apply?.interview_started_at) {
      return "started_ai_interview";
    }
    return "applied";
  }
  return key;
}
