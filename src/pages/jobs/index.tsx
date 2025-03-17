import { useEffect, useState } from "react";
import { Get } from "../../utils/request";
import ChatRoom, { TChatType } from "../../components/ChatRoom";
import styles from "./style.module.less";
import { ProfileOutlined } from "@ant-design/icons";
import Profile from "./components/Profile";
import { Button } from "antd";
import { useSearchParams } from "react-router";

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

const Jobs = () => {
  const [jobs, setJobs] = useState<TJob[]>([]);
  const [searchParams] = useSearchParams();
  const [selectedJobId, setSelectedJobId] = useState<number | undefined>(
    searchParams.get("active")
      ? parseInt(searchParams.get("active") ?? "0")
      : undefined
  );
  const [status, setStatus] = useState<"chat" | "profile">("chat");
  const [chatType, setChatType] = useState<TChatType>("jobRequirementDoc");

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
        <div className={styles.jobList}>
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => {
                setChatType("jobRequirementDoc");
                setSelectedJobId(job.id);
              }}
              className={`${styles.jobItem} ${
                selectedJobId === job.id ? styles.active : ""
              }`}
            >
              <div>{job.name}</div>
              <div onClick={() => setStatus("profile")}>
                <ProfileOutlined />
              </div>
            </div>
          ))}
        </div>
        <div className={styles.jobMain}>
          {selectedJob &&
            (status === "chat" ? (
              <ChatRoom
                jobId={selectedJob.id}
                type={chatType}
                onChangeType={(type: TChatType) => setChatType(type)}
              />
            ) : (
              <div style={{ padding: 20, flex: "auto" }}>
                <Button type="primary" onClick={() => setStatus("chat")}>
                  {" < Back "}
                </Button>
                <Profile jobId={selectedJob.id} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
