import { Post } from "@/utils/request";
import { getOrCreateSessionId } from "@/utils";

/** 与后端 model/event_track.go 中 candidate 前端事件名保持一致 */
export const CandidateEventName = {
  JobApplyPageView: "job_apply_page_view",
  EnterApplyFlow: "enter_apply_flow",
  PersonalInfoFilled: "personal_info_filled",
  ResumeUploaded: "resume_uploaded",
  RegistrationCompleted: "registration_completed",
  LoginPageView: "login_page_view",
} as const;

export type TCandidateEventName =
  (typeof CandidateEventName)[keyof typeof CandidateEventName];

const EVENT_TRACK_URL = "/api/public/candidate/event_tracks";

export const trackCandidateEvent = (
  eventName: TCandidateEventName,
  extraParams?: Record<string, unknown>,
) => {
  const pagePath = `${window.location.pathname}${window.location.search}`;

  void Post(EVENT_TRACK_URL, {
    event_name: eventName,
    session_id: getOrCreateSessionId(),
    page_path: pagePath,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    extra_params: extraParams ? JSON.stringify(extraParams) : undefined,
  });
};
