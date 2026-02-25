import { useState, useMemo, useEffect } from "react";
import { Input, message, Spin } from "antd";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { CheckCircleFilled } from "@ant-design/icons";

import useJob from "@/hooks/useJob";
import { getQuery, updateQuery } from "@/utils";
import { Get, Post } from "@/utils/request";
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

type TMenu =
  | "jobRequirements"
  | "pipeline"
  | "sourcingChannels"
  | "outreachCampaigns"
  | "analytics"
  | "settings";

interface IProps {
  role?: "admin" | "staff";
}
const JobDetailsForAts = ({ role = "staff" }: IProps) => {
  const { job, fetchJob } = useJob();
  const [chatType, setChatType] = useState<TMenu>();
  const [jobReqSubTab, setJobReqSubTab] = useState<
    "jobRequirement" | "jobDescription"
  >("jobRequirement");
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
  const [isEditingJobName, setIsEditingJobName] = useState(false);
  const [editingJobName, setEditingJobName] = useState("");

  const navigate = useNavigate();

  const { fetchJobs } = globalStore;

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_details.${key}`);

  useEffect(() => {
    if (job?.id) {
      initTab();
    }
  }, [job?.id]);

  const tabItems: { key: TMenu; label: string }[] = useMemo(() => {
    return [
      { key: "jobRequirements", label: t("job_requirements") },
      { key: "pipeline", label: t("pipeline") },
      { key: "sourcingChannels", label: t("sourcing_channels") },
      { key: "outreachCampaigns", label: t("outreach_campaigns") },
      { key: "analytics", label: t("analytics") },
      { key: "settings", label: t("settings") },
    ];
  }, [t]);

  const initTab = async () => {
    if (!job?.id) return;

    const tab = getQuery("tab");
    const validTabs: TMenu[] = [
      "jobRequirements",
      "pipeline",
      "sourcingChannels",
      "outreachCampaigns",
      "analytics",
      "settings",
    ];
    const legacyTabMap: Record<string, TMenu> = {
      jobRequirement: "jobRequirements",
      jobDescription: "jobRequirements",
      talents: "pipeline",
    };
    const resolvedTab = legacyTabMap[tab || ""] || tab;
    if (resolvedTab && validTabs.includes(resolvedTab)) {
      setChatType(resolvedTab);
      if (tab && tab !== resolvedTab) {
        updateQuery("tab", resolvedTab);
      }
    } else {
      const { code, data } = await Get(`/api/talents?job_id=${job.id}`);
      if (
        code === 0 &&
        (data.talents.length > 0 || data.linkedin_profiles.length > 0)
      ) {
        setChatType("pipeline");
      } else {
        setChatType("jobRequirements");
      }
    }
  };

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
      <div className={styles.tabBar}>
        {tabItems.map((item) => (
          <div
            key={item.key}
            onClick={() => {
              setChatType(item.key);
              updateQuery("tab", item.key);
            }}
            className={classnames(styles.tabItem, {
              [styles.tabItemActive]: chatType === item.key,
            })}
          >
            {item.label}
          </div>
        ))}
      </div>
      <div className={styles.body}>
        {chatType === "pipeline" &&
          (role === "staff" ? (
            <TalentCards jobId={job.id} />
          ) : (
            <AdminTalents jobId={job.id} />
          ))}
        {chatType === "settings" && <JobSettings jobId={job.id} />}
        {chatType === "jobRequirements" && (
          <div className={styles.jobReqContent}>
            <div className={styles.subTabBar}>
              <div
                className={classnames(styles.subTabItem, {
                  [styles.subTabItemActive]: jobReqSubTab === "jobRequirement",
                })}
                onClick={() => setJobReqSubTab("jobRequirement")}
              >
                {t("job_requirement_table")}
              </div>
              <div
                className={classnames(styles.subTabItem, {
                  [styles.subTabItemActive]: jobReqSubTab === "jobDescription",
                })}
                onClick={() => setJobReqSubTab("jobDescription")}
              >
                {t("job_description_jd")}
              </div>
            </div>
            <JobDocument
              job={job}
              chatType={jobReqSubTab}
              key={jobReqSubTab}
              togglePostJob={togglePostJob}
              onUpdateDoc={fetchJob}
              role={role}
            />
          </div>
        )}
        {chatType === "sourcingChannels" && (
          <div className={styles.placeholder}>{t("sourcing_channels")}</div>
        )}
        {chatType === "outreachCampaigns" && (
          <div className={styles.placeholder}>{t("outreach_campaigns")}</div>
        )}
        {chatType === "analytics" && (
          <div className={styles.placeholder}>{t("analytics")}</div>
        )}
      </div>

      <JobCollaboratorModal
        open={isCollaboratorModalOpen}
        onCancel={() => setIsCollaboratorModalOpen(false)}
        jobId={job.id}
      />
    </div>
  );
};

export default JobDetailsForAts;
