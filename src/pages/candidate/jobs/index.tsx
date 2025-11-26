import Tabs from "@/components/Tabs";
import classnames from "classnames";
import styles from "./style.module.less";
import RecommendedJobs from "@/assets/icons/recommended-jobs";
import JobApply from "@/assets/icons/job-apply";
import { useEffect, useState } from "react";
import { Get } from "@/utils/request";
import EmptyImg from "@/assets/job-applies-empty.png";
import { Empty } from "antd";
import { getJobApplyStatus, getQuery, parseJSON, updateQuery } from "@/utils";
import { useNavigate } from "react-router";
import CompanyLogo from "../components/CompanyLogo";
import { useTranslation } from "react-i18next";

const Jobs = () => {
  const tab = getQuery("tab");
  const [activeKey, setActiveKey] = useState(tab || "recommend");
  const [jobApplies, setJobApplies] = useState<IJobApplyListItem[]>([]);
  const navigate = useNavigate();
  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>) =>
    originalT(`candidate_jobs.${key}`, params);

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
    const statusLabelMap: Record<string, string> = {
      accepted: t("status.accepted"),
      rejected: t("status.rejected"),
      screening: t("status.screening"),
      default: t("status.ai_dialogue"),
    };

    return (
      <div className={classnames(styles.jobApplyStatusTag, styles[status])}>
        {statusLabelMap[status] || statusLabelMap.default}
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
              label: t("tabs.recommend"),
              icon: <RecommendedJobs />,
            },
            {
              key: "apply",
              label: t("tabs.apply"),
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
            description={t("empty_description")}
          />
        )}
        {activeKey === "apply" &&
          (jobApplies.length > 0 ? (
            <div className={styles.jobApplies}>
              {jobApplies.map((jobApply) => {
                const basicInfo: TJobBasicInfo = parseJSON(
                  jobApply.job_basic_info
                );
                const location = (basicInfo.location ?? [])
                  .map((loc) => loc.city)
                  .join(", ");
                const roleType = basicInfo.role_type
                  ? t(`role_type.${basicInfo.role_type}`)
                  : "";
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
                        {(location || roleType) && (
                          <div className={styles.tags}>
                            {`${location ? `${location} - ` : ""} ${roleType}`}
                          </div>
                        )}
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
              description={t("empty_description")}
            />
          ))}
      </div>
    </div>
  );
};

export default Jobs;
