import { useEffect, useRef, useState } from "react";
import { Spin, message } from "antd";
import { useNavigate } from "react-router";
import classnames from "classnames";

import { Get } from "@/utils/request";
import Step from "@/components/Step";
import StaffChat from "@/components/StaffChat";
import StageBasics from "./components/StageBasics";
import StageMaterials from "./components/StageMaterials";
import { TOnboardingProfile, TOnboardingStage } from "./type";

import logo from "@/assets/logo.png";
import styles from "./style.module.less";

const stageTitles: Record<TOnboardingStage, string> = {
  stage1: "Company basics",
  stage2: "Company materials",
  stage3: "Company narrative with Viona",
  done: "Completed",
};

const stepIndexByStage: Record<TOnboardingStage, number> = {
  stage1: 0,
  stage2: 1,
  stage3: 2,
  done: 2,
};

/** Map legacy company.size from /api/companies to employee_count_range key */
const sizeMapping: Record<string, string> = {
  lte_10: "1_10",
  "11_to_50": "11_50",
  "51_to_100": "51_200",
  "101_to_500": "201_500",
  "501_to_1000": "501_1000",
  gte_1001: "1001_5000",
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
    message.success("Conversation completed. Redirecting in 5 seconds...");
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
    const { code: onboardingCode, data: onboardingData } = await Get(
      "/api/onboarding/status",
    );
    if (onboardingCode !== 0) {
      return;
    }

    const { code: settingsCode, data: settingsData } =
      await Get("/api/settings");
    if (settingsCode !== 0 || !settingsData) return;

    setStage(onboardingData.onboarding_stage);
    const basics = onboardingData.profile?.basics ?? {};
    if (!basics.company_name) {
      basics.company_name = settingsData.company_name;
    }
    if (!basics.employee_count_range) {
      basics.employee_count_range =
        sizeMapping[settingsData.company_size] || undefined;
    }
    const materials = onboardingData.profile?.materials ?? {};
    if (!materials.website_url) {
      materials.website_url = settingsData.company_website;
    }
    setProfile({
      basics,
      materials,
    });
    if (onboardingData.onboarding_stage === "done") {
      navigate("/app/entry/create-job", { replace: true });
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <img src={logo} alt="logo" />
        </div>
        <div className={styles.loadingBody}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src={logo} alt="logo" />
      </div>

      <div
        className={classnames(styles.content, {
          [styles.wideContent]: stage === "stage3",
        })}
      >
        <Step stepCount={3} currentIndex={stepIndexByStage[stage]} />
        <div className={styles.title}>{stageTitles[stage]}</div>
        <div className={styles.form}>
          {stage === "stage1" && (
            <StageBasics profile={profile} onSuccess={refreshStatus} />
          )}
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
      </div>
    </div>
  );
};

export default OnboardPage;
