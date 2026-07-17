import { onChangeTabFunction } from "../../pages/job/index";

export type TChatType =
  | "jobRequirementDoc"
  | "jobDescription"
  | "jobTalentEvaluateFeedback"
  | "jobJrdEdit"
  | "companyOnboardingNarrative";

export interface IProps {
  chatType: TChatType;
  /** 路由或接口路径中的 job 标识：数字 id、invitation_token、candidate_uuid 等 */
  jobId: string | number;
  sessionId?: string;
  share?: boolean;
  onChangeTab?: onChangeTabFunction;
  onNextTask?: () => void;
  jobInterviewDesignerId?: number;
  jobInterviewFeedbackId?: number;
  talentId?: number;
  /** `chatType === "jobJrdEdit"` 时必填，对应 jrd-edit-conversations 的会话 id */
  jrdEditConversationId?: number;
  hideSidebar?: boolean;
  viewDoc?: (docType: string) => void;
  hidePredefinedButtons?: boolean;
  hideRetry?: boolean;
  autoStart?: boolean;
  /** Job Intake 群聊：成员列表变化时回传给页面顶栏 */
  onMembershipsChange?: (memberships: TJobIntakeMembership[]) => void;
  /** 受控打开邀请弹窗（顶栏 Invite 与气泡 CTA 共用） */
  inviteCollaboratorsOpen?: boolean;
  onInviteCollaboratorsOpenChange?: (open: boolean) => void;
  /** 顶栏移除成员后递增，触发聊天刷新 */
  membershipsRefreshSignal?: number;
}

export type TRoleOverviewType = "basic_info" | "reference" | "salary_structure";

export type TScreeningQuestionType = {
  question: string;
  required: boolean;
  deleted: boolean;
};
