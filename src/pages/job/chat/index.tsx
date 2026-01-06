import { useEffect } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import { observer } from "mobx-react-lite";
import { Spin } from "antd";
import { useTranslation } from "react-i18next";

import globalStore from "@/store/global";
import StaffChat from "@/components/StaffChat";
import { TChatType } from "@/components/StaffChat/type";
import useJob from "@/hooks/useJob";

import styles from "./style.module.less";

const chatTypeMappings = {
  "job-requirement": "jobRequirementDoc",
  "job-description": "jobDescription",
  "job-compensation-details": "jobCompensationDetails",
  "job-outreach-message": "jobOutreachMessage",
  "job-interview-plan": "jobInterviewPlan",
};

const JobChat = () => {
  const { chatType = "job-requirement" } = useParams<{
    chatType:
      | "job-requirement"
      | "job-description"
      | "job-compensation-details"
      | "job-outreach-message"
      | "job-interview-plan";
  }>();

  const { job } = useJob();

  const { setMenuCollapse } = globalStore;

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_chat.${key}`);

  useEffect(() => {
    setMenuCollapse(true);
  }, []);

  const chatTypeTitle = {
    "job-requirement": t("detailed_define_job_requirement"),
    "job-description": t("define_jd"),
    "job-compensation-details": t("define_compensation_details"),
    "job-outreach-message": t("define_outreach_message"),
    "job-interview-plan": t("define_interview_plan"),
  };

  if (!job) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.jobMain}>
        <div
          style={{
            flex: "none",
            padding: "12px 0",
            textAlign: "center",
            position: "relative",
          }}
        >
          <ArrowLeftOutlined
            style={{
              position: "absolute",
              left: 18,
              top: 18,
              fontSize: 20,
              cursor: "pointer",
            }}
            onClick={() => {
              navigate(`/app/jobs/${job.id}/board`);
            }}
          />
          <span style={{ fontSize: 20, fontWeight: "bold" }}>{job.name}</span> -{" "}
          {chatTypeTitle[chatType]}
        </div>
        <div className={styles.chatWrapper}>
          <StaffChat
            key={chatType}
            jobId={job.id}
            allowEditMessage
            userRole="staff"
            chatType={chatTypeMappings[chatType] as TChatType}
            viewDoc={(docType: string) => {
              navigate(`/app/jobs/${job.id}/document/${docType}`);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default observer(JobChat);
