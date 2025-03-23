import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { DownOutlined } from "@ant-design/icons";
import classnames from "classnames";
import { Drawer, Spin } from "antd";
import Markdown from "react-markdown";
import { v4 as uuidV4 } from "uuid";
import dayjs from "dayjs";

import ChatRoom from "../../components/ChatRoom";
import { Get } from "../../utils/request";

import styles from "./style.module.less";

type TCompany = {
  logo: string;
  name: string;
};

type TJob = {
  name: string;
  company_id: number;
  updated_at: string;
  job_description: string;
};

type TStatus = "loading" | "success" | "error";

const JobsShow = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<TCompany>();
  const [job, setJob] = useState<TJob>();
  const [status, setStatus] = useState<TStatus>("loading");
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      setJob(data.job);
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
            <img
              src={`/company-logo/${company.logo}`}
              className={styles.logo}
            />
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
                  <span>More</span>
                  <DownOutlined style={{ fontSize: 14 }} />
                </div>
              </div>
              <div
                className={classnames(styles.markdownContainer, styles.hidden)}
              >
                <Markdown>{job.job_description}</Markdown>
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
              />
            </div>
          </div>
          <Link className={styles.footer} to="/">
            Powered by Persevio.
          </Link>

          <Drawer
            title="Job Description"
            placement="bottom"
            closable={false}
            onClose={() => setDrawerOpen(false)}
            open={drawerOpen}
            height={"80vh"}
            style={{ borderRadius: "16px 16px 0 0" }}
          >
            <div className={styles.markdownContainer}>
              <Markdown>{job.job_description}</Markdown>
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
