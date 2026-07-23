export type TMeetingPrepared = {
  thin_profile?: boolean;
  why_interested?: string[];
  why_successful?: string[];
  couldnt_tell?: string[];
};

export type TMeetingBootstrap = {
  redirect_to_prescreening?: boolean;
  candidate_token?: string;
  job_apply_id?: number;
  linkedin_profile: {
    id: number;
    name: string;
    candidate_id: number;
    resume_path: string;
    identity_gated_at?: string;
    put_forward_at?: string;
    whatsapp_contact_number?: string;
  };
  job: {
    id: number;
    name: string;
    company_id: number;
    company_name: string;
    posted_at?: string;
  };
  brief?: string;
  prepared?: string;
  privacy_zone?: string;
};

export type TMeetingMessage = TMessageFromApi;

export type TBriefFact = {
  label: string;
  value: string;
};

export type TBriefSnapshot = {
  title?: string;
  facts?: TBriefFact[];
};

export type TBriefTextSection = {
  title?: string;
  body?: string;
};

export type TBriefRoleSection = TBriefTextSection & {
  one_liner?: string;
};

export type TBrief = {
  role_snapshot?: TBriefSnapshot;
  company?: TBriefTextSection;
  role?: TBriefRoleSection;
  responsibilities?: TBriefTextSection;
  candidate_fit?: TBriefTextSection;
  compensation?: TBriefTextSection;
  process?: TBriefTextSection;
  worth_knowing?: TBriefTextSection;
  meta?: Record<string, unknown>;
};

export type TBriefSheetSection = {
  number: string;
  title: string;
  body?: string;
  bullets?: string[];
};

const BRIEF_SHEET_SECTION_KEYS = [
  "company",
  "role",
  "responsibilities",
  "candidate_fit",
  "compensation",
  "process",
  "worth_knowing",
] as const;

const SNAPSHOT_CHIP_SKIP_LABELS = new Set(["role", "company"]);

export const parsePrepared = (raw?: string): TMeetingPrepared | null => {
  if (!raw?.trim()) {
    return null;
  }
  try {
    return JSON.parse(raw) as TMeetingPrepared;
  } catch {
    return null;
  }
};

export const parseBrief = (raw?: string): TBrief | null => {
  if (!raw?.trim()) {
    return null;
  }
  try {
    return JSON.parse(raw) as TBrief;
  } catch {
    return null;
  }
};

export const getRoleOneLiner = (brief?: TBrief | null) =>
  brief?.role?.one_liner?.trim() || "";

export const getSnapshotFactValue = (
  brief: TBrief | null | undefined,
  label: string,
) => {
  const target = label.trim().toLowerCase();
  return (
    brief?.role_snapshot?.facts?.find(
      (fact) => fact.label.trim().toLowerCase() === target,
    )?.value?.trim() || ""
  );
};

export const getSnapshotFactChips = (brief?: TBrief | null) => {
  const facts = brief?.role_snapshot?.facts || [];
  return facts
    .filter((fact) => !SNAPSHOT_CHIP_SKIP_LABELS.has(fact.label.trim().toLowerCase()))
    .map((fact) => fact.value.trim())
    .filter(Boolean)
    .slice(0, 4);
};

export const getBriefSheetSections = (brief: TBrief): TBriefSheetSection[] => {
  const sections: TBriefSheetSection[] = [];
  let index = 1;

  if (brief.role_snapshot?.facts?.length) {
    sections.push({
      number: String(index),
      title: brief.role_snapshot.title?.trim() || "At a glance",
      bullets: brief.role_snapshot.facts.map(
        (fact) => `${fact.label}: ${fact.value}`,
      ),
    });
    index += 1;
  }

  BRIEF_SHEET_SECTION_KEYS.forEach((key) => {
    const section = brief[key];
    if (!section) {
      return;
    }
    const title = section.title?.trim();
    const body = section.body?.trim();
    if (!title && !body) {
      return;
    }
    sections.push({
      number: String(index),
      title: title || key.replace(/_/g, " "),
      body,
    });
    index += 1;
  });

  return sections;
};

export const firstNameOf = (name?: string) => {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return "there";
  }
  return trimmed.split(/\s+/)[0];
};

export const logoMarkOf = (name?: string) => {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return "•";
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
};


export const getMessageActionTags = (message: TMeetingMessage) => {
  const tags = message.content?.metadata?.extra_tags || [];
  return tags
    .map((tag) => tag.name)
    .filter((name) => name === "open_put_forward");
};

export const isSystemActionMessage = (message: TMeetingMessage) => {
  return (
    message.content?.metadata?.message_type === "system" &&
    getMessageActionTags(message).length > 0
  );
};

export const isVisibleChatMessage = (message: TMeetingMessage) => {
  if (isSystemActionMessage(message)) {
    return true;
  }
  if (message.content?.metadata?.message_type === "system") {
    return false;
  }
  return !!message.content?.content?.trim();
};
