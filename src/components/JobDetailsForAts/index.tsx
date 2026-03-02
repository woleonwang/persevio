import { useState, useEffect } from "react";
import { Input, message, Spin } from "antd";
import { Tabs as AntdTabs } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { CheckCircleFilled } from "@ant-design/icons";

import useJob from "@/hooks/useJob";
import { getQuery, updateQuery } from "@/utils";
import { Get, Post } from "@/utils/request";
import AdminTalents from "@/components/AdminTalents";

import JobSettings from "./components/JobSettings";
import JobDocument from "./components/JobDocument";
import JobOutreachCampaigns from "./components/JobOutreachCampaigns";
import JobSourcingChannels from "./components/JobSourcingChannels";
import Tabs from "../Tabs";
import styles from "./style.module.less";
import JobCollaboratorModal from "../JobCollaboratorModal";
import JobPipeline from "./components/JobPipeline";
import JobAnalytics from "./components/JobAnalytics";
import ArrowLeft from "@/assets/icons/arrow-left";
import Icon from "../Icon";
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
  const [activeTab, setActiveTab] = useState<TMenu>();
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
      setActiveTab(resolvedTab);
      if (tab && tab !== resolvedTab) {
        updateQuery("tab", resolvedTab);
      }
    } else {
      const { code, data } = await Get(`/api/talents?job_id=${job.id}`);
      if (
        code === 0 &&
        (data.talents.length > 0 || data.linkedin_profiles.length > 0)
      ) {
        setActiveTab("pipeline");
      } else {
        setActiveTab("jobRequirements");
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
      </div>
      <AntdTabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key as TMenu);
          updateQuery("tab", key);
        }}
        className={styles.tabs}
        animated={false}
        items={[
          {
            key: "jobRequirements",
            label: t("job_requirements"),
            children: (
              <div className={styles.body}>
                <div className={styles.subTabsWrap}>
                  <Tabs
                    activeKey={jobReqSubTab}
                    onChange={(key) =>
                      setJobReqSubTab(
                        key as "jobRequirement" | "jobDescription",
                      )
                    }
                    size="small"
                    tabs={[
                      {
                        key: "jobRequirement",
                        label: t("job_requirement_table"),
                      },
                      {
                        key: "jobDescription",
                        label: t("job_description_jd"),
                      },
                    ]}
                  />
                </div>
                <div style={{ fontSize: 12, color: "#999" }}>
                  <span style={{ color: "#666", fontWeight: "bold" }}>
                    Job Requirement Document
                  </span>{" "}
                  is the internal single source of truth — detailed
                  requirements, context, and nuances for internal alignment. Job
                  Description is the external-facing marketing document posted
                  to job boards to attract candidates.
                </div>
                <div className={styles.jobReqContent}>
                  <JobDocument
                    job={job}
                    chatType={jobReqSubTab}
                    key={jobReqSubTab}
                    onUpdateDoc={fetchJob}
                    role={role}
                  />
                </div>
              </div>
            ),
          },
          {
            key: "pipeline",
            label: t("pipeline"),
            children: (
              <div className={styles.body}>
                {role === "staff" ? (
                  <JobPipeline
                    onChangeTab={(tab) => {
                      setActiveTab(tab as TMenu);
                      updateQuery("tab", tab);
                    }}
                  />
                ) : (
                  <AdminTalents jobId={job.id} />
                )}
              </div>
            ),
          },
          {
            key: "sourcingChannels",
            label: t("sourcing_channels"),
            children: (
              <div className={styles.body}>
                <JobSourcingChannels togglePostJob={togglePostJob} />
              </div>
            ),
          },
          {
            key: "outreachCampaigns",
            label: t("outreach_campaigns"),
            children: (
              <div className={styles.body}>
                <JobOutreachCampaigns />
              </div>
            ),
          },
          {
            key: "analytics",
            label: t("analytics"),
            children: (
              <div className={styles.body}>
                <JobAnalytics />
              </div>
            ),
          },
          {
            key: "settings",
            label: t("settings"),
            children: (
              <div className={styles.body}>
                <JobSettings jobId={job.id} />
              </div>
            ),
          },
        ]}
      />

      <JobCollaboratorModal
        open={isCollaboratorModalOpen}
        onCancel={() => setIsCollaboratorModalOpen(false)}
        jobId={job.id}
      />
    </div>
  );
};

export default JobDetailsForAts;
