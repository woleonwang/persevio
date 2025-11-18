import { Get, Post } from "@/utils/request";
import { Button, Drawer, message, Select, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import classnames from "classnames";
import styles from "../style.module.less";
import MarkdownContainer from "@/components/MarkdownContainer";
import dayjs from "dayjs";
import EditableMarkdown from "@/components/EditableMarkdown";
import ChatMessagePreview from "@/components/ChatMessagePreview";
import { deleteQuery, getQuery, updateQuery } from "@/utils";

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
    pre_register_info: string;
  };
}
const JobApplies = () => {
  const [jobApplies, setJobApplies] = useState<IJobApplyListItemForAdmin[]>([]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TJobListStatus>("INITIAL");
  const [total, setTotal] = useState();

  const [selectedJobApplyId, setSelectedJobApplyId] = useState<number>();
  const [jobApply, setJobApply] = useState<IJobApplyListItemForAdmin>();
  const [jobApplyDetailDrawerOpen, setJobApplyDetailDrawerOpen] =
    useState(false);
  const [jobApplyResumeDrawerOpen, setJobApplyResumeDrawerOpen] =
    useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [recommendReport, setRecommendReport] = useState("");
  const [chatMessages, setChatMessages] = useState<TMessageFromApi[]>([]);
  const [isEditingRecommendReport, setIsEditingRecommendReport] =
    useState(false);

  useEffect(() => {
    fetchJobApplies();
  }, [status, page]);

  useEffect(() => {
    if (selectedJobApplyId) {
      updateQuery("open-id", selectedJobApplyId.toString());
      setJobApplyDetailDrawerOpen(true);
      fetchJobApply();
    }
  }, [selectedJobApplyId]);

  const fetchJobApplies = async () => {
    const { code, data } = await Get(
      `/api/admin/job_applies?status=${status}&page=${page}&size=${PAGE_SIZE}`
    );

    if (code === 0) {
      setJobApplies(data.job_applies);
      setTotal(data.total);

      const openId = getQuery("open-id");
      if (openId) {
        setSelectedJobApplyId(parseInt(openId));
      }
    }
  };

  const fetchJobApply = async () => {
    const { code, data } = await Get(
      `/api/admin/job_applies/${selectedJobApplyId}`
    );

    if (code === 0) {
      setJd(data.jd);
      setResume(data.resume);
      setRecommendReport(data.job_apply.evaluate_result);
      setChatMessages(data.messages ?? []);
      setJobApply(data.job_apply);
    }
  };

  const feedback = async (action: "accept" | "reject") => {
    const { code } = await Post(
      `/api/admin/job_applies/${selectedJobApplyId}/feedback/${action}`
    );
    if (code === 0) {
      message.success("操作成功");
      fetchJobApplies();
      closeDrawer();
    } else {
      message.error("操作失败");
    }
  };

  const closeDrawer = () => {
    setJobApplyDetailDrawerOpen(false);
    setSelectedJobApplyId(undefined);
    deleteQuery("open-id");
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
      render: (candidate: { name: string; pre_register_info: string }) => {
        if (candidate.name) {
          return <div>{candidate.name}</div>;
        } else {
          try {
            const info = JSON.parse(candidate.pre_register_info);
            return <div>{info.name}</div>;
          } catch {
            return <div>N.A.</div>;
          }
        }
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
      <div className={styles.adminPageHeader}>候选人申请列表</div>
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
                setSelectedJobApplyId(jobApply.id);
              },
            };
          }}
        />
      </div>

      <Drawer
        title={`${jobApply?.job.name} - ${jobApply?.candidate.name}`}
        open={jobApplyDetailDrawerOpen}
        onClose={() => closeDrawer()}
        width={1500}
      >
        {jobApply && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              height: "100%",
            }}
          >
            <div style={{ display: "flex", flex: "none" }}>
              {jobApply.status === "INITIAL" && (
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
              {jobApply.status === "ACCEPTED" && (
                <div className={classnames(styles.status, styles.accepted)}>
                  Accepted
                </div>
              )}
              {jobApply.status === "REJECTED" && (
                <div className={classnames(styles.status, styles.rejected)}>
                  Rejected
                </div>
              )}
            </div>
            <div className={styles.jobApplyDetail}>
              <div className={styles.jobApplyPanel}>
                <div className={styles.jobApplyPanelTitle}>JD</div>
                <div style={{ flex: "auto", overflow: "auto" }}>
                  <MarkdownContainer content={jd} />
                </div>
              </div>
              <div
                className={styles.jobApplyPanel}
                style={{ borderLeft: "1px solid #f2f2f2" }}
              >
                <div
                  className={styles.jobApplyPanelTitle}
                  style={{ marginBottom: 12 }}
                >
                  <div>推荐报告</div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <Button
                      type="primary"
                      onClick={() => setIsEditingRecommendReport(true)}
                    >
                      编辑报告
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => setJobApplyResumeDrawerOpen(true)}
                    >
                      查看简历
                    </Button>
                    {chatMessages.length > 0 && (
                      <Button
                        type="primary"
                        onClick={() => setChatDrawerOpen(true)}
                      >
                        查看对话
                      </Button>
                    )}
                  </div>
                </div>
                {recommendReport || isEditingRecommendReport ? (
                  <EditableMarkdown
                    style={{ padding: 20 }}
                    value={recommendReport}
                    isEditing={isEditingRecommendReport}
                    onSubmit={async (value) => {
                      const { code } = await Post(
                        `/api/admin/job_applies/${selectedJobApplyId}`,
                        {
                          evaluate_result: value,
                        }
                      );

                      if (code === 0) {
                        message.success("操作成功");
                        fetchJobApply();
                        setIsEditingRecommendReport(false);
                      } else {
                        message.error("操作失败");
                      }
                    }}
                    onCancel={() => setIsEditingRecommendReport(false)}
                  />
                ) : (
                  <div>暂无报告</div>
                )}
              </div>
            </div>
            <Drawer
              title="简历"
              open={jobApplyResumeDrawerOpen}
              onClose={() => setJobApplyResumeDrawerOpen(false)}
              width={800}
            >
              <MarkdownContainer content={resume} />
            </Drawer>

            <Drawer
              title="对话"
              open={chatDrawerOpen}
              onClose={() => setChatDrawerOpen(false)}
              width={800}
            >
              <ChatMessagePreview messages={chatMessages} role="admin" />
            </Drawer>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default JobApplies;
