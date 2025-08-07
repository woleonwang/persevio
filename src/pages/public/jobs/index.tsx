import React, { useEffect, useState } from "react";
import styles from "./style.module.less";
import { Get } from "@/utils/request";
import { parseJSON } from "@/utils";
import dayjs from "dayjs";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import HomeHeader from "@/components/HomeHeader";
import { Button, Input, Pagination } from "antd";

interface JobPosting extends TJobBasicInfo {
  id: number;
  name: string;
  company_name: string;
  company_logo: string;
  posted_at: string;
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

const MockJobs = [
  {
    id: 10001,
    name: "Senior Software Engineer",
    team_name: "Core Platform",
    team_lanugage: "English",
    role_type: "remote",
    location: [{ city: "San Francisco", address: "123 Main St" }],
    employee_level: ["senior"],
    posted_at: "2025-08-01T17:27:43.801+08:00",
  },
  {
    id: 10002,
    name: "Data Scientist",
    team_name: "Analytics",
    team_lanugage: "English",
    role_type: "hybrid",
    location: [{ city: "New York", address: "456 Park Ave" }],
    employee_level: ["junior", "mid_level"],
    posted_at: "2025-08-02T10:15:22.123+08:00",
  },
  {
    id: 10003,
    name: "UX Designer",
    team_name: "Product Design",
    team_lanugage: "English",
    role_type: "onsite",
    location: [{ city: "London", address: "789 Oxford St" }],
    employee_level: ["mid_level"],
    posted_at: "2025-08-03T09:00:00.000+08:00",
  },
  {
    id: 10004,
    name: "DevOps Engineer",
    team_name: "Infrastructure",
    team_lanugage: "English",
    role_type: "remote",
    location: [{ city: "Berlin", address: "1010 Krossen Str" }],
    employee_level: ["mid_level", "senior"],
    posted_at: "2025-08-01T20:30:15.555+08:00",
  },
  {
    id: 10005,
    name: "Product Manager",
    team_name: "Growth",
    team_lanugage: "English",
    role_type: "hybrid",
    location: [{ city: "Sydney", address: "222 George St" }],
    employee_level: ["senior"],
    posted_at: "2025-07-31T14:45:01.789+08:00",
  },
  {
    id: 10006,
    name: "Junior Frontend Developer",
    team_name: "Web Services",
    team_lanugage: "English",
    role_type: "onsite",
    location: [{ city: "San Francisco", address: "333 Market St" }],
    employee_level: ["junior"],
    posted_at: "2025-08-04T11:22:33.444+08:00",
  },
  {
    id: 10007,
    name: "Backend Developer",
    team_name: "API Services",
    team_lanugage: "English",
    role_type: "remote",
    location: [{ city: "Austin", address: "444 Congress Ave" }],
    employee_level: ["mid_level", "senior"],
    posted_at: "2025-08-01T15:00:00.000+08:00",
  },
  {
    id: 10008,
    name: "Quality Assurance Engineer",
    team_name: "Engineering Support",
    team_lanugage: "English",
    role_type: "hybrid",
    location: [{ city: "Boston", address: "555 Beacon St" }],
    employee_level: ["no_experience"],
    posted_at: "2025-08-05T08:05:10.987+08:00",
  },
  {
    id: 10009,
    name: "Technical Writer",
    team_name: "Documentation",
    team_lanugage: "English",
    role_type: "remote",
    location: [{ city: "Seattle", address: "666 Pine St" }],
    employee_level: ["mid_level"],
    posted_at: "2025-08-02T16:40:55.321+08:00",
  },
  {
    id: 10010,
    name: "AI Engineer",
    team_name: "Machine Learning",
    team_lanugage: "English",
    role_type: "onsite",
    location: [{ city: "San Jose", address: "777 First St" }],
    employee_level: ["senior"],
    posted_at: "2025-08-01T11:00:00.000+08:00",
  },
  {
    id: 10011,
    name: "Marketing Analyst",
    team_name: "Marketing",
    team_lanugage: "English",
    role_type: "hybrid",
    location: [{ city: "New York", address: "888 Broadway" }],
    employee_level: ["junior", "mid_level"],
    posted_at: "2025-07-30T10:00:00.000+08:00",
  },
  {
    id: 10012,
    name: "Cloud Architect",
    team_name: "Cloud Operations",
    team_lanugage: "English",
    role_type: "remote",
    location: [{ city: "Denver", address: "999 Colfax Ave" }],
    employee_level: ["senior"],
    posted_at: "2025-08-04T13:13:13.131+08:00",
  },
  {
    id: 10013,
    name: "Security Analyst",
    team_name: "Security Operations",
    team_lanugage: "English",
    role_type: "onsite",
    location: [{ city: "San Francisco", address: "101 Mission St" }],
    employee_level: ["mid_level"],
    posted_at: "2025-08-02T14:50:40.678+08:00",
  },
  {
    id: 10014,
    name: "Database Administrator",
    team_name: "Database",
    team_lanugage: "English",
    role_type: "hybrid",
    location: [{ city: "Boston", address: "202 Congress St" }],
    employee_level: ["mid_level", "senior"],
    posted_at: "2025-08-03T18:00:00.000+08:00",
  },
  {
    id: 10015,
    name: "Network Engineer",
    team_name: "Network",
    team_lanugage: "English",
    role_type: "remote",
    location: [{ city: "Chicago", address: "303 Wacker Dr" }],
    employee_level: ["junior"],
    posted_at: "2025-07-31T09:30:25.111+08:00",
  },
  {
    id: 10016,
    name: "Game Developer",
    team_name: "Gaming Studio",
    team_lanugage: "English",
    role_type: "onsite",
    location: [{ city: "Los Angeles", address: "404 Hollywood Blvd" }],
    employee_level: ["mid_level"],
    posted_at: "2025-08-01T08:00:00.000+08:00",
  },
  {
    id: 10017,
    name: "Mobile Developer",
    team_name: "Mobile Apps",
    team_lanugage: "English",
    role_type: "hybrid",
    location: [{ city: "San Jose", address: "505 Almaden Blvd" }],
    employee_level: ["senior"],
    posted_at: "2025-08-03T12:00:00.000+08:00",
  },
  {
    id: 10018,
    name: "SRE Engineer",
    team_name: "Site Reliability",
    team_lanugage: "English",
    role_type: "remote",
    location: [{ city: "Seattle", address: "606 Pine St" }],
    employee_level: ["mid_level", "senior"],
    posted_at: "2025-08-05T07:10:05.112+08:00",
  },
  {
    id: 10019,
    name: "HR Manager",
    team_name: "Human Resources",
    team_lanugage: "English",
    role_type: "onsite",
    location: [{ city: "San Francisco", address: "707 Union St" }],
    employee_level: ["senior"],
    posted_at: "2025-08-01T13:30:00.000+08:00",
  },
  {
    id: 10020,
    name: "Financial Analyst",
    team_name: "Finance",
    team_lanugage: "English",
    role_type: "hybrid",
    location: [{ city: "New York", address: "808 Wall St" }],
    employee_level: ["no_experience"],
    posted_at: "2025-08-02T19:00:00.000+08:00",
  },
  {
    id: 10021,
    name: "UI/UX Researcher",
    team_name: "User Experience",
    team_lanugage: "English",
    role_type: "remote",
    location: [{ city: "Austin", address: "909 Lamar Blvd" }],
    employee_level: ["mid_level"],
    posted_at: "2025-08-04T09:45:00.000+08:00",
  },
  {
    id: 10022,
    name: "Data Engineer",
    team_name: "Data Infrastructure",
    team_lanugage: "English",
    role_type: "onsite",
    location: [{ city: "Boston", address: "111 Causeway St" }],
    employee_level: ["junior"],
    posted_at: "2025-08-01T14:00:00.000+08:00",
  },
  {
    id: 10023,
    name: "Cybersecurity Specialist",
    team_name: "Cybersecurity",
    team_lanugage: "English",
    role_type: "hybrid",
    location: [{ city: "San Jose", address: "222 W Santa Clara St" }],
    employee_level: ["mid_level", "senior"],
    posted_at: "2025-08-03T17:00:00.000+08:00",
  },
  {
    id: 10024,
    name: "Product Designer",
    team_name: "Product Innovation",
    team_lanugage: "English",
    role_type: "remote",
    location: [{ city: "London", address: "333 Baker St" }],
    employee_level: ["mid_level"],
    posted_at: "2025-08-02T12:00:00.000+08:00",
  },
  {
    id: 10025,
    name: "Sales Manager",
    team_name: "Sales",
    team_lanugage: "English",
    role_type: "onsite",
    location: [{ city: "San Francisco", address: "444 Montgomery St" }],
    employee_level: ["senior"],
    posted_at: "2025-08-01T16:00:00.000+08:00",
  },
  {
    id: 10026,
    name: "Operations Manager",
    team_name: "Operations",
    team_lanugage: "English",
    role_type: "hybrid",
    location: [{ city: "Seattle", address: "555 Pine St" }],
    employee_level: ["mid_level"],
    posted_at: "2025-08-04T10:30:00.000+08:00",
  },
  {
    id: 10027,
    name: "Research Scientist",
    team_name: "Research & Development",
    team_lanugage: "English",
    role_type: "remote",
    location: [{ city: "Boston", address: "666 Massachusetts Ave" }],
    employee_level: ["senior"],
    posted_at: "2025-08-03T09:15:00.000+08:00",
  },
  {
    id: 10028,
    name: "Intern - Software Engineer",
    team_name: "Core Platform",
    team_lanugage: "English",
    role_type: "onsite",
    location: [{ city: "San Francisco", address: "777 Mission St" }],
    employee_level: ["internship"],
    posted_at: "2025-08-05T08:30:00.000+08:00",
  },
  {
    id: 10029,
    name: "Growth Hacker",
    team_name: "Growth Marketing",
    team_lanugage: "English",
    role_type: "hybrid",
    location: [{ city: "New York", address: "888 Broadway" }],
    employee_level: ["junior"],
    posted_at: "2025-07-31T18:00:00.000+08:00",
  },
  {
    id: 10030,
    name: "Full Stack Developer",
    team_name: "Web Services",
    team_lanugage: "English",
    role_type: "remote",
    location: [{ city: "Austin", address: "999 Red River St" }],
    employee_level: ["mid_level", "senior"],
    posted_at: "2025-08-02T22:00:00.000+08:00",
  },
];

const MockCompanies: TCompany[] = [
  {
    id: 1,
    logo: "9_bbd4df1d-d105-4957-90b7-11cad97920d1.PNG",
    name: "MetaApp",
    round: "C轮融资",
    staffCount: "100-499人",
    type: "互联网",
  },
  {
    id: 2,
    logo: "9_e313cacf-bca1-4a68-a048-2af512a5d156.PNG",
    name: "Nexa",
    round: "未融资",
    staffCount: "20-99人",
    type: "游戏",
  },
  {
    id: 3,
    logo: "9_0908616f-6b74-4045-9b1f-f81aabfa1028.PNG",
    name: "FunPlus",
    round: "B轮融资",
    staffCount: "1000-9999人",
    type: "游戏",
  },
  {
    id: 4,
    logo: "9_8a2db8c1-174e-4b5d-801c-26f928d9f30b.PNG",
    name: "MAKE1",
    round: "未融资",
    staffCount: "20-99人",
    type: "智能硬件",
  },
  {
    id: 5,
    logo: "9_831e6535-bf29-4e33-9f26-7c4b5889714b.PNG",
    name: "深至科技",
    round: "C轮融资",
    staffCount: "100-499人",
    type: "大数据",
  },
  {
    id: 6,
    logo: "9_41900bb8-e6ce-4c02-b497-8cece00645f6.PNG",
    name: "众联成业",
    round: "B轮融资",
    staffCount: "100-499人",
    type: "企业服务",
  },
  {
    id: 7,
    logo: "9_42cca79e-56e0-4c01-b46e-d0318121bb21.PNG",
    name: "TestBird",
    round: "未融资",
    staffCount: "100-499人",
    type: "互联网",
  },
  {
    id: 8,
    logo: "9_3c9275fa-9e43-4c64-a7b5-11536357a05d.png",
    name: "Cupshe",
    round: "A轮融资",
    staffCount: "500-999人",
    type: "电子商务",
  },
  {
    id: 9,
    logo: "9_f0e3acf3-3f0f-4824-9780-8577b40b8d20.png",
    name: "探迹",
    round: "C轮融资",
    staffCount: "500-999人",
    type: "互联网",
  },
  {
    id: 10,
    logo: "9_15620fa9-f433-4e24-96e6-1765280541fb.png",
    name: "Mathplore",
    round: "B轮融资",
    staffCount: "1000-9999人",
    type: "在线教育",
  },
];

const pageSize = 10;
const PublicJobs: React.FC = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { t: originalT } = useTranslation();

  const t = (key: string) => {
    return originalT(`public_jobs.${key}`);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { code, data } = await Get("/api/public/jobs");
    if (code === 0) {
      setJobs([
        ...data.jobs.map((job: any) => {
          return {
            ...job,
            ...parseJSON(job.basic_info),
          };
        }),
        ...MockJobs,
      ]);
    }
  };

  const handleJobClick = (job: JobPosting) => {
    if (job.id < 10000) {
      navigate(`/jobs/${job.id}/chat`);
    }
  };

  const formatUpdatedAt = (updatedAt: string) => {
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

  const visibleJobs = jobs.filter((item) => {
    return (
      !keyword ||
      item.company_name?.includes(keyword) ||
      item.name?.includes(keyword) ||
      !!(item.location ?? []).find(
        (loc) => loc.city?.includes(keyword) || loc.address?.includes(keyword)
      )
    );
  });

  const companyLogo = (job: JobPosting) => {
    return job.company_logo.startsWith("http")
      ? job.company_logo
      : `/api/logo/${job.company_logo}`;
  };

  return (
    <HomeHeader>
      <div className={styles.banner}>
        <div className={styles.title}>{t("banner.title")}</div>
        <div className={styles.subTitle}>{t("banner.subTitle")}</div>
        <div className={styles.search}>
          <Input.Search
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setCurrentPage(1);
            }}
            size="large"
            style={{ width: 800 }}
            placeholder={t("banner.search.placeholder")}
          />
          <div className={styles.searchTagWrapper}>
            <span>{t("banner.search.hotSearch")}</span>
            {(
              originalT("public_jobs.banner.search.hotSearchTags", {
                returnObjects: true,
              }) as string[]
            ).map((item: string) => (
              <div
                key={item}
                className={styles.searchTag}
                onClick={() => setKeyword(item)}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles["job-recommendations"]}>
        <div className={styles.left}>
          {/* 头部区域 */}
          <div className={styles["job-recommendations-header"]}>
            <h2 className={styles["job-recommendations-title"]}>
              {t("job_recommendations.title")}
            </h2>
          </div>

          {/* 岗位列表 */}
          <div className={styles["job-list"]}>
            {visibleJobs
              .slice(pageSize * (currentPage - 1), pageSize * currentPage)
              .map((job) => (
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
                                MockCompanies[job.id % MockCompanies.length]
                                  .logo
                              }`
                        }
                        alt={job.company_name}
                      />
                    </div>
                    <div className={styles["job-info"]}>
                      <h3 className={styles["job-title"]}>{job.name}</h3>
                      <div className={styles["job-meta"]}>
                        <span className={styles["job-department"]}>
                          {job.team_name}
                        </span>
                        <span className={styles["job-language"]}>
                          {t("job_card.team_language")} {job.team_lanugage}
                        </span>
                        <span className={styles["job-mode"]}>
                          {t(
                            `job_card.role_type.${
                              roleTypeTranslations[job.role_type]
                            }`
                          )}
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
                            t(
                              `job_card.employee_level.${levelTranslations[level]}`
                            )
                          )
                          .join("、")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Pagination
              current={currentPage}
              total={visibleJobs.length}
              pageSize={pageSize}
              onChange={(page) => {
                setCurrentPage(page);
              }}
            />
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.block}>
            <div className={styles.title}>
              {t("sidebar.login_register.title")}
            </div>
            <div className={styles.hint}>
              {t("sidebar.login_register.hint")}
            </div>
            <Button
              size="large"
              block
              type="primary"
              onClick={() => {
                navigate("/signin-candidate");
              }}
            >
              {t("sidebar.login_register.button")}
            </Button>
          </div>
          <div className={styles.block}>
            <div className={styles.title}>
              {t("sidebar.company_ranking.title")}
            </div>
            <div>
              {MockCompanies.map((c) => {
                return (
                  <div key={c.id} className={styles.companyBlock}>
                    <img
                      src={`/api/logo/${c.logo}`}
                      style={{ width: "60px", height: "60px" }}
                    />
                    <div>
                      <div className={styles.companyName}>{c.name}</div>
                      <div className={styles.companyInfo}>
                        <div>{c.round}</div>
                        <div>{c.staffCount}</div>
                        <div>{c.type}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </HomeHeader>
  );
};

export default PublicJobs;
