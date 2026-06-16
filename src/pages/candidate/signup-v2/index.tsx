import { useEffect, useRef, useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router";

import {
  CandidateEventName,
  trackCandidateEvent,
  type TCandidateEventName,
} from "@/utils/candidateEventTrack";
import { Get, Post } from "@/utils/request";
import {
  deleteQuery,
  getOrCreateSessionId,
  getQuery,
  isTempAccount,
  parseJSON,
} from "@/utils";
import { storage, StorageKey, tokenStorage } from "@/utils/storage";

import Step1Contact from "./components/Step1Contact";
import Step2Resume from "./components/Step2Resume";
import Step3Intro from "./components/Step3Intro";
import Step4Assessment from "./components/Step4Assessment";
import Step5Discovery from "./components/Step5Discovery";
import Step6WrapUp from "./components/Step6WrapUp";
import {
  hasInterviewFinished,
  hasWhatsappNumberConfirmed,
  isAssessmentReviewSettled,
  splitFullName,
} from "./utils";

type TPageState =
  | "contact"
  | "resume"
  | "intro"
  | "assessment"
  | "discovery"
  | "wrapup";

const SignupV2: React.FC = () => {
  const [pageState, setPageState] = useState<TPageState>();
  const [preRegisterInfo, setPreRegisterInfo] = useState<IPreRegisterInfo>({
    email: "",
    name: "",
    phone: "",
    country_code: "+65",
  });
  const [resumePath, setResumePath] = useState("");
  const [jobApply, setJobApply] = useState<IJobApply>();
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubmittingResume, setIsSubmittingResume] = useState(false);
  const [jobId, setJobId] = useState("");

  const jobIdFromQuery = getQuery("job_id")?.trim() ?? "";
  const internal = storage.get(StorageKey.INTERNAL_SIGNUP) === 1;
  const navigate = useNavigate();
  const pollRef = useRef<number>();

  useEffect(() => {
    if (!pageState) {
      return;
    }
    const eventByStep: Partial<Record<TPageState, TCandidateEventName>> = {
      contact: CandidateEventName.EnterApplyFlow,
      resume: CandidateEventName.PersonalInfoFilled,
      intro: CandidateEventName.ResumeUploaded,
      assessment: CandidateEventName.RegistrationCompleted,
    };
    const eventName = eventByStep[pageState];
    if (eventName) {
      trackCandidateEvent(eventName);
    }
  }, [pageState]);

  useEffect(() => {
    const error = getQuery("error");
    const code = getQuery("code");
    if (error === "google_login_failed") {
      if (code === "10000") {
        message.error("Failed to get profile");
      } else if (code === "10001" || code === "10002") {
        message.error("Token expired");
      } else if (code === "10003") {
        message.error("The email is already exists");
      }
    }

    const token = getQuery("candidate_token");
    if (token) {
      tokenStorage.setToken(token, "candidate");
      deleteQuery("candidate_token");
    }

    void init();
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const stopPolling = () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = undefined;
      }
    };

    if (pageState !== "assessment" || !jobId) {
      stopPolling();
      return;
    }

    if (isAssessmentReviewSettled(jobApply)) {
      stopPolling();
      return;
    }

    pollRef.current = window.setInterval(() => {
      void fetchJobApply(jobId).then((apply) => {
        if (apply && isAssessmentReviewSettled(apply)) {
          stopPolling();
        }
      });
    }, 2000);

    return stopPolling;
  }, [
    pageState,
    jobId,
    jobApply?.interview_strategy_status,
    jobApply?.initial_impression_json,
  ]);

  const fetchJobMeta = async (targetJobId: string) => {
    const { code, data } = await Get(`/api/public/jobs/${targetJobId}`, {
      version: "latest",
    });
    if (code === 0) {
      setJobTitle(data.job.name);
      setCompanyName(data.company.name);
      setCompanyLogo(data.company.logo ?? "");
    }
  };

  const fetchJobApply = async (
    targetJobId: string | number,
  ): Promise<IJobApply | undefined> => {
    if (!targetJobId) {
      return undefined;
    }
    const path =
      String(targetJobId).length === 36
        ? `/api/candidate/jobs/${targetJobId}/job_apply`
        : `/api/candidate/jobs/${targetJobId}/job_apply`;
    const { code, data } = await Get(path);
    if (code === 0) {
      const apply = data.job_apply as IJobApply;
      setJobApply(apply);
      return apply;
    }
    return undefined;
  };

  const refreshJobApply = async () => {
    if (!jobId) {
      return jobApply;
    }
    return fetchJobApply(jobId);
  };

  const fetchSurveyAndRedirect = async (applyId: number) => {
    const { code, data } = await Get(
      `/api/candidate/job_applies/${applyId}/survey`,
    );
    if (code === 0 && data.survey) {
      navigate(`/candidate/jobs/applies/${applyId}`, { replace: true });
      return true;
    }
    return false;
  };

  const resolveStepAfterAuth = async (apply?: IJobApply) => {
    if (apply?.id) {
      const redirected = await fetchSurveyAndRedirect(apply.id);
      if (redirected) {
        return;
      }
    }

    if (hasInterviewFinished(apply)) {
      setPageState("wrapup");
      return;
    }

    if (hasWhatsappNumberConfirmed(apply)) {
      setPageState("discovery");
      return;
    }

    setPageState("assessment");
  };

  const init = async () => {
    const activeJobId = jobIdFromQuery;
    if (activeJobId) {
      setJobId(activeJobId);
      void fetchJobMeta(activeJobId);
    }

    const { code, data } = await Get(`/api/candidate/settings`);
    if (code !== 0) {
      setPageState("contact");
      return;
    }

    const candidate: ICandidateSettings = data.candidate;
    const savedInfo: IPreRegisterInfo = parseJSON(
      candidate.pre_register_info ?? "{}",
    );
    setPreRegisterInfo(savedInfo);
    setResumePath(candidate.resume_path ?? "");
    setIsLoggedIn(true);

    if (candidate.job_id) {
      setJobId(String(candidate.job_id));
      void fetchJobMeta(String(candidate.job_id));
    } else if (activeJobId) {
      setJobId(activeJobId);
    }

    const targetJob = activeJobId || String(candidate.job_id || "");
    const apply = targetJob ? await fetchJobApply(targetJob) : undefined;

    if (!candidate.resume_path) {
      setPageState("resume");
      return;
    }

    if (isTempAccount(candidate)) {
      setPageState("intro");
      return;
    }

    await resolveStepAfterAuth(apply);
  };

  const onSubmitContact = async (basicInfo: IPreRegisterInfo) => {
    setPreRegisterInfo(basicInfo);

    if (isLoggedIn) {
      const { code } = await Post(`/api/candidate/pre_register_info`, {
        ...basicInfo,
      });
      if (code === 0) {
        message.success("Update successful");
        setPageState("resume");
      } else {
        message.error("Update failed");
      }
      return;
    }

    let params: Record<string, unknown> = {
      ...basicInfo,
      internal,
      session_id: getOrCreateSessionId(),
    };

    if (jobIdFromQuery) {
      const shareTokenMapping =
        storage.get<Record<string, string>>(StorageKey.SHARE_TOKEN, {}) || {};
      const shareToken = shareTokenMapping[jobIdFromQuery];
      const linkedinProfileId = storage.get<string>(
        StorageKey.LINKEDIN_PROFILE_ID,
      );
      const sourceChannelMapping = storage.get<Record<string, string>>(
        StorageKey.SOURCE_CHANNEL,
        {},
      );
      const sourceChannel = sourceChannelMapping?.[jobIdFromQuery];
      params = {
        ...params,
        share_token: shareToken,
        linkedin_profile_id: linkedinProfileId
          ? parseInt(linkedinProfileId)
          : undefined,
        source_channel: sourceChannel,
      };
      if (jobIdFromQuery.length === 36) {
        params.candidate_uuid = jobIdFromQuery;
      } else {
        params.job_id = parseInt(jobIdFromQuery);
      }
    }

    const { code, data } = await Post(`/api/candidate/register`, params);
    if (code === 0) {
      tokenStorage.setToken(data.token, "candidate");
      message.success("Save successful");
      setIsLoggedIn(true);
      setJobId(jobIdFromQuery || String(data.job_id || ""));
      setPageState("resume");
    } else {
      message.error("Save failed");
    }
  };

  const onSubmitResume = async (newResumePath: string) => {
    if (isSubmittingResume) {
      return;
    }
    setIsSubmittingResume(true);
    const { code } = await Post(`/api/candidate/resume`, {
      resume_path: newResumePath,
    });
    setIsSubmittingResume(false);

    if (code === 0) {
      setResumePath(newResumePath);
      message.success("Save successful");
      if (internal) {
        setPageState("assessment");
      } else {
        setPageState("intro");
      }
      if (jobId) {
        void fetchJobApply(jobId);
      }
    } else {
      message.error("Save failed");
    }
  };

  const onRegistrationVerified = () => {
    message.success("Registration successful");
    setPageState("assessment");
    if (jobId) {
      void fetchJobApply(jobId);
    }
  };

  const goToDiscovery = () => {
    setPageState("discovery");
  };

  const goToWrapUp = async () => {
    await refreshJobApply();
    setPageState("wrapup");
  };

  const finishFlow = () => {
    if (jobApply?.id) {
      navigate(`/candidate/jobs/applies/${jobApply.id}`, {
        replace: true,
      });
    } else {
      navigate("/candidate/jobs", { replace: true });
    }
  };

  const { firstName } = splitFullName(preRegisterInfo.name);

  if (!pageState) {
    return null;
  }

  if (pageState === "contact") {
    return (
      <Step1Contact
        initValues={preRegisterInfo}
        jobTitle={jobTitle || "Role"}
        companyName={companyName || "Company"}
        companyLogo={companyLogo}
        onSubmit={onSubmitContact}
      />
    );
  }

  if (pageState === "resume") {
    return (
      <Step2Resume
        firstName={firstName}
        jobTitle={jobTitle || "Role"}
        companyName={companyName || "Company"}
        companyLogo={companyLogo}
        initialResumePath={resumePath}
        isSubmitting={isSubmittingResume}
        onFinish={onSubmitResume}
      />
    );
  }

  if (pageState === "intro") {
    return (
      <Step3Intro
        firstName={firstName}
        companyName={companyName || "Company"}
        companyLogo={companyLogo}
        candidateEmail={preRegisterInfo.email}
        jobTitle={jobTitle || "Role"}
        onVerified={onRegistrationVerified}
      />
    );
  }

  if (pageState === "assessment") {
    return (
      <Step4Assessment
        jobApply={jobApply}
        countryCode={preRegisterInfo.country_code}
        phone={preRegisterInfo.phone}
        onContinue={goToDiscovery}
        onRefreshJobApply={refreshJobApply}
      />
    );
  }

  if (pageState === "discovery") {
    return (
      <Step5Discovery
        jobApply={jobApply}
        onFinishChat={goToWrapUp}
        onRefreshJobApply={refreshJobApply}
      />
    );
  }

  return (
    <Step6WrapUp
      firstName={firstName}
      companyName={companyName || "Company"}
      companyLogo={companyLogo}
      jobTitle={jobTitle || "Role"}
      jobApply={jobApply}
      onRefreshJobApply={refreshJobApply}
      onComplete={finishFlow}
    />
  );
};

export default SignupV2;
