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

type TStatus = "creating" | "published" | "unpublished";
const Jobs = () => {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [allCompanies, setAllCompanies] = useState<ICompany[]>([]);
  const [companyId, setCompanyId] = useState<number>();
  const [jobName, setJobName] = useState<string>();
  const [status, setStatus] = useState<TStatus>();
  const [fetchParams, setFetchParams] = useState<{
    companyId?: number;
    jobName?: string;
    status?: TStatus;
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
      }&status=${status ?? ""}&page=${page}&size=${PAGE_SIZE}`
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
      message.success(t("recommendedCandidates.recommendSuccess"));
      fetchRecommendedCandidates();
      setSelectedCandidates([]);
    }
  };

  const jobTableColumns: ColumnsType<IJob> = [
    {
      title: t("table.id"),
      dataIndex: "id",
      fixed: "left" as const,
    },
    {
      title: t("table.jobName"),
      dataIndex: "name",
      fixed: "left" as const,
    },
    {
      title: t("table.companyName"),
      dataIndex: "company_id",
      render: (companyId: number) => {
        return <div>{allCompanies.find((c) => c.id === companyId)?.name}</div>;
      },
    },
    {
      title: t("table.isPosted"),
      dataIndex: "posted_at",
      render: (_: string, record: IJob) => {
        if (record.posted_at) {
          return t("table.published");
        } else if (record.initial_posted_at) {
          return t("table.unpublished");
        } else {
          return t("table.creating");
        }
      },
    },
    {
      title: t("table.applicationCount"),
      dataIndex: "total_job_applies",
      render: (totalJobApplies: number) => {
        return totalJobApplies ? totalJobApplies : "-";
      },
    },
    {
      title: t("table.employerCandidateCount"),
      dataIndex: "total_candidates",
      render: (totalCandidates: number) => {
        return totalCandidates ? totalCandidates : "-";
      },
    },
    {
      title: t("table.passedScreeningCount"),
      dataIndex: "candidates_passed_screening",
      render: (candidatesPassedScreening: number) => {
        return candidatesPassedScreening ? candidatesPassedScreening : "-";
      },
    },
    {
      title: t("table.confirmedInterviewCount"),
      dataIndex: "candidates_confirm_interview",
      render: (candidatesConfirmInterview: number) => {
        return candidatesConfirmInterview ? candidatesConfirmInterview : "-";
      },
    },
    {
      title: t("table.bonusPool"),
      dataIndex: "bonus_pool",
      render: (bonusPool: number) => {
        return bonusPool ? `$ ${bonusPool}` : "-";
      },
    },
    {
      title: t("table.assignee"),
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
      title: t("table.actions"),
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
              {t("table.addBonusPool")}
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
              {t("table.goToListing")}
            </Button>
          </div>
        );
      },
    },
  ];

  const recommendedTalentTableColumns: ColumnsType<TRecommendedCandidate> = [
    {
      title: t("recommendedCandidates.id"),
      dataIndex: "id",
    },
    {
      title: t("recommendedCandidates.candidate"),
      dataIndex: "candidate",
      render: (candidate: ICandidateSettings) => {
        return <div>{candidate.name}</div>;
      },
    },
    {
      title: t("recommendedCandidates.pushTime"),
      dataIndex: "created_at",
      render: (datetime: string) => {
        return dayjs(datetime).format("YYYY-MM-DD HH:mm:ss");
      },
    },
  ];

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPageHeader}>{t("pageTitle")}</div>
      <div className={styles.adminFilter}>
        <div className={styles.adminFilterItem}>
          <div>{t("filters.company")}: </div>
          <Select
            style={{ width: 200 }}
            options={allCompanies.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            value={companyId}
            onChange={(v) => setCompanyId(v)}
            placeholder={t("filters.companyPlaceholder")}
            optionFilterProp="label"
            showSearch
          />
        </div>
        <div className={styles.adminFilterItem}>
          <div>{t("filters.jobName")}: </div>
          <Input
            style={{ width: 200 }}
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            placeholder={t("filters.jobNamePlaceholder")}
          />
        </div>
        <div className={styles.adminFilterItem}>
          <div>{t("filters.isPosted")}: </div>
          <Select
            style={{ width: 200 }}
            options={["creating", "published", "unpublished"].map((c) => ({
              value: c,
              label: t(`table.${c}`),
            }))}
            value={status}
            onChange={(v) => setStatus(v)}
            placeholder={t("filters.isPostedPlaceholder")}
          />
        </div>
        <div className={styles.adminFilterItem}>
          <Button
            type="primary"
            onClick={() => {
              setPage(1);
              setFetchParams({
                companyId,
                jobName,
                status,
              });
            }}
          >
            {t("filters.filter")}
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setCompanyId(undefined);
              setJobName(undefined);
              setStatus(undefined);
              setFetchParams(undefined);
            }}
          >
            {t("filters.clear")}
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
                {t("recommendedCandidates.recommendToCandidate")}
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
        title={t("bonusPoolModal.title")}
        okText={t("bonusPoolModal.add")}
        cancelText={t("bonusPoolModal.cancel")}
        onOk={async () => {
          form.validateFields().then(async (values) => {
            const { code } = await Post(`/api/admin/jobs/${selectedJob?.id}`, {
              bonus_pool: values.bonus_pool,
            });
            if (code === 0) {
              message.success(t("bonusPoolModal.addSuccess"));
              fetchJobs();
              setBonusPoolModalOpen(false);
            } else {
              message.error(t("bonusPoolModal.addFailed"));
            }
          });
        }}
        onCancel={() => {
          setBonusPoolModalOpen(false);
        }}
      >
        <div className={styles.modalDescription}>
          {t("bonusPoolModal.description")}
        </div>
        <Form
          form={form}
          layout="vertical"
          className={styles.bonusPoolModalForm}
        >
          <Form.Item
            label={t("bonusPoolModal.label")}
            name="bonus_pool"
            rules={[
              {
                required: true,
                message: t("bonusPoolModal.amountRequired"),
              },
            ]}
          >
            <InputNumber
              placeholder={t("bonusPoolModal.placeholder")}
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
