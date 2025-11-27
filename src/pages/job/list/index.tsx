import { Get } from "@/utils/request";
import { Button, Empty, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import classnames from "classnames";

import EmptyImg from "@/assets/job-applies-empty.png";
import styles from "./style.module.less";
import { useNavigate } from "react-router";
import { getJobChatbotUrl } from "@/utils";

interface IJobListItem extends IJob {
  total_candidates: number;
  candidates_passed_screening: number;
}

const JobList = () => {
  const [jobs, setJobs] = useState<IJobListItem[]>([]);
  const navigate = useNavigate();

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
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "Job Title",
      dataIndex: "name",
    },
    {
      title: "Post status",
      dataIndex: "posted_at",
      render: (postedAt: string) => {
        return postedAt ? (
          <div className={classnames(styles.tag, styles.published)}>
            Published
          </div>
        ) : (
          <div className={classnames(styles.tag, styles.unpublished)}>
            Unpublished
          </div>
        );
      },
    },
    {
      title: "Post Time",
      dataIndex: "posted_at",
      render: (postedAt: string) => {
        return dayjs(postedAt).format("YYYY-MM-DD HH:mm:ss");
      },
    },
    {
      title: "Total Candidates",
      dataIndex: "total_candidates",
    },
    {
      title: "Candidates Passed Screening",
      dataIndex: "candidates_passed_screening",
    },
    {
      title: "Actions",
      dataIndex: "action",
      render: (_, record) => {
        return (
          <div className={styles.actions}>
            <Button
              type="link"
              onClick={() => {
                navigate(`/app/jobs/${record.id}/standard-board`);
              }}
            >
              Details
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
                Go to your listing
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
          <div className={styles.title}>Job listings</div>
          <div className={styles.table}>
            <Table dataSource={jobs} columns={columns} rowKey="id" />
          </div>
        </>
      ) : (
        <Empty
          image={<img src={EmptyImg} alt="empty" style={{ width: "auto" }} />}
          description={
            <>
              Post your first job here, <br /> and we’ll match you with the
              perfect top talent
            </>
          }
        />
      )}
    </div>
  );
};

export default JobList;
