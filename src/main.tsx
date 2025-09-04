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
import JobCreate from "./pages/job/create";
import JobsShow from "./pages/jobs-show";
import CompanyKnowledge from "./pages/company";
import Apply from "./pages/apply";
import Settings from "./pages/settings";
import Talent from "./pages/talent";
import SnakeGame from "./pages/snake";

import SignInCandidate from "./pages/candidate/signin";

import CandidateResume from "./pages/candidate/candidate-resume";

import enUS from "./locales/en-US.ts";
import zhCN from "./locales/zh-CN.ts";
import zhCNReact from "antd/es/locale/zh_CN"; // 英文
import CareerAspirations from "./pages/candidate/career-aspirations";
import DeepAspirations from "./pages/candidate/deep-aspirations";
import DeepAspirationsVoice from "./pages/candidate/deep-aspirations-voice";
import CandidateSettings from "./pages/candidate/settings";
import JobApplies from "./pages/candidate/job-applies";
import JobApplyShow from "./pages/candidate/job-apply-show";
import CandidateHome from "./pages/candidate/candidate-home";

import AdminJobs from "./pages/admin/jobs";
import AdminJobApplies from "./pages/admin/job-applies";
import AdminCandidates from "./pages/admin/candidates";
import AdminCandidateConnections from "./pages/admin/candidate-connections";
import Talents from "./pages/talents";
import RecommendedJobShow from "./pages/candidate/recommended-job-show";
import WorkExperience from "./pages/candidate/work-experience";
import VoiceChat from "./pages/candidate/voice-chat";
import JobChat from "./pages/job/chat";
import JobDocument from "./pages/job/document";
import JobBoard from "./pages/job/board";
import TalentChat from "./pages/talent/chat";
import TalentSelect from "./pages/talent/select";
import TalentDetail from "./pages/talent/detail";
import PublicJobs from "./pages/public/jobs";
import PublicJobDetail from "./pages/public/job";
import PublicTalentDetailPage from "./pages/public/talent/detail";
import CompanyStatus from "./pages/company/status";
import AdminCompanies from "./pages/admin/companies";
import Staffs from "./pages/staffs";
import SignIn from "./pages/signin";

i18n.use(initReactI18next).init({
  resources: {
    "en-US": {
      translation: enUS,
    },
    "zh-CN": {
      translation: zhCN,
    },
  },
  lng: "en-US", // 设置初始语言为英文
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
      locale={zhCNReact} // 使用英文 locale
    >
      <BrowserRouter>
        <Routes>
          {/** 首页 */}
          <Route path="/" element={<Home />} />
          {/** 贪吃蛇游戏 */}
          <Route path="/snake" element={<SnakeGame />} />
          {/** 职位列表 */}
          <Route path="/jobs" element={<PublicJobs />} />
          {/** 分享职位详情文档 */}
          <Route path="/jobs/:id/share" element={<PublicJobDetail />} />
          {/** 职位 chatbot */}
          <Route path="/jobs/:id/chat" element={<JobsShow />} />
          <Route
            path="/jobs/:id/:companyName/:jobName"
            element={<JobsShow />}
          />
          <Route
            path="/product/business-growth/marvin_test"
            element={<SignIn />}
          />
          {/** 分享候选人面试设计 & 面试反馈文档 */}
          <Route
            path="/jobs/:jobId/talents/:talentId/detail"
            element={<PublicTalentDetailPage />}
          />
          {/** 分享创建职位页面 */}
          <Route path="/share" element={<Share />}>
            <Route path="/share/create-job" element={<JobCreate share />} />
          </Route>

          <Route path="/app" element={<App />}>
            {/* 公司审核状态 */}
            <Route path="/app/company/status" element={<CompanyStatus />} />
            {/* 创建职位 */}
            <Route path="/app/entry/create-job" element={<JobCreate />} />
            {/* 职位入口页 */}
            <Route path="/app/jobs/:jobId/board" element={<JobBoard />} />
            {/* 职位文档对话 */}
            <Route
              path="/app/jobs/:jobId/chat/:chatType"
              element={<JobChat />}
            />
            {/* 职位文档 */}
            <Route
              path="/app/jobs/:jobId/document/:chatType"
              element={<JobDocument />}
            />
            {/* 面试设计 & 反馈选择候选人 */}
            <Route
              path="/app/jobs/:jobId/talents/select/:chatType"
              element={<TalentSelect />}
              key="talentSelect"
            />
            {/* 面试设计 & 反馈对话 */}
            <Route
              path="/app/jobs/:jobId/talents/:talentId/chat"
              element={<TalentChat />}
              key="talentChat"
            />
            {/* 候选人面试设计 & 反馈详情 */}
            <Route
              path="/app/jobs/:jobId/talents/:talentId/detail"
              element={<TalentDetail />}
              key="talentDetail"
            />
            {/* 候选人详情：简历、评估报告 */}
            <Route
              path="/app/jobs/:jobId/talents/:talentId"
              element={<Talent />}
              handle={{ layout: "blank" }}
              key="talent"
            />
            {/* 公司知识库 */}
            <Route path="/app/company" element={<CompanyKnowledge />} />
            {/* 面试官管理 */}
            <Route path="/app/staffs" element={<Staffs />} />
            {/* HR端设置 */}
            <Route path="/app/settings" element={<Settings />} />

            {/* 管理员职位列表：用于推荐给候选人 */}
            <Route path="/app/admin/jobs" element={<AdminJobs />} />
            {/* 管理员申请列表：用于审核候选人申请 */}
            <Route
              path="/app/admin/job-applies"
              element={<AdminJobApplies />}
            />
            {/* 管理员候选人列表：用于审核候选人 */}
            <Route path="/app/admin/candidates" element={<AdminCandidates />} />
            {/* 管理员候选人匹配列表：用于审核候选人匹配 */}
            <Route
              path="/app/admin/candidate-connections"
              element={<AdminCandidateConnections />}
            />
            <Route path="/app/admin/companies" element={<AdminCompanies />} />
            {/* 候选人列表 */}
            <Route path="/app/talents" element={<Talents />} />
          </Route>

          <Route path="/candidate" element={<CandidateApp />}>
            {/* 候选人主页 */}
            <Route path="/candidate/home" element={<CandidateHome />} />
            {/* 候选人简历 */}
            <Route path="/candidate/profile" element={<CandidateResume />} />
            {/* 候选人职业规划 */}
            <Route
              path="/candidate/aspirations"
              element={<CareerAspirations />}
            />
            {/* 候选人深度职业规划对话 */}
            <Route
              path="/candidate/home/deep-aspirations"
              element={<DeepAspirations />}
            />
            <Route
              path="/candidate/home/deep-aspirations-voice"
              element={<DeepAspirationsVoice />}
            />
            {/* 申请职位列表 */}
            <Route path="/candidate/job-applies" element={<JobApplies />} />
            {/* 申请职位详情 */}
            <Route
              path="/candidate/job-applies/:jobApplyId"
              element={<JobApplyShow />}
            />
            {/* 推荐职位详情 */}
            <Route
              path="/candidate/recommended-jobs/:recommendedJobId"
              element={<RecommendedJobShow />}
            />

            <Route
              path="/candidate/home/work-experience/:companyName"
              element={<WorkExperience />}
            />
            <Route path="/candidate/settings" element={<CandidateSettings />} />
            <Route path="/candidate/voice-chat" element={<VoiceChat />} />
            <Route
              path="/candidate/voice-chat/:model"
              element={<VoiceChat />}
            />
          </Route>
          <Route path="/signin-candidate" element={<SignInCandidate />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/apply" element={<Apply />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>
);
