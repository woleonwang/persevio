import { useEffect, useState } from "react";
import styles from "./style.module.less";
import { Get } from "@/utils/request";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import CompanyLogo from "../components/CompanyLogo";
const JobApplies = () => {
  const [jobApplies, setJobApplies] = useState<IJobApplyListItem[]>([]);

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_applies.${key}`);

  useEffect(() => {
    fetchApplyJobs();
  }, []);

  const fetchApplyJobs = async () => {
    const { code, data } = await Get("/api/candidate/job_applies");
    if (code === 0) {
      setJobApplies(data.job_applies);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>{t("applied_jobs")}</div>
      <div className={styles.main}>
        {jobApplies.map((jobApply) => {
          return (
            <div
              key={jobApply.id}
              className={styles.jobApplyCard}
              onClick={() => {
                navigate(`/candidate/job-applies/${jobApply.id}`);
              }}
            >
              <CompanyLogo logo={jobApply.company_logo} />
              <div>
                <div className={styles.jobName}>{jobApply.job_name}</div>
                <div className={styles.tags}>
                  <div className={styles.companyName}>
                    {jobApply.company_name}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JobApplies;
