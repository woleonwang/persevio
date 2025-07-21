import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { ConfigProvider } from "antd";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import "./index.css";
import App from "./layouts/App";
import CandidateApp from "./layouts/Candidate";
import Share from "./layouts/Share";

import Home from "./pages/home";
import Signin from "./pages/signin";
import Signup from "./pages/signup";
import Job from "./pages/job";
import JobsCreate from "./pages/jobs-create";
import JobsShow from "./pages/jobs-show";
import CompanyKnowledge from "./pages/company";
import Apply from "./pages/apply";
import Settings from "./pages/settings";
import JobCoworker from "./pages/job-coworker";
import Talent from "./pages/talent";
import JobRequirement from "./pages/job-requirement";
import SystemPromptFeedback from "./pages/system-prompt-feedback";

import SignUpCandidate from "./pages/candidate/signup";
import SignInCandidate from "./pages/candidate/signin";

import CandidateResume from "./pages/candidate/candidate-resume";

import enUS from "./locales/en-US.ts";
import zhCN from "./locales/zh-CN.ts";
import zhCNReact from "antd/es/locale/zh_CN"; // 中文
import CareerAspirations from "./pages/candidate/career-aspirations";
import DeepAspirations from "./pages/candidate/deep-aspirations";
import DeepAspirationsVoice from "./pages/candidate/deep-aspirations-voice";
import CandidateSettings from "./pages/candidate/settings";
import JobApplies from "./pages/candidate/job-applies";
import JobApplyShow from "./pages/candidate/job-apply-show";
import CandidateHome from "./pages/candidate/candidate-home";

import AdminJobs from "./pages/admin/jobs";
import AdminJobApplies from "./pages/admin/job-applies";
import RecommendedJobShow from "./pages/candidate/recommended-job-show";
import Interviewer from "./pages/staff/interviewer";
import WorkExperience from "./pages/candidate/work-experience";
import VoiceChat from "./pages/candidate/voice-chat";
import InterviewDesigners from "./pages/interview-designers";
import InterviewDesignersCreate from "./pages/interview-designers/interview-designers-create";
import InterviewDesignersEdit from "./pages/interview-designers/interview-designers-edit";
import InteviewDesignersChat from "./pages/interview-designers/interview-designers-chat";
import InterviewFeedbacks from "./pages/interview-feedbacks";
import InterviewFeedbacksCreate from "./pages/interview-feedbacks/interview-feedback-create";
import InterviewFeedbacksEdit from "./pages/interview-feedbacks/interview-feedbacks-edit";
import InteviewFeedbacksChat from "./pages/interview-feedbacks/interview-feedbacks-chat";
import JobChat from "./pages/job-chat";
import JobDocument from "./pages/job-document";
import JobBoard from "./pages/job-board";

i18n.use(initReactI18next).init({
  resources: {
    "en-US": {
      translation: enUS,
    },
    "zh-CN": {
      translation: zhCN,
    },
  },
  fallbackLng: "en-US",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimaryHover: "#1FAC6A",
          colorPrimary: "#1FAC6A",
        },
      }}
      locale={zhCNReact}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs/:id/chat" element={<JobsShow />} />
          <Route path="/jobs/requirement" element={<JobRequirement />} />
          <Route
            path="/jobs/:id/:companyName/:jobName"
            element={<JobsShow />}
          />
          <Route
            path="/jobs/:invitation_token/coworker"
            element={<JobCoworker />}
          />
          <Route path="/share" element={<Share />}>
            <Route path="/share/create-job" element={<JobsCreate share />} />
          </Route>

          <Route path="/app" element={<App />}>
            {/* <Route path="/entry" element={<Entry />}></Route> */}
            <Route path="/app/entry/create-job" element={<JobsCreate />} />
            <Route
              path="/app/jobs/:jobId/chat/:chatType"
              element={<JobChat />}
            />
            <Route
              path="/app/jobs/:jobId/document/:chatType"
              element={<JobDocument />}
            />
            <Route path="/app/jobs/:jobId/board" element={<JobBoard />} />
            <Route path="/app/jobs/:jobId" element={<Job />} />
            <Route
              path="/app/jobs/:jobId/talents/:talentId"
              element={<Talent />}
              handle={{ layout: "blank" }}
              key="talent"
            />
            <Route
              path="/app/jobs/:jobId/interview-designers"
              element={<InterviewDesigners />}
              key="interview_designers"
            />
            <Route
              path="/app/jobs/:jobId/interview-designers/new"
              element={<InterviewDesignersCreate />}
              key="interview_designers_new"
            />
            <Route
              path="/app/jobs/:jobId/interview-designers/:interviewDesignerId/edit"
              element={<InterviewDesignersEdit />}
              key="interview_designers_edit"
            />
            <Route
              path="/app/jobs/:jobId/interview-designers/:interviewDesignerId/chat"
              element={<InteviewDesignersChat />}
              key="interview_designers_chat"
            />
            <Route
              path="/app/jobs/:jobId/interview-feedbacks"
              element={<InterviewFeedbacks />}
              key="interview_feedbacks"
            />
            <Route
              path="/app/jobs/:jobId/interview-feedbacks/new"
              element={<InterviewFeedbacksCreate />}
              key="interview_feedbacks_new"
            />
            <Route
              path="/app/jobs/:jobId/interview-feedbacks/:interviewFeedbackId/edit"
              element={<InterviewFeedbacksEdit />}
              key="interview_feedbacks_edit"
            />
            <Route
              path="/app/jobs/:jobId/interview-feedbacks/:interviewFeedbackId/chat"
              element={<InteviewFeedbacksChat />}
              key="interview_feedbacks_chat"
            />

            <Route path="/app/company" element={<CompanyKnowledge />} />
            <Route path="/app/interviewer" element={<Interviewer />} />
            <Route path="/app/settings" element={<Settings />} />
            <Route
              path="/app/system_prompt"
              element={<SystemPromptFeedback />}
            />
            <Route path="/app/admin/jobs" element={<AdminJobs />} />
            <Route
              path="/app/admin/job-applies"
              element={<AdminJobApplies />}
            />
          </Route>
          <Route path="/candidate" element={<CandidateApp />}>
            <Route path="/candidate/home" element={<CandidateHome />} />
            <Route path="/candidate/profile" element={<CandidateResume />} />
            <Route
              path="/candidate/aspirations"
              element={<CareerAspirations />}
            />
            <Route
              path="/candidate/aspirations"
              element={<CareerAspirations />}
            />
            <Route
              path="/candidate/home/deep-aspirations"
              element={<DeepAspirations />}
            />
            <Route
              path="/candidate/home/deep-aspirations-voice"
              element={<DeepAspirationsVoice />}
            />
            <Route
              path="/candidate/home/work-experience/:companyName"
              element={<WorkExperience />}
            />
            <Route path="/candidate/job-applies" element={<JobApplies />} />
            <Route
              path="/candidate/job-applies/:jobApplyId"
              element={<JobApplyShow />}
            />
            <Route
              path="/candidate/recommended-jobs/:recommendedJobId"
              element={<RecommendedJobShow />}
            />
            <Route path="/candidate/settings" element={<CandidateSettings />} />
            <Route path="/candidate/voice-chat" element={<VoiceChat />} />
            <Route
              path="/candidate/voice-chat/:model"
              element={<VoiceChat />}
            />
          </Route>
          <Route path="/signup-candidate" element={<SignUpCandidate />} />
          <Route path="/signin-candidate" element={<SignInCandidate />} />
          <Route path="/signup" element={<Signup />}></Route>
          <Route path="/signin" element={<Signin />} />
          <Route path="/apply" element={<Apply />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>
);
