import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import classnames from "classnames";
import { Button, Spin } from "antd";
import { v4 as uuidV4 } from "uuid";
import dayjs from "dayjs";

import ChatRoom from "../../components/ChatRoom";
import { Get, Post } from "../../utils/request";

import styles from "./style.module.less";
import MarkdownContainer from "../../components/MarkdownContainer";
import { useTranslation } from "react-i18next";
import { parseJSON } from "../../utils";
import HomeHeader from "@/components/HomeHeader";

type TCompany = {
  logo: string;
  name: string;
  lang: string;
};

type TJobDescription = {
  company_introduction: string; // 公司简介，纯文本格式
  job_description: string; // 职位描述，支持 markdown 格式
  basic_requirements: string; // 基本要求，支持 markdown 格式
  bonus_points: string; // 加分项，支持 markdown 格式
};

type TJob = {
  name: string;
  company_id: number;
  updated_at: string;
  job_description: string;
  job_description_json: TJobDescription;
  screening_questions: string;
  basic_info: TJobBasicInfo;
};

type TStatus = "loading" | "success" | "error";

const JobsShow = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<TCompany>();
  const [job, setJob] = useState<TJob>();
  const [status, setStatus] = useState<TStatus>("loading");

  const navigate = useNavigate();

  const { i18n, t: originalT } = useTranslation();
  const t = (key: string) => originalT(`jobs_show.${key}`);

  useEffect(() => {
    fetchJob();
  }, []);

  const sessionId = useMemo(() => {
    let value = localStorage.getItem("sessionId");
    if (!value) {
      value = uuidV4();
      localStorage.setItem("sessionId", value);
    }

    return value;
  }, []);

  const fetchJob = async () => {
    const { code, data } = await Get(`/api/public/jobs/${id}`);
    if (code === 0) {
      setCompany(data.company);
      setJob({
        ...data.job,
        basic_info: parseJSON(data.job.basic_info),
        job_description_json: parseJSON(data.job.job_description_json),
      });
      i18n.changeLanguage(data.company.lang ?? "en-US");
      setStatus("success");
    } else {
      setStatus("error");
    }
  };

  if (status === "loading") {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin spinning />
      </div>
    );
  }

  return (
    <HomeHeader
      style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {status === "success" && company && job && (
        <div className={styles.container}>
          {/* Banner 区域 */}
          <div className={styles.banner}>
            <div className={styles.bannerContent}>
              <div className={styles.bannerHeader}>
                <div className={styles.bannerLeft}>
                  <div className={styles.jobTitleSection}>
                    <h1 className={styles.jobTitle}>{job.name}</h1>
                    <span className={styles.postedTime}>
                      {dayjs().diff(dayjs(job.updated_at), "hours") < 24
                        ? `${dayjs().diff(dayjs(job.updated_at), "hours")}小时前发布`
                        : `${dayjs().diff(dayjs(job.updated_at), "days")}天前发布`}
                    </span>
                  </div>

                  <div className={styles.jobAttributes}>
                    <div className={styles.attributeItem}>
                      <span className={styles.attributeIcon}>◎</span>
                      <span>{job.basic_info.location.map((item) => item.city).join(", ")}</span>
                    </div>
                    <div className={styles.attributeItem}>
                      <span className={styles.attributeIcon}>●</span>
                      <span>完全在办公室工作</span>
                    </div>
                    <div className={styles.attributeItem}>
                      <span className={styles.attributeIcon}>●</span>
                      <span>{job.basic_info.team_name}</span>
                    </div>
                    <div className={styles.attributeItem}>
                      <span className={styles.attributeIcon}>④</span>
                      <span>团队语言: {job.basic_info.team_lanugage}</span>
                    </div>
                    <div className={styles.attributeItem}>
                      <span className={styles.attributeIcon}>●</span>
                      <span>
                        {(job.basic_info.employee_level ?? [])
                          .map((level) =>
                            originalT(`public_jobs.job_card.employee_level.${level}`)
                          )
                          .join("、")}
                      </span>
                    </div>
                  </div>

                  <div className={styles.companySection}>
                    <div className={styles.companyHeader}>
                      {!!company.logo && (
                        <img
                          src={
                            company.logo.startsWith("http")
                              ? company.logo
                              : `/api/logo/${company.logo}`
                          }
                          className={styles.logo}
                          alt={company.name}
                        />
                      )}
                      <span className={styles.companyName}>{company.name}</span>
                    </div>
                    <div className={styles.companyDescription}>
                      {job.job_description_json.company_introduction}
                      <span className={styles.expandLink}>展开</span>
                    </div>
                  </div>
                </div>

                <div className={styles.bannerRight}>
                  <Button
                    type="primary"
                    size="large"
                    className={styles.applyButton}
                    onClick={async () => {
                      const { code } = await Post("/api/candidate/job_applies", {
                        job_id: id,
                      });
                      if (code === 10001) {
                        navigate(`/signin-candidate?job_id=${id}`);
                      } else {
                        navigate(`/candidate/job-applies`);
                      }
                    }}
                  >
                    立即申请
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 主要内容区域：JD和聊天框水平布局 */}
          <div className={styles.mainContent}>
            <div className={styles.left}>
              <div className={styles.jobDescriptionSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.greenBar}></div>
                  <span>职位描述</span>
                </div>
                <div className={styles.sectionContent}>
                  <MarkdownContainer
                    content={job.job_description_json.job_description}
                  />
                </div>
              </div>

              <div className={styles.jobDescriptionSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.greenBar}></div>
                  <span>基本要求</span>
                </div>
                <div className={styles.sectionContent}>
                  <MarkdownContainer
                    content={job.job_description_json.basic_requirements}
                  />
                </div>
              </div>

              <div className={styles.jobDescriptionSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.greenBar}></div>
                  <span>加分项</span>
                </div>
                <div className={styles.sectionContent}>
                  <MarkdownContainer
                    content={job.job_description_json.bonus_points}
                  />
                </div>
              </div>
            </div>

            <div className={styles.right}>
              <div className={styles.chatHeader}>
                <div className={styles.chatTitle}>Viona, your application copilot</div>
              </div>
              <ChatRoom
                userRole="candidate"
                jobId={parseInt(id ?? "0")}
                sessionId={sessionId}
              />
            </div>
          </div>
          
          <Link className={styles.footer} to="/">
            {t("powered_by_persevio")}
          </Link>
        </div>
      )}
    </HomeHeader>
  );
};

export default JobsShow;
