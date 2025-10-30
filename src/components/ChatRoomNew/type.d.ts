import { onChangeTabFunction } from "../../pages/job/index";

export type TDoneTag =
  | "jrd-done"
  | "compensation-details-done"
  | "outreach-done"
  | "intake-done"
  | "jd-done"
  | "interview-plan-done";

export type TExtraTagName =
  // 后端生成
  | "copy-link" // 复制链接
  | "jrd-language" // 选择 jrd 语言
  | "jd-language" // 选择 jd 语言
  | "talent-evaluate-result"
  | "huoqujibenxinxi-jindu-one"
  | "upload-jd"
  | "salary-structure-request"
  | "shaixuanbiaozhun"
  | "screening-q-request"
  | "jindu-two"
  // | "jindu-three"
  | "jindu-four"
  | "extract-high-level-responsibility"
  | "extract-day-to-day-tasks"
  | "extract-icp"
  | "success-metric"
  | "current-round-evaluation"
  | "context-done"
  | "realities-done"
  | "responsibilities-done"
  | "icp-done"
  | TDoneTag
  // 前端生成
  | "open-link" // 打开新页面
  | "to-compensation-details-btn"
  | "to-jd-btn"
  | "to-post-job-btn"
  | "to-target-companies-btn"
  | "to-screening-questions-btn"
  | "to-interview-plan-btn"
  | "to-outreach-btn"
  | "to-social-post-btn"
  | "to-faq-btn"
  | "to-chatbot-btn"
  | "chatbot-config-btn"
  | "post-job-btn"
  | "interview-feedback-confirm-btn"
  //candiate
  | "interview-done"
  | "conversation-done"
  | "job-interview-done";

export type TMessageFromApi = {
  id: number;
  content: {
    content: string;
    thinking?: string;
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
  thinking?: string;
  updated_at: string;
  messageType?: "normal" | "system";
  messageSubType?: "normal" | "error";
  extraTags?: TExtraTag[];
};

export type TChatType =
  | "jobRequirementDoc"
  | "jobDescription"
  | "jobCompensationDetails"
  | "jobOutreachMessage"
  | "jobInterviewPlan"
  | "jobInterviewDesign"
  | "jobInterviewFeedback";

export type TUserRole = "staff" | "coworker" | "candidate" | "trial_user";
export interface IProps {
  chatType: TChatType;
  jobId: number;
  sessionId?: string;
  allowEditMessage?: boolean;
  userRole?: TUserRole;
  share?: boolean;
  onChangeTab?: onChangeTabFunction;
  onNextTask?: () => void;
  jobInterviewDesignerId?: number;
  jobInterviewFeedbackId?: number;
  hideSidebar?: boolean;
  viewDoc?: (docType: string) => void;
}

export type TRoleOverviewType = "basic_info" | "reference" | "salary_structure";

export type TScreeningQuestionType = {
  question: string;
  required: boolean;
  deleted: boolean;
};
