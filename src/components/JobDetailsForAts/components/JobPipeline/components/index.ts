import { TTalentListItem } from "./types";

export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const getStageKey = (talent: TTalentListItem): string => {
  const key = talent.stage_id;
  if (!key) {
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
export { type TTalentListItem } from "./types";
