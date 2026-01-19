import { getJobChatbotUrl } from "@/utils";
import { useTranslation } from "react-i18next";

import styles from "./style.module.less";
import dayjs from "dayjs";

export interface JobPosting extends TJobBasicInfo {
  id: number;
  name: string;
  company_name: string;
  company_logo: string;
  posted_at: string;
  version: number;
}

type TCompany = {
  id: number;
  logo: string;
  name: string;
  round: string;
  staffCount: string;
  type: string;
};

const roleTypeTranslations = {
  onsite: "onsite",
  hybrid: "hybrid",
  remote: "remote",
};

const levelTranslations = {
  internship: "internship",
  no_experience: "no_experience",
  junior: "junior",
  mid_level: "mid_level",
  senior: "senior",
};

export const MockCompanies: TCompany[] = [
  {
    id: 1,
    logo: "9_bbd4df1d-d105-4957-90b7-11cad97920d1.PNG",
    name: "MetaApp",
    round: "Series C",
    staffCount: "100-499 people",
    type: "Internet",
  },
  {
    id: 2,
    logo: "9_e313cacf-bca1-4a68-a048-2af512a5d156.PNG",
    name: "Nexa",
    round: "No Funding",
    staffCount: "20-99 people",
    type: "Gaming",
  },
  {
    id: 3,
    logo: "9_0908616f-6b74-4045-9b1f-f81aabfa1028.PNG",
    name: "FunPlus",
    round: "Series B",
    staffCount: "1000-9999 people",
    type: "Gaming",
  },
  {
    id: 4,
    logo: "9_8a2db8c1-174e-4b5d-801c-26f928d9f30b.PNG",
    name: "MAKE1",
    round: "No Funding",
    staffCount: "20-99 people",
    type: "Smart Hardware",
  },
  {
    id: 5,
    logo: "9_831e6535-bf29-4e33-9f26-7c4b5889714b.PNG",
    name: "DeepTech",
    round: "Series C",
    staffCount: "100-499 people",
    type: "Big Data",
  },
  {
    id: 6,
    logo: "9_41900bb8-e6ce-4c02-b497-8cece00645f6.PNG",
    name: "United Industry",
    round: "Series B",
    staffCount: "100-499 people",
    type: "Enterprise Services",
  },
  {
    id: 7,
    logo: "9_42cca79e-56e0-4c01-b46e-d0318121bb21.PNG",
    name: "TestBird",
    round: "No Funding",
    staffCount: "100-499 people",
    type: "Internet",
  },
  {
    id: 8,
    logo: "9_3c9275fa-9e43-4c64-a7b5-11536357a05d.png",
    name: "Cupshe",
    round: "Series A",
    staffCount: "500-999 people",
    type: "E-commerce",
  },
  {
    id: 9,
    logo: "9_f0e3acf3-3f0f-4824-9780-8577b40b8d20.png",
    name: "TrailFinder",
    round: "Series C",
    staffCount: "500-999 people",
    type: "Internet",
  },
  {
    id: 10,
    logo: "9_15620fa9-f433-4e24-96e6-1765280541fb.png",
    name: "Mathplore",
    round: "Series B",
    staffCount: "1000-9999 people",
    type: "Online Education",
  },
];
const PublicJobCard = ({ job }: { job: JobPosting }) => {
  const { t: originalT } = useTranslation();

  const t = (key: string) => {
    return originalT(`public_jobs.${key}`);
  };

  const handleJobClick = (job: JobPosting) => {
    if (job.id < 10000) {
      window.open(getJobChatbotUrl(job.id, job.version.toString()));
    }
  };

  const companyLogo = (job: JobPosting) => {
    return job.company_logo.startsWith("http")
      ? job.company_logo
      : `/api/logo/${job.company_logo}`;
  };

  const formatUpdatedAt = (updatedAt: string): string => {
    const now = dayjs();
    const updated = dayjs(updatedAt);
    const diffMinutes = now.diff(updated, "minute");
    const diffHours = now.diff(updated, "hour");
    const diffDays = now.diff(updated, "day");

    if (diffMinutes < 60) {
      return `${Math.max(1, diffMinutes)} ${t("job_card.time_ago.minute")}`;
    } else if (diffHours < 24) {
      return `${diffHours} ${t("job_card.time_ago.hour")}`;
    } else if (diffDays < 7) {
      return `${diffDays} ${t("job_card.time_ago.day")}`;
    } else {
      return `${updated.format("YYYY-MM-DD")}`;
    }
  };

  return (
    <div
      key={job.id}
      className={styles["job-card"]}
      onClick={() => handleJobClick(job)}
    >
      {/* 左侧：岗位详情 */}
      <div className={styles["job-details"]}>
        <div className={styles["job-logo"]}>
          <img
            src={
              job.company_logo
                ? companyLogo(job)
                : `/api/logo/${
                    MockCompanies[job.id % MockCompanies.length].logo
                  }`
            }
            alt={job.company_name}
          />
        </div>
        <div className={styles["job-info"]}>
          <h3 className={styles["job-title"]}>{job.name}</h3>
          <div className={styles["job-meta"]}>
            <span className={styles["job-mode"]}>
              {roleTypeTranslations[job.role_type] &&
                t(`job_card.role_type.${roleTypeTranslations[job.role_type]}`)}
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
              .map((level) =>
                t(`job_card.employee_level.${levelTranslations[level]}`)
              )
              .join("、")}
          </span>
        )}
      </div>
    </div>
  );
};

export default PublicJobCard;
