export interface IProps {
  jobId: string | number;
  sessionId?: string;
  onChangeTab?: onChangeTabFunction;
  onNextTask?: () => void;
  jobInterviewDesignerId?: number;
  jobInterviewFeedbackId?: number;
  hideSidebar?: boolean;
  enableFullscreen?: boolean;
}
