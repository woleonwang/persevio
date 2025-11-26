import { useState, useMemo } from "react";
import { ShareAltOutlined } from "@ant-design/icons";
import { message, Spin } from "antd";
import classnames from "classnames";
import { useTranslation } from "react-i18next";

import useJob from "@/hooks/useJob";

import Talents from "./components/Talents";
import styles from "./style.module.less";
import JobDocument from "./components/JobDocument";
import { copy, getQuery, updateQuery } from "@/utils";
import { Post } from "@/utils/request";

type TMenu = "jobRequirement" | "jobDescription" | "talents";
const JobDetails = () => {
  const tab = getQuery("tab");
  const { job, fetchJob } = useJob();
  const [chatType, setChatType] = useState<TMenu>(
    (tab as TMenu) || "jobDescription"
  );

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_details.${key}`);

  const chatTypeTitle: Record<TMenu, string> = useMemo(
    () => ({
      jobDescription: t("job_description_jd"),
      jobRequirement: t("job_requirement_table"),
      talents: t("talents"),
    }),
    [t]
  );

  const togglePostJob = async () => {
    if (!job) return;

    const { code } = await Post(`/api/jobs/${job.id}/post_job`, {
      open: job.posted_at ? "0" : "1",
    });

    if (code === 0) {
      message.success(originalT("submit_succeed"));
      fetchJob();
    }
  };

  if (!job) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>{job.name}</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
          }}
          onClick={async () => {
            await copy(
              `${window.origin}/app/jobs/${
                job.id
              }/standard-board?token=${localStorage.getItem("token")}`
            );
            message.success(originalT("copied"));
          }}
        >
          <ShareAltOutlined style={{ color: "#3682fe" }} />
          <div style={{ fontSize: 14 }}>{t("share_position")}</div>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.left}>
          {Object.keys(chatTypeTitle).map((item) => {
            return (
              <div
                onClick={() => {
                  setChatType(item as TMenu);
                  updateQuery("tab", item);
                }}
                className={classnames(styles.menuItem, {
                  [styles.active]: chatType === item,
                })}
                key={item}
              >
                {chatTypeTitle[item as TMenu]}
              </div>
            );
          })}
        </div>
        <div className={styles.right}>
          {chatType === "talents" ? (
            <Talents jobId={job.id} />
          ) : (
            <JobDocument
              job={job}
              chatType={chatType}
              key={chatType}
              togglePostJob={togglePostJob}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
