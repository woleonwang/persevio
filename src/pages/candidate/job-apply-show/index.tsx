import { useEffect, useState } from "react";
import styles from "./style.module.less";
import { Get } from "@/utils/request";
import { getImgSrc } from "@/utils";
import { useNavigate, useParams } from "react-router";
const JobApplyShow = () => {
  const [jobApplies, setJobApplies] = useState<IJobApplyListItem[]>([]);

  const { jobApplyId } = useParams();

  const navigate = useNavigate();
  useEffect(() => {
    fetchApplyJob();
  }, []);

  const fetchApplyJob = async () => {
    const { code, data } = await Get(
      `/api/candidate/job_applies/${jobApplyId}`
    );
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
                navigate(`/candidate/job-applies/${jobApply.id}`);
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

export default JobApplyShow;
