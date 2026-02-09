import { useState, useMemo } from "react";
import { Input, message, Spin } from "antd";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { CheckCircleFilled } from "@ant-design/icons";

import useJob from "@/hooks/useJob";
import { getQuery, updateQuery } from "@/utils";
import { Post } from "@/utils/request";
import AdminTalents from "@/components/AdminTalents";

import JobSettings from "./components/JobSettings";
import JobDocument from "./components/JobDocument";
import styles from "./style.module.less";
import JobCollaboratorModal from "../JobCollaboratorModal";
import TalentCards from "../TalentCards";
import ArrowLeft from "@/assets/icons/arrow-left";
import Icon from "../Icon";
import Share2 from "@/assets/icons/share2";
import globalStore from "@/store/global";

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
  const [isEditingJobName, setIsEditingJobName] = useState(false);
  const [editingJobName, setEditingJobName] = useState("");

  const navigate = useNavigate();

  const { fetchJobs } = globalStore;

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

  const updateJobName = async () => {
    if (!job) return;
    const { code } = await Post(`/api/jobs/${job.id}`, {
      name: editingJobName,
    });
    if (code === 0) {
      fetchJob();
      fetchJobs();
      setIsEditingJobName(false);
    }
  };

  if (!job) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Icon
            icon={<ArrowLeft />}
            onClick={() =>
              role === "admin" ? navigate("/admin/jobs") : navigate("/app/jobs")
            }
            style={{ fontSize: 20, cursor: "pointer" }}
          />
          {isEditingJobName ? (
            <Input
              value={editingJobName}
              onChange={(e) => {
                setEditingJobName(e.target.value);
              }}
              onPressEnter={() => {
                updateJobName();
              }}
              suffix={
                <Icon
                  icon={<CheckCircleFilled style={{ color: "#3682fe" }} />}
                  onMouseDown={(e) => {
                    e.preventDefault(); // 阻止 blur，使点击 suffix 时能正常保存
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateJobName();
                  }}
                />
              }
              onBlur={() => {
                setIsEditingJobName(false);
              }}
              autoFocus
            />
          ) : (
            <div
              className={styles.title}
              onClick={() => {
                setEditingJobName(job.name);
                setIsEditingJobName(true);
              }}
            >
              {job.name}
            </div>
          )}
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
            <Icon icon={<Share2 />} style={{ color: "#3682fe" }} />
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
              <TalentCards jobId={job.id} />
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
