import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button, Modal, Spin } from "antd";
import { v4 as uuidV4 } from "uuid";
import dayjs from "dayjs";
import classnames from "classnames";

import ChatRoom from "../../components/ChatRoom";
import { Get, Post } from "../../utils/request";

import styles from "./style.module.less";
import MarkdownContainer from "../../components/MarkdownContainer";
import { useTranslation } from "react-i18next";
import { parseJSON } from "../../utils";
import HomeHeader from "@/components/HomeHeader";
import VionaAvatar from "@/assets/viona-avatar.png";

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
  const [isCompanyDescriptionExpanded, setIsCompanyDescriptionExpanded] =
    useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);

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

  const ApplyButton = (
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
      {t("apply_now")}
    </Button>
  );

  const ChatRoomArea = (
    <ChatRoom
      userRole="candidate"
      jobId={parseInt(id ?? "0")}
      sessionId={sessionId}
    />
  );

  return (
    <HomeHeader className={styles.headerContainer}>
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
                        ? `${dayjs().diff(dayjs(job.updated_at), "hours")}${t(
                            "hours_ago"
                          )}`
                        : `${dayjs().diff(dayjs(job.updated_at), "days")}${t(
                            "days_ago_posted"
                          )}`}
                    </span>
                  </div>

                  <div className={styles.jobAttributes}>
                    <div className={styles.attributeItem}>
                      <span className={styles.attributeIcon}>◎</span>
                      <span>
                        {job.basic_info.location
                          .map((item) => item.city)
                          .join(", ")}
                      </span>
                    </div>
                    <div className={styles.attributeItem}>
                      <span className={styles.attributeIcon}>◎</span>
                      <span>
                        {originalT(
                          `public_jobs.job_card.role_type.${job.basic_info.role_type}`
                        )}
                      </span>
                    </div>
                    <div className={styles.attributeItem}>
                      <span className={styles.attributeIcon}>◎</span>
                      <span>{job.basic_info.team_name}</span>
                    </div>
                    <div className={styles.attributeItem}>
                      <span className={styles.attributeIcon}>◎</span>
                      <span>
                        {t("team_language")}: {job.basic_info.team_lanugage}
                      </span>
                    </div>
                    <div className={styles.attributeItem}>
                      <span className={styles.attributeIcon}>◎</span>
                      <span>
                        {(job.basic_info.employee_level ?? [])
                          .map((level) =>
                            originalT(
                              `public_jobs.job_card.employee_level.${level}`
                            )
                          )
                          .join("、")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.bannerRight}>{ApplyButton}</div>
              </div>
              <div className={styles.companySection}>
                <div className={styles.companyLeft}>
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
                </div>
                <div className={styles.companyRight}>
                  <div className={styles.companyName}>{company.name}</div>
                  <div className={styles.companyDescription}>
                    {isCompanyDescriptionExpanded
                      ? job.job_description_json.company_introduction
                      : `${job.job_description_json.company_introduction.slice(
                          0,
                          100
                        )}${
                          job.job_description_json.company_introduction.length >
                          100
                            ? "..."
                            : ""
                        }`}
                    {!isCompanyDescriptionExpanded && (
                      <span
                        className={styles.expandLink}
                        onClick={() =>
                          setIsCompanyDescriptionExpanded(
                            !isCompanyDescriptionExpanded
                          )
                        }
                      >
                        展开
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.mobileVisible}>{ApplyButton}</div>
            </div>
          </div>

          {/* 主要内容区域：JD和聊天框水平布局 */}
          <div className={styles.mainContent}>
            <div className={styles.left}>
              <div className={styles.jobDescriptionSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.greenBar}></div>
                  <span>{t("job_description_section")}</span>
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
                  <span>{t("basic_requirements")}</span>
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
                  <span>{t("bonus_points")}</span>
                </div>
                <div className={styles.sectionContent}>
                  <MarkdownContainer
                    content={job.job_description_json.bonus_points}
                  />
                </div>
              </div>
            </div>

            <div className={classnames(styles.right, styles.desktopVisible)}>
              {ChatRoomArea}
            </div>
          </div>

          <div className={classnames(styles.mobileVisible, styles.vionaAvatar)}>
            <img
              src={VionaAvatar}
              style={{ width: 50, height: 50 }}
              onClick={() => setChatModalVisible(true)}
            />
          </div>

          <div className={styles.mobileVisible}>
            <Modal
              title={false}
              footer={false}
              open={chatModalVisible}
              onCancel={() => setChatModalVisible(false)}
              styles={{
                content: {
                  height: "80vh",
                  overflow: "hidden",
                  padding: 0,
                  display: "flex",
                },
                body: { display: "flex", height: "100%" },
              }}
              style={{ top: "5vh" }}
              closeIcon={false}
            >
              {ChatRoomArea}
            </Modal>
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
