import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Spin } from "antd";
import { Get } from "@/utils/request";
import { getQuery, deleteQuery } from "@/utils";
import { tokenStorage } from "@/utils/storage";
import CandidateChat from "@/components/CandidateChat";
import styles from "./style.module.less";

const InterviewChat = () => {
  const { jobApplyId } = useParams<{ jobApplyId: string }>();
  const [inited, setInited] = useState(false);

  useEffect(() => {
    const token = getQuery("candidate_token");
    if (token) {
      tokenStorage.setToken(token, "candidate");
      deleteQuery("candidate_token");
    }
    Get("/api/candidate/settings").then(({ code }) => {
      if (code === 0) setInited(true);
    });
  }, []);

  if (!inited) return <Spin style={{ display: "block", marginTop: "40vh" }} />;

  return (
    <div className={styles.page}>
      <CandidateChat
        chatType="job_interview"
        jobApplyId={Number(jobApplyId)}
      />
    </div>
  );
};

export default InterviewChat;
