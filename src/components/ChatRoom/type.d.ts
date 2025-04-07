import { onChangeTabFunction } from "../../pages/job/index";

export type TExtraTagName =
  // 后端生成
  | "basic-info-request"
  | "reference-request"
  | "team-context-request"
  | "copy-link" // 复制链接
  | "jrd-done"
  | "jd-done"
  | "interview-plan-done"
  | "profile-feedback-and-priorities-request"
  | "other-requirements-request"
  // 前端生成
  | "open-link" // 打开新页面
  | "jrd-done-btn"
  | "interview-plan-done-btn"
  | "jd-done-btn";

export type TMessageFromApi = {
  id: number;
  content: {
    content: string;
    role: "user" | "assistant";
    metadata: {
      message_type: "" | "system" | "normal";
      message_sub_type: "" | "error" | "normal";
      extra_tags: {
        name: TExtraTagName;
        content: string;
      }[];
      hide_for_roles?: ("staff" | "coworker" | "candidate")[];
    };
  };
  updated_at: string;
};

export type TMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
  updated_at: string;
  messageType?: "normal" | "system";
  messageSubType?: "normal" | "error";
  extraTags?: {
    name: TExtraTagName;
    content: string;
  }[];
};

export type TChatType =
  | "jobRequirementDoc"
  | "candidate"
  | "jobDescription"
  | "jobInterviewPlan"
  | "chatbot";

export type TChatTypeWithApi = Exclude<TChatType, "chatbot">;

export interface IProps {
  jobId: number;
  sessionId?: string;
  allowEditMessage?: boolean;
  role?: "staff" | "coworker" | "candidate";
  onChangeTab?: onChangeTabFunction;
}

export type TRoleOverviewType =
  | "basic_info"
  | "reference"
  | "team_context"
  | "other_requirement";
