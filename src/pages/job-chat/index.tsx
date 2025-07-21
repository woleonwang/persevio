import { useEffect } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import styles from "./style.module.less";
import { useNavigate, useParams } from "react-router";
import { observer } from "mobx-react-lite";
import globalStore from "../../store/global";
import ChatRoomNew from "@/components/ChatRoomNew";
import { TChatType } from "@/components/ChatRoomNew/type";
import useJob from "@/hooks/useJob";
import { Spin } from "antd";

const chatTypeMappings = {
  "job-requirement": "jobRequirementDoc",
  "job-description": "jobDescription",
  "job-interview-plan": "jobInterviewPlan",
};

const JobChat = () => {
  const { chatType = "job-requirement" } = useParams<{
    chatType: "job-requirement" | "job-description" | "job-interview-plan";
  }>();

  const { job } = useJob();

  const { setMenuCollapse } = globalStore;

  const navigate = useNavigate();

  // const { t: originalT } = useTranslation();
  // const t = (key: string) => originalT(`job.${key}`);

  useEffect(() => {
    setMenuCollapse(true);
  }, []);

  const chatTypeTitle = {
    "job-requirement": "详细定义职位需求",
    "job-description": "定义 JD",
    "job-interview-plan": "定义面试计划&评分卡",
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
          <ChatRoomNew
            key={chatType}
            jobId={job.id}
            allowEditMessage
            userRole="staff"
            chatType={chatTypeMappings[chatType] as TChatType}
            viewDoc={(docType: string) => {
              // TODO
              navigate(docType);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default observer(JobChat);
