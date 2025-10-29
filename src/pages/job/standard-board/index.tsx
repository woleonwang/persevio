import { Breadcrumb, Button, message, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { RightOutlined } from "@ant-design/icons";
import classnames from "classnames";

import useJob from "@/hooks/useJob";
import { Post } from "@/utils/request";

import styles from "./style.module.less";
import ChatRoomNew from "@/components/ChatRoomNew";
import JobDetails from "./components/JobDetails";

type TJobState = "jrd" | "jd" | "preview" | "board";

const JobBoard = () => {
  const { job, fetchJob } = useJob();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_board.${key}`);

  const [jobState, setJobState] = useState<TJobState>();

  useEffect(() => {
    if (job) {
      if (job.posted_at) {
        setJobState("board");
      } else if (job.jd_doc_id) {
        setJobState("preview");
      } else if (job.requirement_doc_id) {
        setJobState("jd");
      } else {
        setJobState("jrd");
      }
    }
  }, [job]);

  if (!job) {
    return <Spin />;
  }

  const stepItems = [
    {
      title: "Create Position",
      key: "create",
    },
    {
      title: "Detailed Define<br/>Job Requirements",
      key: "jrd",
    },
    {
      title: "Define Job<br/>Description",
      key: "jd",
    },
    {
      title: "Position Preview",
      key: "preview",
    },
    {
      title: "Confirm to Publish",
      key: "confirm",
    },
  ];

  const currentIndex =
    stepItems.findIndex((step) => step.key === jobState) ?? 0;

  return (
    <div className={styles.container}>
      {jobState !== "board" && (
        <div className={styles.header}>
          <div className={styles.title}>{job.name}</div>
          <div className={styles.right}>
            <Breadcrumb
              items={stepItems}
              itemRender={(item) => {
                const itemIndex = stepItems.findIndex(
                  (step) => step.key === item.key
                );
                let status: "done" | "process" | "wait" = "wait";
                if (itemIndex < currentIndex) {
                  status = "done";
                } else if (currentIndex === itemIndex) {
                  status = "process";
                }
                return (
                  <span
                    className={classnames(styles.stepItem, styles[status])}
                    dangerouslySetInnerHTML={{ __html: item.title as string }}
                  />
                );
              }}
              separator={<RightOutlined />}
            />
          </div>
        </div>
      )}
      <div className={styles.body}>
        {jobState === "jrd" && (
          <ChatRoomNew
            chatType="jobRequirementDoc"
            jobId={job.id}
            onNextTask={() => setJobState("jd")}
            allowEditMessage={true}
          />
        )}
        {jobState === "jd" && (
          <ChatRoomNew
            chatType="jobDescription"
            jobId={job.id}
            onNextTask={() => setJobState("preview")}
            allowEditMessage={true}
          />
        )}
        {jobState === "preview" && (
          <div className={styles.previewContainer}>
            <div className={styles.previewHeader}>
              A preview of the job position has been generated. Please review
              the information carefully. Once you confirm that everything is
              correct, click the "Confirm and Post" button at the bottom of the
              page to publish the position to the Persevio recruitment website.
            </div>
            <iframe
              src={`/jobs/${job.id}/chat?preview=1`}
              style={{
                border: "1px solid #eee",
                flex: "auto",
                width: "100%",
                borderRadius: 16,
              }}
            />
            <div
              style={{
                padding: 12,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                type="primary"
                onClick={async () => {
                  const { code } = await Post(`/api/jobs/${job.id}/post_job`, {
                    open: "1",
                  });
                  if (code === 0) {
                    message.success(t("operation_success"));
                    fetchJob();
                  }
                }}
              >
                {t("post_job")}
              </Button>
            </div>
          </div>
        )}
        {jobState === "board" && (
          <JobDetails onStateChanged={() => fetchJob()} />
        )}
      </div>
    </div>
  );
};

export default JobBoard;
