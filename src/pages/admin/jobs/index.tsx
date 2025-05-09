import { Get, Post } from "@/utils/request";
import { Button, Drawer, message, Select, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import styles from "../style.module.less";
import dayjs from "dayjs";

const PAGE_SIZE = 10;

type TRecommendedCandidate = {};

const Jobs = () => {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [allCompanies, setAllCompanies] = useState<ICompany[]>([]);
  const [companyId, setCompanyId] = useState<number>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState();

  const [selectedJob, setSelectedJob] = useState<IJob>();
  const [jobDetailDrawerOpen, setJobDetailDrawerOpen] = useState(false);
  const [recommendedCandidates, setRecommendedCandidates] = useState<
    TRecommendedCandidate[]
  >([]);
  const [candidatesPage, setCandidatesPage] = useState(1);
  const [candidatesTotal, setCandidateTotal] = useState();

  const [candidates, setCandidates] = useState<ICandidateSettings[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);

  useEffect(() => {
    fetchCompanies();
    fetchAllCandidates();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [companyId, page]);

  useEffect(() => {
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
      `/api/admin/jobs?company_id=${
        companyId ?? ""
      }&page=${page}&size=${PAGE_SIZE}`
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
    },
    {
      title: "公司名称",
      dataIndex: "company_id",
      render: (companyId: number) => {
        return <div>{allCompanies.find((c) => c.id === companyId)?.name}</div>;
      },
    },
    {
      title: "职位名称",
      dataIndex: "name",
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
              label: `${c.name} (id: ${c.id})`,
            }))}
            value={companyId}
            onChange={(v) => setCompanyId(v)}
            placeholder="按公司筛选"
          />
        </div>
      </div>
      <div className={styles.adminMain}>
        <Table<IJob>
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
          scroll={{ y: "100%" }}
          onRow={(job) => {
            return {
              onClick: () => {
                setSelectedJob(job);
                setJobDetailDrawerOpen(true);
              },
            };
          }}
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
    </div>
  );
};

export default Jobs;
