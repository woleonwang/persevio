import { useEffect, useState } from "react";
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
};
const JobChat = () => {
  const { jobId: jobIdStr, chatType = "job-requirement" } = useParams<{
    jobId: string;
    chatType: "job-requirement";
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
            <div style={{ flex: "none" }}>
              {job.name} -{" "}
              {chatType === "job-requirement" ? "详细定义职位需求" : ""}
            </div>
            <div className={styles.chatWrapper}>
              <ChatRoomNew
                jobId={jobId}
                allowEditMessage
                userRole="staff"
                chatType={chatTypeMappings[chatType] as TChatType}
                onChangeTab={(tab, options) => {
                  // TODO
                  navigate("");
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
