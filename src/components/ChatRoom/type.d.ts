import { onChangeTabFunction } from "../../pages/job/index";

export type TExtraTagName =
  // 后端生成
  | "basic-info-request"
  | "reference-request"
  | "team-context-request"
  | "copy-link" // 复制链接
  | "targets-done"
  | "compensation-details-done"
  | "screening-q-done"
  | "jd-done"
  | "interview-plan-done"
  | "profile-feedback-and-priorities-request"
  | "other-requirements-request"
  | "salary-structure-request"
  | "screening-q-request"
  // 前端生成
  | "open-link" // 打开新页面
  | "targets-done-btn"
  | "compensation-details-done-btn"
  | "screening-q-done-btn"
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
  | "jobCompensationDetails"
  | "jobScreeningQuestion"
  | "jobInterviewPlan"
  | "jobDescription"
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
  | "other_requirement"
  | "salary_structure";

export type TScreeningQuestionType = {
  question: string;
  required: boolean;
};
