import { Get, Post } from "@/utils/request";
import { Button, Drawer, message, Select, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import classnames from "classnames";
import styles from "../style.module.less";
import MarkdownContainer from "@/components/MarkdownContainer";
import dayjs from "dayjs";

const PAGE_SIZE = 10;

interface IJobApplyListItemForAdmin extends IJobApplyListItem {
  job: {
    name: string;
    company: {
      name: string;
    };
  };
  candidate: {
    name: string;
  };
}
const JobApplies = () => {
  const [jobApplies, setJobApplies] = useState<IJobApplyListItemForAdmin[]>([]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TJobListStatus>("INITIAL");
  const [total, setTotal] = useState();

  const [selectedJobApply, setSelectedJobApply] =
    useState<IJobApplyListItemForAdmin>();
  const [jobApplyDetailDrawerOpen, setJobApplyDetailDrawerOpen] =
    useState(false);
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");

  useEffect(() => {
    fetchJobApplies();
  }, [status, page]);

  useEffect(() => {
    if (selectedJobApply) {
      fetchJobApply();
    }
  }, [selectedJobApply]);

  const fetchJobApplies = async () => {
    const { code, data } = await Get(
      `/api/admin/job_applies?status=${status}&page=${page}&size=${PAGE_SIZE}`
    );

    if (code === 0) {
      setJobApplies(data.job_applies);
      setTotal(data.total);
    }
  };

  const fetchJobApply = async () => {
    const { code, data } = await Get(
      `/api/admin/job_applies/${selectedJobApply?.id}`
    );

    if (code === 0) {
      setJd(data.jd);
      setResume(data.resume);
    }
  };

  const feedback = async (action: "accept" | "reject") => {
    const { code } = await Post(
      `/api/admin/job_applies/${selectedJobApply?.id}/feedback/${action}`
    );
    if (code === 0) {
      message.success("操作成功");
      fetchJobApplies();
      setJobApplyDetailDrawerOpen(false);
    } else {
      message.error("操作失败");
    }
  };

  const jobApplyTableColumns: ColumnsType<IJobApplyListItemForAdmin> = [
    {
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "公司名称",
      dataIndex: "job",
      render: (job: { company: { name: string } }) => {
        return <div>{job.company.name}</div>;
      },
    },
    {
      title: "职位名称",
      dataIndex: "job",
      render: (job: { name: string }) => {
        return <div>{job.name}</div>;
      },
    },
    {
      title: "候选人",
      dataIndex: "candidate",
      render: (candidate: { name: string }) => {
        return <div>{candidate.name}</div>;
      },
    },
    {
      title: "申请时间",
      dataIndex: "deliveried_at",
      render: (deliveriedAt: string) => {
        return dayjs(deliveriedAt).format("YYYY-MM-DD HH:mm:ss");
      },
    },
  ];

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPageHeader}>职位列表</div>
      <div className={styles.adminFilter}>
        <div className={styles.adminFilterItem}>
          <div>状态: </div>
          <Select
            style={{ width: 200 }}
            options={["INITIAL", "ACCEPTED", "REJECTED"].map((c) => ({
              value: c,
              label: c,
            }))}
            value={status}
            onChange={(v) => setStatus(v)}
            placeholder="按状态筛选"
          />
        </div>
      </div>
      <div className={styles.adminMain}>
        <Table<IJobApplyListItemForAdmin>
          style={{ height: "100%", overflow: "auto" }}
          rowKey="id"
          dataSource={jobApplies}
          columns={jobApplyTableColumns}
          pagination={{
            pageSize: PAGE_SIZE,
            current: page,
            total,
            onChange: (page) => setPage(page),
          }}
          scroll={{ y: "100%" }}
          onRow={(jobApply) => {
            return {
              onClick: () => {
                setSelectedJobApply(jobApply);
                setJobApplyDetailDrawerOpen(true);
              },
            };
          }}
        />
      </div>

      <Drawer
        title={`${selectedJobApply?.job.name} - ${selectedJobApply?.candidate.name}`}
        open={jobApplyDetailDrawerOpen}
        onClose={() => setJobApplyDetailDrawerOpen(false)}
        width={1500}
      >
        {selectedJobApply && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              height: "100%",
            }}
          >
            <div style={{ display: "flex", flex: "none" }}>
              {selectedJobApply.status === "INITIAL" && (
                <>
                  <Button type="primary" onClick={() => feedback("accept")}>
                    Accept
                  </Button>
                  <Button
                    type="primary"
                    danger
                    onClick={() => feedback("reject")}
                    style={{ marginLeft: 12 }}
                  >
                    Reject
                  </Button>
                </>
              )}
              {selectedJobApply.status === "ACCEPTED" && (
                <div className={classnames(styles.status, styles.accepted)}>
                  Accepted
                </div>
              )}
              {selectedJobApply.status === "REJECTED" && (
                <div className={classnames(styles.status, styles.rejected)}>
                  Rejected
                </div>
              )}
            </div>
            <div className={styles.jobApplyDetail}>
              <div className={styles.jobApplyPanel}>
                <div className={styles.jobApplyPanelTitle}>JD</div>
                <MarkdownContainer content={jd} />
              </div>
              <div
                className={styles.jobApplyPanel}
                style={{ borderLeft: "1px solid #f2f2f2" }}
              >
                <div className={styles.jobApplyPanelTitle}>简历</div>
                <MarkdownContainer content={resume} />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default JobApplies;
