import { useEffect, useState } from "react";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Get } from "@/utils/request";
import CompanyLogo from "../components/CompanyLogo";

import styles from "./style.module.less";
import { Button } from "antd";
const CandidateHome = () => {
  const [recommendedJobs, setRecommendedJobs] = useState<IRecommendedJob[]>([]);

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`candidate_home.${key}`);

  useEffect(() => {
    fetchRecommendedJobs();
  }, []);

  const fetchRecommendedJobs = async () => {
    const { code, data } = await Get("/api/candidate/recommended_jobs");
    if (code === 0) {
      setRecommendedJobs(data.recommended_jobs);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>{t("home")}</div>
      <div className={styles.homeTitle}>Welcome back</div>
      <div className={classnames(styles.homePanel, styles.tasks)}>
        <div className={styles.title}>{t("important_tasks")}</div>
        <div className={styles.taskCardWrapper}>
          <div className={styles.taskCard}>
            <div className={styles.taskCardTitle}>{t("deep_aspirations")}</div>
            <div className={styles.taskCardHint}>
              {t("deep_aspirations_hint")}
            </div>
            <div>
              <Button
                type="primary"
                shape="round"
                onClick={() => navigate("/candidate/home/deep-aspirations")}
                style={{ width: "100%", marginTop: 20 }}
              >
                Start Now
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.homePanel}>
        <div className={styles.title}>{t("recommended_jobs")}</div>
        {recommendedJobs.map((recommendedJob) => {
          return (
            <div
              key={recommendedJob.id}
              className={styles.recommendedJobCard}
              onClick={() => {
                navigate(`/candidate/recommended-jobs/${recommendedJob.id}`);
              }}
            >
              <CompanyLogo logo={recommendedJob.job.company.logo ?? ""} />
              <div>
                <div className={styles.jobName}>{recommendedJob.job.name}</div>
                <div className={styles.tags}>
                  <div className={styles.companyName}>
                    {recommendedJob.job.company.name}
                  </div>
                  {recommendedJob.status !== "INITIAL" && (
                    <div
                      className={classnames(
                        styles.status,
                        styles[recommendedJob.status.toLowerCase()]
                      )}
                    >
                      {recommendedJob.status === "ACCEPTED"
                        ? originalT("accepted")
                        : originalT("rejected")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CandidateHome;
