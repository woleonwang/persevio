import { useEffect, useState } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import styles from "./style.module.less";
import { message } from "antd";
import { useNavigate, useParams } from "react-router";
import { observer } from "mobx-react-lite";
import globalStore from "../../store/global";
import { Get } from "@/utils/request";
import ChatRoomNew from "@/components/ChatRoomNew";
import { TChatType } from "@/components/ChatRoomNew/type";

const chatTypeMappings = {
  "job-requirement": "jobRequirementDoc",
  "job-description": "jobDescription",
  "job-interview-plan": "jobInterviewPlan",
};

const JobChat = () => {
  const { jobId: jobIdStr, chatType = "job-requirement" } = useParams<{
    jobId: string;
    chatType: "job-requirement" | "job-description" | "job-interview-plan";
  }>();
  const jobId = parseInt(jobIdStr ?? "0");

  const [job, setJob] = useState<IJob>();

  const { setMenuCollapse } = globalStore;

  const navigate = useNavigate();

  // const { t: originalT } = useTranslation();
  // const t = (key: string) => originalT(`job.${key}`);

  useEffect(() => {
    setMenuCollapse(true);
    fetchJob();
  }, []);

  const chatTypeTitle = {
    "job-requirement": "详细定义职位需求",
    "job-description": "定义 JD",
    "job-interview-plan": "定义面试计划&评分卡",
  };

  const fetchJob = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}`);

    if (code === 0) {
      const job: IJob = data.job ?? data;
      setJob(job);
    } else {
      message.error("Get job failed");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.jobMain}>
        {job && (
          <>
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
                  navigate(`/app/jobs/${jobId}/board`);
                }}
              />
              <span style={{ fontSize: 20, fontWeight: "bold" }}>
                {job.name}
              </span>{" "}
              - {chatTypeTitle[chatType]}
            </div>
            <div className={styles.chatWrapper}>
              <ChatRoomNew
                key={chatType}
                jobId={jobId}
                allowEditMessage
                userRole="staff"
                chatType={chatTypeMappings[chatType] as TChatType}
                viewDoc={(docType: string) => {
                  // TODO
                  navigate(docType);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default observer(JobChat);
