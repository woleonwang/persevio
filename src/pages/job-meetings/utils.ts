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

export const parseBrief = (raw?: string): Record<string, unknown> | string | null => {
  if (!raw?.trim()) {
    return null;
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return raw;
  }
};

export const firstNameOf = (name?: string) => {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return "there";
  }
  return trimmed.split(/\s+/)[0];
};

export const getMessageActionTags = (message: TMeetingMessage) => {
  const tags = message.content?.metadata?.extra_tags || [];
  return tags
    .map((tag) => tag.name)
    .filter(
      (name) =>
        name === "request_resume_upload" || name === "open_put_forward",
    );
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
