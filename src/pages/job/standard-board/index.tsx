import { Breadcrumb, Button, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { CheckCircleFilled, RightOutlined } from "@ant-design/icons";
import classnames from "classnames";

import useJob from "@/hooks/useJob";
import { Post } from "@/utils/request";

import styles from "./style.module.less";
import StaffChat from "@/components/StaffChat";
import globalStore from "@/store/global";
import { infoModal } from "@/utils";
import JobDetailsForAts from "@/components/JobDetailsForAts";

type TJobState = "jrd" | "jd" | "preview" | "board";

const JobBoard = () => {
  const { job, fetchJob } = useJob();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_board.${key}`);

  const [jobState, setJobState] = useState<TJobState>();

  const { setMenuCollapse } = globalStore;

  useEffect(() => {
    if (job) {
      if (job.initial_posted_at) {
        setJobState("board");
      } else if (job.jd_doc_id) {
        setJobState("preview");
      } else if (job.requirement_doc_id) {
        setJobState("jd");
        setMenuCollapse(true);
      } else {
        setJobState("jrd");
        setMenuCollapse(true);
      }
    } else {
      setJobState(undefined);
    }
  }, [job]);

  if (!job) {
    return <Spin />;
  }

  const stepItems = [
    {
      title: t("step_create_new_job"),
      key: "create",
    },
    {
      title: t("step_job_intake"),
      key: "jrd",
    },
    {
      title: t("step_draft_jd"),
      key: "jd",
    },
    {
      title: t("step_preview"),
      key: "preview",
    },
    {
      title: t("step_publish"),
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
                  <div className="flex-center">
                    {status === "done" && (
                      <CheckCircleFilled
                        style={{
                          color: "rgba(54, 198, 141, 1)",
                          fontSize: 18,
                          marginRight: 8,
                        }}
                      />
                    )}
                    <span
                      className={classnames(styles.stepItem, styles[status])}
                      dangerouslySetInnerHTML={{ __html: item.title as string }}
                    />
                  </div>
                );
              }}
              separator={<RightOutlined />}
            />
          </div>
        </div>
      )}
      <div className={styles.body}>
        {jobState === "jrd" && (
          <StaffChat
            chatType="jobRequirementDoc"
            jobId={job.id}
            onNextTask={() => setJobState("jd")}
            key={`jrd-${job.id}`}
            newVersion
          />
        )}
        {jobState === "jd" && (
          <StaffChat
            chatType="jobDescription"
            jobId={job.id}
            onNextTask={() => setJobState("preview")}
            key={`jd-${job.id}`}
            newVersion
          />
        )}
        {jobState === "preview" && (
          <div className={styles.previewContainer}>
            <div className={styles.previewHeader}>
              {t("preview_description")}
            </div>
            <iframe
              src={`/jobs/${job.id}/chat/${job.jd_version}?preview=1`}
              style={{
                border: "1px solid #eee",
                flex: "auto",
                width: "100%",
                borderRadius: 16,
              }}
            />
            <div
              style={{
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
                    infoModal({
                      title: t("published_successfully"),
                      content: t("published_success_content"),
                      okText: t("go_to_job_details_page"),
                      onOk: async () => {
                        fetchJob();
                      },
                    });
                  }
                }}
              >
                {t("post_job")}
              </Button>
            </div>
          </div>
        )}
        {jobState === "board" && (
          <div className={styles.boardContent}>
            <JobDetailsForAts />
          </div>
        )}
      </div>
    </div>
  );
};

export default JobBoard;
