import { useState, useMemo, useEffect } from "react";
import { Button, Input, message, Spin } from "antd";
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
import ConsultantCandidates from "./components/ConsultantCandidates";
import ConsultantCompany from "./components/ConsultantCompany";
import ConsultantVionaChat from "./components/ConsultantVionaChat";
import styles from "./style.module.less";
import JobCollaboratorModal from "../JobCollaboratorModal";
import TalentCards from "../TalentCards";
import ArrowLeft from "@/assets/icons/arrow-left";
import Icon from "../Icon";
import Share2 from "@/assets/icons/share2";
import globalStore from "@/store/global";

type TMenu =
  | "jobRequirement"
  | "jobDescription"
  | "talents"
  | "settings"
  | "consultantCandidates"
  | "consultantCompany"
  | "consultantViona";

interface IProps {
  role?: "admin" | "staff";
}
const JobDetails = ({ role = "staff" }: IProps) => {
  const { job, fetchJob } = useJob();
  const [chatType, setChatType] = useState<TMenu>();
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
  const [isEditingJobName, setIsEditingJobName] = useState(false);
  const [editingJobName, setEditingJobName] = useState("");
  // hunter (2) and super admin (1) both see the consultant workspace tabs
  const [showConsultantWorkspace, setShowConsultantWorkspace] = useState(false);

  const navigate = useNavigate();

  const { fetchJobs } = globalStore;

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_details.${key}`);

  useEffect(() => {
    if (role === "admin") {
      fetchAdminRole();
    }
  }, [role]);

  useEffect(() => {
    if (job?.id) {
      initTab();
    }
  }, [job?.id, showConsultantWorkspace]);

  const fetchAdminRole = async () => {
    const { code, data } = await Get<ISettings>("/api/settings");
    if (code === 0) {
      setShowConsultantWorkspace(data.is_admin === 1 || data.is_admin === 2);
    }
  };

  const chatTypeTitle: Partial<Record<TMenu, string>> = useMemo(() => {
    if (role === "admin" && showConsultantWorkspace) {
      return {
        consultantCandidates: "Candidates",
        jobRequirement: t("job_requirement_table"),
        jobDescription: t("job_description_jd"),
        consultantCompany: "Company",
        consultantViona: "Viona",
        talents: t("talents"),
        settings: t("settings"),
      };
    }
    return {
      jobDescription: t("job_description_jd"),
      jobRequirement: t("job_requirement_table"),
      talents: t("talents"),
      ...(role === "admin" ? { settings: t("settings") } : {}),
    };
  }, [t, role, showConsultantWorkspace]);

  const initTab = async () => {
    if (!job?.id) return;

    const tab = getQuery("tab");
    if (tab) {
      setChatType(tab as TMenu);
      return;
    }

    if (role === "admin" && showConsultantWorkspace) {
      setChatType("consultantCandidates");
      updateQuery("tab", "consultantCandidates");
      return;
    }

    const { code, data } = await Get(
      `/api/talents?job_id=${job.invitation_token}`,
    );
    if (
      code === 0 &&
      (data.talents.length > 0 || data.linkedin_profiles.length > 0)
    ) {
      setChatType("talents");
    } else {
      setChatType("jobDescription");
    }
  };

  const switchTab = (next: TMenu) => {
    setChatType(next);
    updateQuery("tab", next);
  };

  const togglePostJob = async () => {
    if (!job) return;

    const { code } = await Post(`/api/jobs/${job.invitation_token}/post_job`, {
      open: job.posted_at ? "0" : "1",
    });

    if (code === 0) {
      message.success(originalT("submit_succeed"));
      fetchJob();
    }
  };

  const updateJobName = async () => {
    if (!job) return;
    const { code } = await Post(`/api/jobs/${job.invitation_token}`, {
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

  const showHunterWorkspace =
    role === "admin" && showConsultantWorkspace;

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
                    e.preventDefault();
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
                  switchTab(item as TMenu);
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
              <TalentCards jobId={job.invitation_token} />
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
          {showHunterWorkspace && chatType === "consultantCandidates" && (
            <ConsultantCandidates jobId={job.id} />
          )}
          {showHunterWorkspace && chatType === "consultantCompany" && (
            <ConsultantCompany jobId={job.id} />
          )}
          {/* Keep Viona mounted so chat state survives tab switches */}
          {showHunterWorkspace && (
            <div
              className={styles.vionaPanel}
              style={{
                display: chatType === "consultantViona" ? "flex" : "none",
              }}
            >
              <ConsultantVionaChat
                jobId={job.id}
                active={chatType === "consultantViona"}
              />
            </div>
          )}
        </div>
      </div>

      {showHunterWorkspace && chatType !== "consultantViona" && (
        <Button
          type="primary"
          className={styles.vionaFab}
          onClick={() => switchTab("consultantViona")}
        >
          Viona
        </Button>
      )}

      <JobCollaboratorModal
        open={isCollaboratorModalOpen}
        onCancel={() => setIsCollaboratorModalOpen(false)}
        jobId={job.invitation_token}
      />
    </div>
  );
};

export default JobDetails;
