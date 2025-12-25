import { Get, Post } from "@/utils/request";
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Table,
} from "antd";
import { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import styles from "../style.module.less";
import dayjs from "dayjs";
import { getJobChatbotUrl } from "@/utils";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 10;

type TRecommendedCandidate = {};

const Jobs = () => {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [allCompanies, setAllCompanies] = useState<ICompany[]>([]);
  const [companyId, setCompanyId] = useState<number>();
  const [jobName, setJobName] = useState<string>();
  const [isPosted, setIsPosted] = useState<string>();
  const [fetchParams, setFetchParams] = useState<{
    companyId?: number;
    jobName?: string;
    isPosted?: string;
  }>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState();

  const [selectedJob, setSelectedJob] = useState<IJob>();
  const [jobDetailDrawerOpen, setJobDetailDrawerOpen] = useState(false);
  const [bonusPoolModalOpen, setBonusPoolModalOpen] = useState(false);
  const [recommendedCandidates, setRecommendedCandidates] = useState<
    TRecommendedCandidate[]
  >([]);
  const [candidatesPage, setCandidatesPage] = useState(1);
  const [candidatesTotal, setCandidateTotal] = useState();

  const [candidates, setCandidates] = useState<ICandidateSettings[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);

  const [form] = Form.useForm();
  const navigate = useNavigate();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`admin_jobs.${key}`);

  useEffect(() => {
    fetchCompanies();
    fetchAllCandidates();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchParams, page]);

  useEffect(() => {
    if (!selectedJob) {
      return;
    }
    fetchRecommendedCandidates();
  }, [selectedJob, candidatesPage]);
  const fetchCompanies = async () => {
    const { code, data } = await Get("/api/all_companies");
    if (code === 0) {
      setAllCompanies(data.companies);
    }
  };

  const fetchAllCandidates = async () => {
    const { code, data } = await Get("/api/admin/candidates");
    if (code === 0) {
      setCandidates(data.candidates);
    }
  };

  const fetchJobs = async () => {
    const { code, data } = await Get(
      `/api/admin/jobs?company_id=${companyId ?? ""}&job_name=${
        jobName ?? ""
      }&posted=${isPosted ?? ""}&page=${page}&size=${PAGE_SIZE}`
    );

    if (code === 0) {
      setJobs(data.jobs);
      setTotal(data.total);
    }
  };

  const fetchRecommendedCandidates = async () => {
    const { code, data } = await Get(
      `/api/admin/jobs/${selectedJob?.id}/recommended_jobs?page=${candidatesPage}&size=${PAGE_SIZE}`
    );
    if (code === 0) {
      setRecommendedCandidates(data.recommended_jobs);
      setCandidateTotal(data.total);
    }
  };

  const selectCandidates = (ids: number[]) => {
    setSelectedCandidates(ids);
  };

  const createRecommendedJob = async () => {
    const { code } = await Post(
      `/api/admin/jobs/${selectedJob?.id}/recommended_jobs`,
      {
        candidate_ids: selectedCandidates,
      }
    );
    if (code === 0) {
      message.success("推荐成功");
      fetchRecommendedCandidates();
      setSelectedCandidates([]);
    }
  };

  const jobTableColumns: ColumnsType<IJob> = [
    {
      title: "ID",
      dataIndex: "id",
      fixed: "left" as const,
    },
    {
      title: "职位名称",
      dataIndex: "name",
      fixed: "left" as const,
    },
    {
      title: "公司名称",
      dataIndex: "company_id",
      render: (companyId: number) => {
        return <div>{allCompanies.find((c) => c.id === companyId)?.name}</div>;
      },
    },
    {
      title: "是否发布",
      dataIndex: "posted_at",
      render: (postedAt: string) => {
        return !!postedAt ? "是" : "否";
      },
    },
    {
      title: "申请数量",
      dataIndex: "total_job_applies",
      render: (totalJobApplies: number) => {
        return totalJobApplies ? totalJobApplies : "-";
      },
    },
    {
      title: "雇主候选人数量",
      dataIndex: "total_candidates",
      render: (totalCandidates: number) => {
        return totalCandidates ? totalCandidates : "-";
      },
    },
    {
      title: "雇主筛选通过数量",
      dataIndex: "candidates_passed_screening",
      render: (candidatesPassedScreening: number) => {
        return candidatesPassedScreening ? candidatesPassedScreening : "-";
      },
    },
    {
      title: "已确认面试数量",
      dataIndex: "candidates_confirm_interview",
      render: (candidatesConfirmInterview: number) => {
        return candidatesConfirmInterview ? candidatesConfirmInterview : "-";
      },
    },
    {
      title: "奖金池",
      dataIndex: "bonus_pool",
      render: (bonusPool: number) => {
        return bonusPool ? `$ ${bonusPool}` : "-";
      },
    },
    {
      title: "分配人",
      dataIndex: "admins",
      render: (_: string, job: IJob) => {
        return (
          (job.admin_jobs ?? []).map((item) => item.admin.name).join("、") ||
          "-"
        );
      },
      width: 150,
    },
    {
      title: "操作",
      key: "actions",
      width: 350,
      render: (_, job: IJob) => {
        if (!job.posted_at) {
          return null;
        }

        return (
          <div>
            <Button
              variant="outlined"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedJob(job);
                setBonusPoolModalOpen(true);
                form.setFieldsValue({
                  bonus_pool: job.bonus_pool,
                });
              }}
            >
              Add Bonus Pool
            </Button>

            <Button
              variant="outlined"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  getJobChatbotUrl(job.id, job.jd_version?.toString())
                );
              }}
              style={{ marginLeft: 12 }}
            >
              Go to Listing
            </Button>
          </div>
        );
      },
    },
  ];

  const recommendedTalentTableColumns: ColumnsType<TRecommendedCandidate> = [
    {
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "候选人",
      dataIndex: "candidate",
      render: (candidate: ICandidateSettings) => {
        return <div>{candidate.name}</div>;
      },
    },
    {
      title: "推送时间",
      dataIndex: "created_at",
      render: (datetime: string) => {
        return dayjs(datetime).format("YYYY-MM-DD HH:mm:ss");
      },
    },
  ];

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPageHeader}>职位列表</div>
      <div className={styles.adminFilter}>
        <div className={styles.adminFilterItem}>
          <div>公司: </div>
          <Select
            style={{ width: 200 }}
            options={allCompanies.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            value={companyId}
            onChange={(v) => setCompanyId(v)}
            placeholder="按公司筛选"
            optionFilterProp="label"
            showSearch
          />
        </div>
        <div className={styles.adminFilterItem}>
          <div>职位名称: </div>
          <Input
            style={{ width: 200 }}
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            placeholder="按职位名称筛选"
          />
        </div>
        <div className={styles.adminFilterItem}>
          <div>是否发布: </div>
          <Select
            style={{ width: 200 }}
            options={["1", "0"].map((c) => ({
              value: c,
              label: c === "1" ? "是" : "否",
            }))}
            value={isPosted}
            onChange={(v) => setIsPosted(v)}
            placeholder="筛选是否发布"
          />
        </div>
        <div className={styles.adminFilterItem}>
          <Button
            type="primary"
            onClick={() => {
              setFetchParams({
                companyId,
                jobName,
                isPosted,
              });
            }}
          >
            筛选
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setCompanyId(undefined);
              setJobName(undefined);
              setIsPosted(undefined);
              setFetchParams(undefined);
            }}
          >
            清空
          </Button>
        </div>
      </div>
      <div className={styles.adminMain}>
        <Table<IJob>
          className="persevio-table"
          style={{ height: "100%", overflow: "auto" }}
          rowKey="id"
          dataSource={jobs}
          columns={jobTableColumns}
          pagination={{
            pageSize: PAGE_SIZE,
            current: page,
            total,
            onChange: (page) => setPage(page),
          }}
          onRow={(job) => {
            return {
              onClick: () => {
                navigate(`/admin/jobs/${job.id}`);
                // setSelectedJob(job);
                // setJobDetailDrawerOpen(true);
              },
            };
          }}
          scroll={{ x: "max-content" }}
        />
      </div>

      <Drawer
        title={selectedJob?.name}
        open={jobDetailDrawerOpen}
        onClose={() => setJobDetailDrawerOpen(false)}
        width={1200}
      >
        {selectedJob && (
          <div>
            <div>
              <Select
                style={{ width: 300 }}
                options={candidates.map((candidate) => ({
                  value: candidate.id,
                  label: `${candidate.name} (id: ${candidate.id})`,
                }))}
                value={selectedCandidates}
                onChange={selectCandidates}
                mode="multiple"
              />
              <Button
                type="primary"
                onClick={createRecommendedJob}
                style={{ marginLeft: 12 }}
              >
                推荐给候选人
              </Button>
            </div>
            <Table
              style={{ height: "100%", overflow: "auto", marginTop: 12 }}
              rowKey="id"
              dataSource={recommendedCandidates}
              columns={recommendedTalentTableColumns}
              pagination={{
                pageSize: PAGE_SIZE,
                current: candidatesPage,
                total: candidatesTotal,
                onChange: (page) => setCandidatesPage(page),
              }}
            />
          </div>
        )}
      </Drawer>

      <Modal
        open={bonusPoolModalOpen}
        onClose={() => setBonusPoolModalOpen(false)}
        title="Add Bonus Pool"
        okText="Add"
        cancelText="Cancel"
        onOk={async () => {
          form.validateFields().then(async (values) => {
            const { code } = await Post(`/api/admin/jobs/${selectedJob?.id}`, {
              bonus_pool: values.bonus_pool,
            });
            if (code === 0) {
              message.success("Add bonus pool success");
              fetchJobs();
              setBonusPoolModalOpen(false);
            } else {
              message.error("Add bonus pool failed");
            }
          });
        }}
        onCancel={() => {
          setBonusPoolModalOpen(false);
        }}
      >
        <div className={styles.modalDescription}>
           Once the bonus pool amount is confirmed, this job will become
          eligible for recommendations. When a candidate is hired, all users in
          the referral chain will share the bonus pool.
        </div>
        <Form
          form={form}
          layout="vertical"
          className={styles.bonusPoolModalForm}
        >
          <Form.Item
            label="Please enter the total bonus pool amount for the current job"
            name="bonus_pool"
            rules={[
              {
                required: true,
                message: "Please enter the amount",
              },
            ]}
          >
            <InputNumber
              placeholder="Input total amount"
              style={{ width: "100%" }}
              prefix="S$"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Jobs;
