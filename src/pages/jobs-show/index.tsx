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
import { parseJSON } from "../../utils";

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
};

type TStatus = "loading" | "success" | "error";

const JobsShow = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<TCompany>();
  const [job, setJob] = useState<TJob>();
  const [status, setStatus] = useState<TStatus>("loading");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { i18n } = useTranslation();
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
      data.job.job_description = data.job.job_description.replaceAll(
        /<chatbot-delete>.*<\/chatbot-delete>/g,
        ""
      );
      setJob(data.job);
      i18n.changeLanguage(data.company.lang ?? "en-US");
      setStatus("success");
    } else {
      setStatus("error");
    }
  };

  return (
    <Spin
      spinning={status === "loading"}
      style={{ height: "100vh", alignContent: "center" }}
    >
      {status === "success" && company && job && (
        <div className={styles.container}>
          <div className={styles.header}>
            {!!company.logo && (
              <img
                src={
                  company.logo.startsWith("http")
                    ? company.logo
                    : `/company-logo/${company.logo}`
                }
                className={styles.logo}
              />
            )}
          </div>
          <div className={styles.body}>
            <div className={styles.left}>
              <div className={styles.basicInfo}>
                <div className={styles.jobName}>{job.name}</div>
                <div className={styles.companyName}> Job at {company.name}</div>
                <div
                  className={styles.more}
                  onClick={() => setDrawerOpen(true)}
                >
                  <span>Click for complete JD.</span>
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
                    ? `${dayjs().diff(dayjs(job.updated_at), "days")} days ago`
                    : "Today"}
                </div>
              </div>
            </div>
            <div className={styles.right}>
              <ChatRoom
                role="candidate"
                jobId={parseInt(id ?? "0")}
                sessionId={sessionId}
                screeningQuestions={
                  parseJSON(job.screening_questions).questions ?? []
                }
              />
            </div>
          </div>
          <Link className={styles.footer} to="/">
            Powered by Persevio.
          </Link>

          <Drawer
            title={
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Job Description</span>
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
                  ? `${dayjs().diff(dayjs(job.updated_at), "days")} days ago`
                  : "Today"}
              </div>
            </div>
          </Drawer>
        </div>
      )}
    </Spin>
  );
};

export default JobsShow;
