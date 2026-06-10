import { ASSESS_CONTENT } from "./constants";

export const splitFullName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: parts[0] || "", lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

export const joinFullName = (firstName: string, lastName: string) => {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
};

export const isBriefReportRecommendation = (
  interviewRecommendation?: string,
) => {
  return interviewRecommendation === "maybe" || interviewRecommendation === "no";
};

export const getTierFromRecommendation = (
  interviewRecommendation?: string,
): TSignupV2Tier => {
  switch (interviewRecommendation) {
    case "absolutely":
    case "yes":
      return "strong";
    case "yes_but":
      return "middle";
    case "maybe":
      return "middle";
    case "no":
      return "weak";
    default:
      return "middle";
  }
};

export const parseInitialImpression = (
  json?: string,
): IInitialImpression | null => {
  if (!json?.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(json) as IInitialImpression;
    if (!parsed.summary) {
      return null;
    }
    return {
      summary: parsed.summary,
      what_stands_out: parsed.what_stands_out || [],
      areas_to_explore: parsed.areas_to_explore || [],
    };
  } catch {
    return null;
  }
};

export const getAssessmentDisplay = (
  impression: IInitialImpression | null,
  tier: TSignupV2Tier,
) => {
  const fallback = ASSESS_CONTENT[tier === "incomplete" ? "middle" : tier];
  if (!impression) {
    return fallback;
  }
  return {
    read: tier === "weak" ? null : fallback.read,
    summary: impression.summary,
    strengths: impression.what_stands_out.length
      ? impression.what_stands_out
      : [...fallback.strengths],
    discuss: impression.areas_to_explore.length
      ? impression.areas_to_explore
      : [...fallback.discuss],
    bridge: fallback.bridge,
  };
};

export const formatResumeFileName = (resumePath: string) => {
  const segments = resumePath.split("/");
  return segments[segments.length - 1] || "Resume.pdf";
};

export const formatFileSize = (bytes: number) => {
  if (bytes <= 0) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isValidPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8;
};
