import { useEffect, useState } from "react";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Get } from "@/utils/request";
import CompanyLogo from "../components/CompanyLogo";

import styles from "./style.module.less";
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
      <div className={styles.main}>
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
                        ? "Accepted"
                        : "Rejected"}
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
