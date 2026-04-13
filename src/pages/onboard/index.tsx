import { useEffect, useRef, useState } from "react";
import { Spin, message } from "antd";
import { useNavigate } from "react-router";

import { Get } from "@/utils/request";
import StaffChat from "@/components/StaffChat";
import StageBasics from "./components/StageBasics";
import StageMaterials from "./components/StageMaterials";
import { TOnboardingProfile, TOnboardingStage, TOnboardingStatusResponse } from "./type";
import styles from "./style.module.less";

const stageTitles: Record<TOnboardingStage, string> = {
  stage1: "Stage 1: Company Basics",
  stage2: "Stage 2: Company Materials",
  stage3: "Stage 3: Company Narrative Conversation",
  done: "Completed",
};

const OnboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<TOnboardingStage>("stage1");
  const [profile, setProfile] = useState<TOnboardingProfile>();
  const redirectScheduledRef = useRef(false);
  const timeoutRef = useRef<number>();

  const navigate = useNavigate();

  useEffect(() => {
    init();
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  const handleNarrativeDone = () => {
    if (redirectScheduledRef.current) return;
    redirectScheduledRef.current = true;
    message.success("对话已完成，5秒后将自动跳转");
    timeoutRef.current = window.setTimeout(() => {
      navigate("/app/entry/create-job", { replace: true });
    }, 5000);
  };


  const init = async () => {
    const { code: settingsCode, data: settings } = await Get("/api/settings");
    if (settingsCode !== 0) {
      navigate("/signin");
      return;
    }
    if (settings.company_status !== "approved") {
      navigate("/signup");
      return;
    }
    if (settings.onboarding_status === "done") {
      navigate("/app/entry/create-job", { replace: true });
      return;
    }

    setStage(settings.onboarding_status || "stage1");
    await refreshStatus();
    setLoading(false);
  };

  const refreshStatus = async () => {
    const { code, data } = await Get("/api/onboarding/status");
    if (code !== 0) {
      return;
    }
    const onboardingData = data as TOnboardingStatusResponse;
    setStage(onboardingData.onboarding_stage);
    setProfile(onboardingData.profile || {});
    if (onboardingData.onboarding_stage === "done") {
      navigate("/app/entry/create-job", { replace: true });
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.headerSection}>
        <div className={styles.pageTitle}>Employer Onboarding</div>
        <div className={styles.pageSubTitle}>{stageTitles[stage]}</div>
      </div>

      {stage === "stage1" && <StageBasics profile={profile} onSuccess={refreshStatus} />}
      {stage === "stage2" && (
        <StageMaterials profile={profile} onSuccess={refreshStatus} />
      )}
      {stage === "stage3" && (
        <div className={styles.chatWrap}>
          <StaffChat
            chatType="companyOnboardingNarrative"
            jobId={0}
            onNextTask={handleNarrativeDone}
            hidePredefinedButtons
          />
        </div>
      )}
    </div>
  );
};

export default OnboardPage;
