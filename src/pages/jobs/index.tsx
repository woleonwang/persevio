import { useEffect, useState } from "react";
import { Get } from "../../utils/request";
import ChatRoom from "../../components/ChatRoom";
import styles from "./style.module.less";
// import { ProfileOutlined } from "@ant-design/icons";
import Profile from "./components/Profile";
import { Tabs } from "antd";
import { useSearchParams } from "react-router";
import JobInformation from "./components/JobInformation";
import { observer } from "mobx-react-lite";
import globalStore from "../../store/global";

type TJob = {
  id: number;
  company_id: number;
  staff_id: number;

  name: string;
  requirement_doc_id: number;
  jd_doc_id: number;
  status: number;
  created_at: string;
  updated_at: string;
};

type TTabKey = "chat" | "info" | "pipeline";
const Jobs = () => {
  const [jobs, setJobs] = useState<TJob[]>([]);
  const [searchParams] = useSearchParams();
  const [selectedJobId, setSelectedJobId] = useState<number | undefined>(
    searchParams.get("active")
      ? parseInt(searchParams.get("active") ?? "0")
      : undefined
  );
  const [status, setStatus] = useState<TTabKey>("chat");
  const { collapseForDrawer } = globalStore;

  const selectedJob = jobs.find((item) => item.id === selectedJobId);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { code, data } = await Get("/api/jobs");
    if (code === 0) {
      setJobs(data.jobs);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <div
          className={styles.jobList}
          style={{ display: collapseForDrawer ? "none" : "block" }}
        >
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => {
                setSelectedJobId(job.id);
                setStatus("chat");
              }}
              className={`${styles.jobItem} ${
                selectedJobId === job.id ? styles.active : ""
              }`}
            >
              <div>{job.name}</div>
              {/* <div onClick={() => setStatus("profile")}>
                <ProfileOutlined />
              </div> */}
            </div>
          ))}
        </div>
        <div className={styles.jobMain}>
          {selectedJob && (
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
                    label: "Info",
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
                  <ChatRoom
                    jobId={selectedJob.id}
                    allowEditMessage
                    role="staff"
                  />
                </div>
              )}
              {status === "info" && (
                <div className={styles.chatWrapper}>
                  <JobInformation jobId={selectedJob.id} />
                </div>
              )}
              {status === "pipeline" && (
                <div className={styles.chatWrapper}>
                  <Profile jobId={selectedJob.id} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default observer(Jobs);
