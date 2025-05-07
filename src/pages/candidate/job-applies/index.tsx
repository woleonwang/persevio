import { useEffect, useState } from "react";
import styles from "./style.module.less";
import { Get } from "@/utils/request";
import { getImgSrc } from "@/utils";
const JobApplies = () => {
  const [jobApplies, setJobApplies] = useState<IJobApplyListItem[]>([]);

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
      <div className={styles.header}>Jobs For You</div>
      <div className={styles.main}>
        <div className={styles.title}>Applied Jobs</div>
        {jobApplies.map((jobApply) => {
          return (
            <div
              key={jobApply.id}
              className={styles.jobApplyCard}
              onClick={() => {
                window.open(`/candidate/job-applies/${jobApply.id}`, "_blank");
              }}
            >
              <img
                src={getImgSrc(jobApply.company_logo)}
                className={styles.companyLogo}
              />
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
