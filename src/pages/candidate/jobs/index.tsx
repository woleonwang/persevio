import Tabs from "@/components/Tabs";
import classnames from "classnames";
import styles from "./style.module.less";
import RecommendedJobs from "@/assets/icons/recommended-jobs";
import JobApply from "@/assets/icons/job-apply";
import { useEffect, useState } from "react";
import { Get } from "@/utils/request";
import EmptyImg from "@/assets/job-applies-empty.png";
import { Empty } from "antd";
import { getJobApplyStatus, getQuery, updateQuery } from "@/utils";
import { useNavigate } from "react-router";
import CompanyLogo from "../components/CompanyLogo";

const Jobs = () => {
  const tab = getQuery("tab");
  const [activeKey, setActiveKey] = useState(tab || "recommend");
  const [jobApplies, setJobApplies] = useState<IJobApplyListItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobApplies();
  }, []);

  const fetchJobApplies = async () => {
    const { code, data } = await Get("/api/candidate/job_applies");
    if (code === 0) {
      setJobApplies(data.job_applies);
    }
  };

  const genJobApplyStatusTag = (jobApply: IJobApplyListItem) => {
    const status = getJobApplyStatus(jobApply);
    return (
      <div className={classnames(styles.jobApplyStatusTag, styles[status])}>
        {status === "accepted"
          ? "Resume approved"
          : status === "rejected"
          ? "Resume not approved"
          : status === "screening"
          ? "Resume is being screened"
          : "AI dialogue"}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Tabs
          tabs={[
            {
              key: "recommend",
              label: "Recommended Jobs for You",
              icon: <RecommendedJobs />,
            },
            {
              key: "apply",
              label: "Jobs You Applied For",
              icon: <JobApply />,
            },
          ]}
          activeKey={activeKey}
          onChange={(key) => {
            setActiveKey(key);
            updateQuery("tab", key);
          }}
        />
      </div>
      <div className={styles.body}>
        {activeKey === "recommend" && (
          <Empty
            image={<img src={EmptyImg} alt="empty" style={{ width: "auto" }} />}
            description="Viona is working hard to help you find the right job."
          />
        )}
        {activeKey === "apply" &&
          (jobApplies.length > 0 ? (
            <div className={styles.jobApplies}>
              {jobApplies.map((jobApply) => {
                return (
                  <div
                    key={jobApply.id}
                    className={styles.jobApplyCard}
                    onClick={() => {
                      navigate(`/candidate/jobs/applies/${jobApply.id}`);
                    }}
                  >
                    <div className={styles.jobApplyInfo}>
                      <CompanyLogo logo={jobApply.company_logo} />

                      <div>
                        <div className={styles.jobName}>
                          {jobApply.job_name}
                        </div>
                        <div className={styles.tags}></div>
                        <div className={styles.companyName}>
                          {jobApply.company_name}
                        </div>
                      </div>
                    </div>
                    <div className={styles.jobApplyStatus}>
                      {genJobApplyStatusTag(jobApply)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty
              image={
                <img src={EmptyImg} alt="empty" style={{ width: "auto" }} />
              }
              description="Viona is working hard to help you find the right job."
            />
          ))}
      </div>
    </div>
  );
};

export default Jobs;
