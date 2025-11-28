import { Get, Post } from "@/utils/request";
import { Button, Empty, message, Modal, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import classnames from "classnames";

import EmptyImg from "@/assets/job-applies-empty.png";
import styles from "./style.module.less";
import { useNavigate } from "react-router";
import { getJobChatbotUrl } from "@/utils";
import { useTranslation } from "react-i18next";
import Flash from "@/assets/icons/flash";
import Icon from "@/components/Icon";

interface IJobListItem extends IJob {
  total_candidates: number;
  candidates_passed_screening: number;
}

const JobList = () => {
  const [jobs, setJobs] = useState<IJobListItem[]>([]);
  const navigate = useNavigate();

  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string | number>) =>
    originalT(`job_list.${key}`, params);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { code, data } = await Get("/api/jobs?with_candidates=1");
    if (code === 0) {
      setJobs(data.jobs);
    }
  };

  const columns: ColumnsType<IJobListItem> = [
    {
      title: t("columns.id"),
      dataIndex: "id",
    },
    {
      title: t("columns.job_title"),
      dataIndex: "name",
    },
    {
      title: t("columns.post_status"),
      dataIndex: "posted_at",
      render: (postedAt: string) => {
        return postedAt ? (
          <div className={classnames(styles.tag, styles.published)}>
            {t("post_status.published")}
          </div>
        ) : (
          <div className={classnames(styles.tag, styles.unpublished)}>
            {t("post_status.unpublished")}
          </div>
        );
      },
    },
    {
      title: t("columns.post_time"),
      dataIndex: "posted_at",
      render: (postedAt: string) => {
        return dayjs(postedAt).format("YYYY-MM-DD HH:mm:ss");
      },
    },
    {
      title: t("columns.total_candidates"),
      dataIndex: "total_candidates",
    },
    {
      title: t("columns.candidates_passed_screening"),
      dataIndex: "candidates_passed_screening",
    },
    {
      title: t("columns.actions"),
      dataIndex: "action",
      render: (_, record) => {
        return (
          <div className={styles.actions}>
            <Button
              type="link"
              onClick={() => {
                Modal.confirm({
                  title: originalT("app_layout.delete_job"),
                  content: originalT("app_layout.delete_job_confirm", {
                    jobName: record.name,
                  }),
                  onOk: async () => {
                    const { code } = await Post(
                      `/api/jobs/${record.id}/destroy`
                    );
                    if (code === 0) {
                      message.success(originalT("submit_succeed"));
                      fetchJobs();
                    } else {
                      message.error(originalT("submit_failed"));
                    }
                  },
                });
              }}
            >
              {originalT("delete")}
            </Button>
            <Button
              type="link"
              onClick={() => {
                navigate(`/app/jobs/${record.id}/standard-board`);
              }}
            >
              {t("details")}
            </Button>
            {record.posted_at && (
              <Button
                type="link"
                onClick={() => {
                  window.open(
                    getJobChatbotUrl(record.id, record.jd_version?.toString())
                  );
                }}
              >
                {t("go_to_listing")}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const isEmpty = jobs.length === 0;

  return (
    <div
      className={classnames(styles.container, { [styles.isEmpty]: isEmpty })}
    >
      {jobs.length > 0 ? (
        <>
          <div className={styles.header}>
            <div className={styles.title}>{t("title")}</div>
            <Button
              type="primary"
              onClick={() => navigate("/app/entry/create-job")}
              icon={<Icon icon={<Flash />} />}
            >
              {t("create_job")}
            </Button>
          </div>
          <div className={styles.table}>
            <Table dataSource={jobs} columns={columns} rowKey="id" />
          </div>
        </>
      ) : (
        <Empty
          image={
            <img
              src={EmptyImg}
              alt={t("empty.alt_text")}
              style={{ width: "auto" }}
            />
          }
          description={
            <>
              {t("empty.description_line_1")} <br />
              {t("empty.description_line_2")}
            </>
          }
        />
      )}
    </div>
  );
};

export default JobList;
