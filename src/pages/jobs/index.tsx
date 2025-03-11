import { useEffect, useState } from "react";
import { Get } from "../../utils/request";
import ChatRoom from "../../components/ChatRoom";
import styles from "./style.module.less";

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
  const [selectedJobId, setSelectedJobId] = useState<number>();

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
      <div className={styles.header}>Jobs</div>
      <div className={styles.body}>
        <div className={styles.jobList}>
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJobId(job.id)}
              className={`${styles.jobItem} ${
                selectedJobId === job.id ? styles.active : ""
              }`}
            >
              {job.name}
            </div>
          ))}
        </div>
        <div className={styles.jobMain}>
          {selectedJobId && (
            <ChatRoom jobId={selectedJobId} type="job_requirement" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
