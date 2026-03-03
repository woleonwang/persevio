import { TTalentListItem } from "./types";

export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const getStageKey = (talent: TTalentListItem): string => {
  // 优先级最高：status / stage_id 为 rejected 时，一律归入 rejected
  if (talent.status === "rejected" || talent.stage_id === "rejected") {
    return "rejected";
  }

  const key = talent.stage_id;
  if (!key) {
    // 无显式 stage 时，根据面试安排自动归类
    const hasScheduledInterview =
      Array.isArray(talent.interviews) &&
      talent.interviews.some((i) => !!i.scheduled_at);
    if (hasScheduledInterview) {
      return "shortlisted";
    }

    if (talent.job_apply?.interview_finished_at) {
      return "ai_interview_completed";
    }
    if (talent.job_apply?.interview_started_at) {
      return "started_ai_interview";
    }
    return "applied";
  }
  return key;
};

export { default as DraggableCard } from "./DraggableCard";
export { default as DroppableColumn } from "./DroppableColumn";
export { default as ListModeCard } from "./ListModeCard";
export { type TTalentListItem } from "./types";
