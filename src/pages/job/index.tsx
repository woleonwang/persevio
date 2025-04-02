import { useState } from "react";
import ChatRoom from "../../components/ChatRoom";
import styles from "./style.module.less";
// import { ProfileOutlined } from "@ant-design/icons";
import Profile from "./components/Profile";
import { Tabs } from "antd";
import { useParams } from "react-router";
import JobInformation from "./components/JobInformation";
import { observer } from "mobx-react-lite";

type TTabKey = "chat" | "info" | "pipeline";
const Job = () => {
  const { jobId: jobIdStr } = useParams<{ jobId: string }>();
  const jobId = parseInt(jobIdStr ?? "0");
  const [status, setStatus] = useState<TTabKey>("chat");

  return (
    <div className={styles.container}>
      <div className={styles.jobMain}>
        {jobId && (
          <>
            <Tabs
              centered
              activeKey={status}
              items={[
                {
                  key: "chat",
                  label: "Viona",
                },
                {
                  key: "info",
                  label: "Documents",
                },
                // {
                //   key: "pipeline",
                //   label: "Pipeline",
                // },
              ]}
              onChange={(type) => setStatus(type as TTabKey)}
              className={styles.tabs}
            />
            {status === "chat" && (
              <div className={styles.chatWrapper}>
                <ChatRoom jobId={jobId} allowEditMessage role="staff" />
              </div>
            )}
            {status === "info" && (
              <div className={styles.chatWrapper}>
                <JobInformation jobId={jobId} />
              </div>
            )}
            {status === "pipeline" && (
              <div className={styles.chatWrapper}>
                <Profile jobId={jobId} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default observer(Job);
