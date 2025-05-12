import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Button, Drawer, message, Spin } from "antd";
import { LeftCircleOutlined } from "@ant-design/icons";
import classnames from "classnames";

import { Get, Post } from "@/utils/request";
import { parseJd } from "@/utils";
import MarkdownContainer from "@/components/MarkdownContainer";

import styles from "./style.module.less";
import CompanyLogo from "../components/CompanyLogo";
import ChatRoom from "@/components/ChatRoom";

const RecommendedJobShow = () => {
  const [recommendedJob, setRecommendedJob] = useState<IRecommendedJob>();
  const [jd, setJd] = useState("");
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  const { recommendedJobId = "" } = useParams();

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();

  // const t = (key: string) => originalT(`recommended_jobs.${key}`);

  useEffect(() => {
    fetchRecommendedJob();
  }, []);

  const fetchRecommendedJob = async () => {
    const { code, data } = await Get(
      `/api/candidate/recommended_jobs/${recommendedJobId}`
    );
    if (code === 0) {
      setRecommendedJob(data.recommended_job);
      setJd(parseJd(data.jd));
    }
  };

  const updateStatus = async (action: "accept" | "reject") => {
    const { code } = await Post(
      `/api/candidate/recommended_jobs/${recommendedJobId}/${action}`
    );
    if (code === 0) {
      message.success(originalT("submit_succeed"));
      fetchRecommendedJob();
    } else {
      message.error(originalT("submit_failed"));
    }
  };

  if (!recommendedJob) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>{originalT("candidate_home.recommended_jobs")}</div>
        <LeftCircleOutlined
          style={{ color: "#1FAC6A", cursor: "pointer" }}
          onClick={() => navigate("/candidate/home")}
        />
      </div>
      <div className={styles.main}>
        <div className={styles.left}>
          <div className={styles.recommendedJobCard}>
            <div className={styles.basicInfo}>
              <CompanyLogo logo={recommendedJob.job.company.logo ?? ""} />
              <div>
                <div className={styles.jobName}>{recommendedJob.job.name}</div>
                <div className={styles.tags}>
                  <div className={styles.companyName}>
                    {recommendedJob.job.company.name}
                  </div>
                  {recommendedJob.status !== "INITIAL" && (
                    <div
                      className={classnames(
                        styles.status,
                        styles[recommendedJob.status.toLowerCase()]
                      )}
                    >
                      {recommendedJob.status === "ACCEPTED"
                        ? "Accepted"
                        : "Rejected"}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Button
                type="primary"
                shape="round"
                onClick={() => setChatDrawerOpen(true)}
              >
                {originalT("chat_with_viona")}
              </Button>
              {recommendedJob.status === "INITIAL" && (
                <>
                  <Button
                    style={{ marginLeft: 10 }}
                    type="primary"
                    shape="round"
                    onClick={() => updateStatus("accept")}
                  >
                    Accept
                  </Button>

                  <Button
                    style={{ marginLeft: 10 }}
                    type="primary"
                    shape="round"
                    danger
                    onClick={() => updateStatus("reject")}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className={styles.jd}>
            <MarkdownContainer content={jd} />
          </div>
        </div>
      </div>

      <Drawer
        open={chatDrawerOpen}
        width={1200}
        onClose={() => setChatDrawerOpen(false)}
        title={originalT("chat_with_viona")}
      >
        <div style={{ height: "100%", display: "flex" }}>
          <ChatRoom
            userRole="candidate"
            jobId={recommendedJob.job_id}
            sessionId={`${recommendedJob.candidate_id}`}
            disableApply
          />
        </div>
      </Drawer>
    </div>
  );
};

export default RecommendedJobShow;
