/** Mentions sentinel ids — keep in sync with backend model/message.go */
export const MENTION_VIONA_ID = 0;
export const MENTION_OWNER_ID = -1;

export type TMentionRoleKey =
  | "you"
  | "owner"
  | "ai"
  | "hiring_manager"
  | "recruiter"
  | "guest";

export type TMentionOption = {
  id: number;
  name: string;
  email?: string;
  memberType?: "owner" | "ai" | "staff" | "guest";
  roleKey?: TMentionRoleKey;
  roleLabel?: string;
};

export function getActiveMemberships(
  memberships: TJobIntakeMembership[] | undefined,
): TJobIntakeMembership[] {
  return (memberships ?? []).filter((m) => !m.deleted_at);
}

export function isGroupChatMode(
  memberships: TJobIntakeMembership[] | undefined,
): boolean {
  return getActiveMemberships(memberships).length >= 1;
}

export function mentionsIncludeViona(mentions: number[] | undefined): boolean {
  return (mentions ?? []).includes(MENTION_VIONA_ID);
}

export function buildMentionDisplayContent(
  content: string,
  mentions: number[] | undefined,
  resolveName: (id: number) => string | undefined,
): string {
  if (!mentions?.length) return content;
  const prefixes = mentions
    .map((id) => {
      const name = resolveName(id);
      if (!name) return null;
      return `<span class="chatMention" data-mention-id="${id}">@${name}</span>`;
    })
    .filter(Boolean);
  if (prefixes.length === 0) return content;
  return `${prefixes.join(" ")} ${content}`;
}

/** design/job-intake-collab participant chip palette */
export const INTAKE_AVATAR_COLORS = ["#738FBD", "#2E69CA", "#73BD82"] as const;

export function getNameInitials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash + key.charCodeAt(i) * 17) % INTAKE_AVATAR_COLORS.length;
  }
  return INTAKE_AVATAR_COLORS[hash];
}

export function getStaffEmail(staff?: {
  account?: { username?: string };
}) {
  return staff?.account?.username || "";
}
