import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { DownOutlined, CloseOutlined } from "@ant-design/icons";
import classnames from "classnames";
import { Drawer, Spin } from "antd";
import { v4 as uuidV4 } from "uuid";
import dayjs from "dayjs";

import ChatRoom from "../../components/ChatRoom";
import { Get } from "../../utils/request";

import styles from "./style.module.less";
import MarkdownContainer from "../../components/MarkdownContainer";
import { useTranslation } from "react-i18next";
import { parseJd, parseJSON } from "../../utils";
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          <div className={styles.basicInfo}>
            <div className={styles.jobName}>{job.name}</div>
            <div>
              <div>
                {job.basic_info.location.map((item) => item.city).join(", ")}
              </div>
              <div>{t(`role_type.${job.basic_info.role_type}`)}</div>
              <div>{job.basic_info.team_name}</div>
              <div>团队语言: {job.basic_info.team_lanugage}</div>
              <div>
                {(job.basic_info.employee_level ?? [])
                  .map((level) =>
                    originalT(`public_jobs.job_card.employee_level.${level}`)
                  )
                  .join("、")}
              </div>
            </div>
            <div>
              <div>
                {!!company.logo && (
                  <img
                    src={
                      company.logo.startsWith("http")
                        ? company.logo
                        : `/api/logo/${company.logo}`
                    }
                    className={styles.logo}
                  />
                )}
              </div>

              <div className={styles.companyName}>{company.name}</div>
              <div className={styles.companyName}>
                {job.job_description_json.company_introduction}
              </div>
            </div>
          </div>

          <div className={styles.body}>
            <div className={styles.left}>
              <div
                className={classnames(
                  styles.jobDescriptionContainer,
                  styles.hidden
                )}
              >
                <div>
                  <div>职位描述</div>
                  <div>
                    <MarkdownContainer
                      content={job.job_description_json.job_description}
                    />
                  </div>
                </div>
                <div>
                  <div>基本要求</div>
                  <div>
                    <MarkdownContainer
                      content={job.job_description_json.basic_requirements}
                    />
                  </div>
                </div>
                <div>
                  <div>加分项</div>
                  <div>
                    <MarkdownContainer
                      content={job.job_description_json.bonus_points}
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className={classnames(styles.updatedAt, styles.hidden)}>
                  {dayjs().diff(dayjs(job.updated_at), "days")
                    ? `${dayjs().diff(dayjs(job.updated_at), "days")} ${t(
                        "days_ago"
                      )}`
                    : t("today")}
                </div>
              </div>
            </div>
            <div className={styles.right}>
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
