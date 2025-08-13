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

type TJob = {
  name: string;
  company_id: number;
  updated_at: string;
  job_description: string;
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
        job_description: parseJd(data.job.job_description),
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
            <div className={styles.jobName}>{job.name}</div>
            <div className={styles.companyName}>
              {t("job_at")} {company.name}
            </div>
            <div className={styles.more} onClick={() => setDrawerOpen(true)}>
              <span>{t("click_for_complete_jd")}</span>
              <DownOutlined style={{ fontSize: 14 }} />
            </div>
          </div>

          <div className={styles.body}>
            <div className={styles.left}>
              <div className={styles.basicInfo}>
                <div className={styles.jobName}>{job.name}</div>
                <div className={styles.companyName}>
                  {" "}
                  {t("job_at")} {company.name}
                </div>
                <div
                  className={styles.more}
                  onClick={() => setDrawerOpen(true)}
                >
                  <span>{t("click_for_complete_jd")}</span>
                  <DownOutlined style={{ fontSize: 14 }} />
                </div>
              </div>
              <div
                className={classnames(
                  styles.jobDescriptionContainer,
                  styles.hidden
                )}
              >
                <MarkdownContainer content={job.job_description} />
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

          <Drawer
            title={
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{t("job_description")}</span>
                <CloseOutlined onClick={() => setDrawerOpen(false)} />
              </div>
            }
            placement="bottom"
            closable={false}
            onClose={() => setDrawerOpen(false)}
            open={drawerOpen}
            height={"80vh"}
            style={{ borderRadius: "16px 16px 0 0" }}
          >
            <div className={styles.jobDescriptionContainer}>
              <MarkdownContainer content={job.job_description} />
            </div>
            <div>
              <div className={classnames(styles.updatedAt)}>
                {dayjs().diff(dayjs(job.updated_at), "days")
                  ? `${dayjs().diff(dayjs(job.updated_at), "days")} ${t(
                      "days_ago"
                    )}`
                  : t("today")}
              </div>
            </div>
          </Drawer>
        </div>
      )}
    </HomeHeader>
  );
};

export default JobsShow;
