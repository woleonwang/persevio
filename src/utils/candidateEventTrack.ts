import { Post } from "@/utils/request";
import { getOrCreateSessionId } from "@/utils";

/** 与后端 model/event_track.go 中 candidate 前端事件名保持一致 */
export const CandidateEventName = {
  JobApplyPageView: "job_apply_page_view",
  EnterApplyFlow: "enter_apply_flow",
  PersonalInfoFilled: "personal_info_filled",
  ResumeUploaded: "resume_uploaded",
  AssessmentViewed: "assessment_viewed",
  WrapUpViewed: "wrap_up_viewed",
  LoginPageView: "login_page_view",
  RegistrationGoogleClicked: "registration_google_clicked",
  RegistrationLinkedinClicked: "registration_linkedin_clicked",
  RegistrationOtpClicked: "registration_otp_clicked",
} as const;

export type TCandidateEventName =
  (typeof CandidateEventName)[keyof typeof CandidateEventName];

const EVENT_TRACK_URL = "/api/public/candidate/event_tracks";

type TrackCandidateEventOptions = {
  jobId?: number;
  extraParams?: Record<string, unknown>;
};

export type TCandidateEventData = {
  page_path: string;
  screen_width: number;
  screen_height: number;
  referrer: string;
};

export const getCandidateEventData = (): TCandidateEventData => ({
  page_path: `${window.location.pathname}${window.location.search}`,
  screen_width: window.screen.width,
  screen_height: window.screen.height,
  referrer: document.referrer || "",
});

export const trackCandidateEvent = (
  eventName: TCandidateEventName,
  options?: TrackCandidateEventOptions,
) => {
  void Post(EVENT_TRACK_URL, {
    event_name: eventName,
    session_id: getOrCreateSessionId(),
    job_id: options?.jobId,
    extra_params: options?.extraParams
      ? JSON.stringify(options.extraParams)
      : undefined,
    ...getCandidateEventData(),
  });
};
