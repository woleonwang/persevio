export interface IProps {
  jobId: number;
  sessionId?: string;
  allowEditMessage?: boolean;
  userRole?: TUserRole;
  onChangeTab?: onChangeTabFunction;
  onNextTask?: () => void;
  jobInterviewDesignerId?: number;
  jobInterviewFeedbackId?: number;
  hideSidebar?: boolean;
  enableFullscreen?: boolean;
}
