export interface IProps {
  jobId: number;
  sessionId?: string;
  onChangeTab?: onChangeTabFunction;
  onNextTask?: () => void;
  jobInterviewDesignerId?: number;
  jobInterviewFeedbackId?: number;
  hideSidebar?: boolean;
  enableFullscreen?: boolean;
}
