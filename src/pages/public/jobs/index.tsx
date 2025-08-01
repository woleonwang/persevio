import React, { useEffect, useState } from "react";
import styles from "./style.module.less";
import { Get } from "@/utils/request";
import { parseJSON } from "@/utils";
import dayjs from "dayjs";
import { useNavigate } from "react-router";

interface JobPosting {
  id: string;
  name: string;
  company_name: string;
  company_logo: string;
  posted_at: string;
  team_name: string;
  team_lanugage: string;
  role_type: "onsite" | "hybrid" | "remote";
  location: {
    city: string;
    address: string;
  }[];
  employee_level: (
    | "internship"
    | "no_experience"
    | "junior"
    | "mid_level"
    | "senior"
  )[];
}

const roleTypeTranslations = {
  onsite: "完全在办公室工作",
  hybrid: "混合型",
  remote: "完全在家工作",
};

const levelTranslations = {
  internship: "实习生",
  no_experience: "应届毕业生/无经验",
  junior: "初级/少量经验",
  mid_level: "中级/有一定经验",
  senior: "高级/经验非常丰富",
};

const PublicJobs: React.FC = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { code, data } = await Get("/api/public/jobs");
    if (code === 0) {
      setJobs(
        data.jobs.map((job: any) => {
          return {
            ...job,
            ...parseJSON(job.basic_info),
          };
        })
      );
    }
  };

  const handleJobClick = (job: JobPosting) => {
    navigate(`/jobs/${job.id}/chat`);
  };

  const formatUpdatedAt = (updatedAt: string) => {
    const now = dayjs();
    const updated = dayjs(updatedAt);
    const diffMinutes = now.diff(updated, "minute");
    const diffHours = now.diff(updated, "hour");
    const diffDays = now.diff(updated, "day");

    if (diffMinutes < 60) {
      return `${Math.max(1, diffMinutes)} 分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小时前`;
    } else {
      return `${diffDays} 天前`;
    }
  };

  return (
    <div className={styles["job-recommendations"]}>
      {/* 头部区域 */}
      <div className={styles["job-recommendations-header"]}>
        <h2 className={styles["job-recommendations-title"]}>岗位推荐</h2>
      </div>

      {/* 岗位列表 */}
      <div className={styles["job-list"]}>
        {jobs.map((job) => (
          <div
            key={job.id}
            className={styles["job-card"]}
            onClick={() => handleJobClick(job)}
          >
            {/* 左侧：岗位详情 */}
            <div className={styles["job-details"]}>
              <div className={styles["job-logo"]}>
                {job.company_logo ? (
                  <img
                    src={
                      job.company_logo.startsWith("http")
                        ? job.company_logo
                        : `/api/logo/${job.company_logo}`
                    }
                    alt={job.company_name}
                  />
                ) : (
                  <div className={styles["job-logo-placeholder"]}>
                    {job.company_name}
                  </div>
                )}
              </div>
              <div className={styles["job-info"]}>
                <h3 className={styles["job-title"]}>{job.name}</h3>
                <div className={styles["job-meta"]}>
                  <span className={styles["job-department"]}>
                    {job.team_name}
                  </span>
                  <span className={styles["job-language"]}>
                    团队语言: {job.team_lanugage}
                  </span>
                  <span className={styles["job-mode"]}>
                    {roleTypeTranslations[job.role_type]}
                  </span>
                </div>
                <span className={styles["job-time"]}>
                  {formatUpdatedAt(job.posted_at)}
                </span>
              </div>
            </div>

            {/* 右侧：地点和经验标签 */}
            <div className={styles["job-tags"]}>
              {job.location && (
                <span className={styles["location-tag"]}>
                  {job.location.map((loc) => loc.city).join("、")}
                </span>
              )}
              {job.employee_level && (
                <span className={styles["experience-tag"]}>
                  {job.employee_level
                    .map((level) => levelTranslations[level])
                    .join("、")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicJobs;
