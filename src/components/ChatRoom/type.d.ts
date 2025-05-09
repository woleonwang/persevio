import { onChangeTabFunction } from "../../pages/job/index";

export type TDoneTag =
  | "jrd-done"
  | "jd-done"
  | "targets-done"
  | "compensation-details-done"
  | "screening-q-done"
  | "interview-plan-done"
  | "outreach-done"
  | "social-post-done"
  | "faq-done";

export type TExtraTagName =
  // 后端生成
  | "copy-link" // 复制链接
  | "talent-evaluate-result"
  | "basic-info-request"
  | "reference-request"
  | "salary-structure-request"
  | "profile-feedback-and-priorities-request"
  | "screening-q-request"
  | TDoneTag
  // 前端生成
  | "open-link" // 打开新页面
  | "to-jd-btn"
  | "to-target-companies-btn"
  | "to-compensation-details-btn"
  | "to-screening-questions-btn"
  | "to-interview-plan-btn"
  | "to-outreach-btn"
  | "to-social-post-btn"
  | "to-faq-btn"
  | "to-chatbot-btn"
  | "chatbot-config-btn"

  //candiate
  | "interview-done";

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
      hide_for_roles?: ("staff" | "coworker" | "candidate" | "trial_user")[];
    };
  };
  updated_at: string;
};

type TExtraTag = {
  name: TExtraTagName;
  content: string;
};

export type TMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
  updated_at: string;
  messageType?: "normal" | "system";
  messageSubType?: "normal" | "error";
  extraTags?: TExtraTag[];
};

export type TChatType =
  | "jobRequirementDoc"
  | "jobDescription"
  | "jobTargetCompanies"
  | "jobCompensationDetails"
  | "jobScreeningQuestion"
  | "jobInterviewPlan"
  | "jobOutreachMessage"
  | "jobSocialMedia"
  | "jobFaq"
  | "chatbot"
  | "candidate"
  | "talentEvaluateResult";

export type TChatTypeWithApi = Exclude<TChatType, "chatbot">;

export type TUserRole = "staff" | "coworker" | "candidate" | "trial_user";
export interface IProps {
  jobId: number;
  sessionId?: string;
  allowEditMessage?: boolean;
  userRole?: TUserRole;
  disableApply?: boolean;
  onChangeTab?: onChangeTabFunction;
  onNextTask?: () => void;
}

export type TRoleOverviewType = "basic_info" | "reference" | "salary_structure";

export type TScreeningQuestionType = {
  question: string;
  required: boolean;
  deleted: boolean;
};
