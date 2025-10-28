import { useState, useMemo } from "react";
import { ExportOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import classnames from "classnames";
import { useTranslation } from "react-i18next";

import useJob from "@/hooks/useJob";

import Talents from "./components/Talents";
import styles from "./style.module.less";
import JobDocument from "./components/JobDocument";

type TMenu = "jobRequirement" | "jobDescription" | "talents";
const JobDetails = () => {
  const { job } = useJob();
  const [chatType, setChatType] = useState<TMenu>("jobRequirement");

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_details.${key}`);

  const chatTypeTitle: Record<TMenu, string> = useMemo(
    () => ({
      jobRequirement: t("job_requirement_table"),
      jobDescription: t("job_description_jd"),
      talents: t("talents"),
    }),
    [t]
  );

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
            color: "#3682fe",
            cursor: "pointer",
          }}
          onClick={async () => {
            window.open(`${window.origin}/jobs/${job.id}/chat`);
          }}
        >
          <ExportOutlined />
          <div>{t("recruitment_chatbot")}</div>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.left}>
          {Object.keys(chatTypeTitle).map((item) => {
            return (
              <div
                onClick={() => {
                  setChatType(item as TMenu);
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
            <JobDocument job={job} chatType={chatType} key={chatType} />
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
