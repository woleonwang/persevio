import { onChangeTabFunction } from "../../pages/job/index";

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
  newVersion?: boolean;
}

export type TRoleOverviewType = "basic_info" | "reference" | "salary_structure";

export type TScreeningQuestionType = {
  question: string;
  required: boolean;
  deleted: boolean;
};
