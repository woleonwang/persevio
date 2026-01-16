import { useState, useMemo } from "react";
import { ShareAltOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { message, Spin } from "antd";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import useJob from "@/hooks/useJob";
import { getQuery, updateQuery } from "@/utils";
import { Post } from "@/utils/request";
import AdminTalents from "@/components/AdminTalents";

import JobSettings from "./components/JobSettings";
import JobDocument from "./components/JobDocument";
import styles from "./style.module.less";
import JobCollaboratorModal from "../JobCollaboratorModal";
import TalentCards from "../TalentCards";
import Talents from "../Talents";

type TMenu = "jobRequirement" | "jobDescription" | "talents" | "settings";

interface IProps {
  role?: "admin" | "staff";
}
const JobDetails = ({ role = "staff" }: IProps) => {
  const tab = getQuery("tab");
  const { job, fetchJob } = useJob();
  const [chatType, setChatType] = useState<TMenu>(
    (tab as TMenu) || "jobDescription"
  );
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_details.${key}`);

  const chatTypeTitle: Partial<Record<TMenu, string>> = useMemo(() => {
    return {
      jobDescription: t("job_description_jd"),
      jobRequirement: t("job_requirement_table"),
      talents: t("talents"),
      ...(role === "admin" ? { settings: t("settings") } : {}),
    };
  }, [t, role]);

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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ArrowLeftOutlined
            onClick={() =>
              role === "admin" ? navigate("/admin/jobs") : navigate("/app/jobs")
            }
          />
          <div className={styles.title}>{job.name}</div>
        </div>
        {role === "staff" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
            onClick={async () => setIsCollaboratorModalOpen(true)}
          >
            <ShareAltOutlined style={{ color: "#3682fe" }} />
            <div style={{ fontSize: 14 }}>{t("share_position")}</div>
          </div>
        )}
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
          {chatType === "talents" &&
            (role === "staff" ? (
              process.env.NODE_ENV === "development" ? (
                <TalentCards jobId={job.id} />
              ) : (
                <Talents jobId={job.id} />
              )
            ) : (
              <AdminTalents jobId={job.id} />
            ))}
          {chatType === "settings" && <JobSettings jobId={job.id} />}
          {(chatType === "jobRequirement" || chatType === "jobDescription") && (
            <JobDocument
              job={job}
              chatType={chatType}
              key={chatType}
              togglePostJob={togglePostJob}
              onUpdateDoc={fetchJob}
              role={role}
            />
          )}
        </div>
      </div>

      <JobCollaboratorModal
        open={isCollaboratorModalOpen}
        onCancel={() => setIsCollaboratorModalOpen(false)}
        jobId={job.id}
      />
    </div>
  );
};

export default JobDetails;
