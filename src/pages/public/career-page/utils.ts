import dayjs from "dayjs";
import { parseJSON } from "@/utils";

const CAREER_HOST_PATTERN =
  /^([a-z_-]+)\.careers(?:-dev)?\.persevio\.ai$/i;

const ROLE_TYPE_LABELS: Record<string, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export const CAREER_PAGE_SIZE = 10;

export const parseCareerSubdomain = (): string | null => {
  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const subdomain = new URLSearchParams(window.location.search).get(
      "subdomain",
    );
    return subdomain?.trim() || null;
  }

  const match = hostname.match(CAREER_HOST_PATTERN);
  return match ? match[1] : null;
};

export const getRoleTypeLabel = (roleType?: string): string => {
  if (!roleType) return "";
  return ROLE_TYPE_LABELS[roleType] ?? roleType;
};

export const getJobLocationLabel = (basicInfoRaw: string): string => {
  const basicInfo = (parseJSON(basicInfoRaw) ?? {}) as TJobBasicInfo;
  return (
    basicInfo.location?.map((item: { city: string }) => item.city).filter(Boolean).join(", ") ??
    ""
  );
};

export const getJobRoleTypeLabel = (basicInfoRaw: string): string => {
  const basicInfo = (parseJSON(basicInfoRaw) ?? {}) as TJobBasicInfo;
  return getRoleTypeLabel(basicInfo.role_type);
};

export const formatPostedTime = (postedAt?: string | null): string => {
  if (!postedAt) return "";

  const posted = dayjs(postedAt);
  const now = dayjs();
  const diffMinutes = now.diff(posted, "minute");
  const diffHours = now.diff(posted, "hour");
  const diffDays = now.diff(posted, "day");

  if (diffMinutes < 60) {
    return diffMinutes <= 1 ? "Posted today" : `Posted ${diffMinutes} minutes ago`;
  }
  if (diffHours < 24) {
    return diffHours === 1 ? "Posted 1 hour ago" : `Posted ${diffHours} hours ago`;
  }
  if (diffDays === 1) {
    return "Posted 1 day ago";
  }
  if (diffDays < 7) {
    return `Posted ${diffDays} days ago`;
  }
  return `Posted ${posted.format("YYYY-MM-DD")}`;
};

export const getJobChatbotUrl = (
  domain: string,
  candidateUuid: string,
  version: number,
): string => {
  const base = domain.startsWith("http") ? domain : `https://${domain}`;
  const versionPath = version === 0 ? "" : `/${version}`;
  return `${base.replace(/\/$/, "")}/jobs/${candidateUuid}/chat${versionPath}`;
};

export const getLoginUrl = (domain: string): string => {
  const base = domain.startsWith("http") ? domain : `https://${domain}`;
  return `${base.replace(/\/$/, "")}/candidate/signin`;
};

export const assetUrl = (filename: string): string =>
  `/career-page/${filename}`;
