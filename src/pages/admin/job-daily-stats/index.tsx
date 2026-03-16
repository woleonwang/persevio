import { Get } from "@/utils/request";
import { getQuery } from "@/utils";
import { DatePicker, Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import styles from "../style.module.less";

function getInitialDate(): dayjs.Dayjs {
  const q = getQuery("date");
  if (!q) return dayjs().subtract(1, "day");
  const d = dayjs(q, "YYYY-MM-DD", true);
  return d.isValid() ? d : dayjs().subtract(1, "day");
}

type JobDailyStatsItem = {
  job_id: number;
  applied: number;
  resume_submitted: number;
  signed_up: number;
  started_prescreening: number;
  completed_prescreening: number;
};

type JobDailyStatsPayload = {
  date: string;
  by_job: JobDailyStatsItem[];
};

type JobInfo = {
  id: number;
  name: string;
  company?: { name?: string };
};

type TableRow = {
  key: string;
  role: string;
  employer: string;
  applied: number;
  resumeSubmitted: string;
  signedUp: string;
  startedPrescreening: string;
  completedPrescreening: string;
};

function formatMetricCell(
  count: number,
  applied: number,
  priorStageCount: number,
): string {
  const pctApplied = applied === 0 ? 0 : Math.round((count / applied) * 100);
  const pctChange =
    priorStageCount === 0 ? 0 : Math.round((count / priorStageCount) * 100);
  return `${count} / ${pctApplied}% / ${pctChange}%`;
}

const JobDailyStats = () => {
  const [selectedDate, setSelectedDate] = useState(getInitialDate);
  const [payload, setPayload] = useState<JobDailyStatsPayload | null>(null);
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const dateStr = selectedDate.format("YYYY-MM-DD");

  useEffect(() => {
    const timestampParam = `${dateStr} 09:00:00 +0800`;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [res, jobsRes] = await Promise.all([
          Get<JobDailyStatsPayload>("/api/admin/job_daily_stats", {
            timestamp: timestampParam,
          } as Record<string, unknown>),
          Get<{ jobs: JobInfo[]; total: number }>("/api/admin/jobs/options"),
        ]);
        setPayload(res?.code === 0 ? (res.data ?? null) : null);
        if (jobsRes?.code === 0 && jobsRes.data?.jobs) {
          setJobs(jobsRes.data.jobs);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateStr]);

  const jobMap = new Map(jobs.map((j) => [j.id, j]));
  const byJob = payload?.by_job ?? [];
  const totals = byJob.reduce(
    (acc, row) => ({
      applied: acc.applied + row.applied,
      resume_submitted: acc.resume_submitted + row.resume_submitted,
      signed_up: acc.signed_up + row.signed_up,
      started_prescreening: acc.started_prescreening + row.started_prescreening,
      completed_prescreening:
        acc.completed_prescreening + row.completed_prescreening,
    }),
    {
      applied: 0,
      resume_submitted: 0,
      signed_up: 0,
      started_prescreening: 0,
      completed_prescreening: 0,
    },
  );

  const tableData: TableRow[] = byJob.map((row) => {
    const job = jobMap.get(row.job_id);
    const applied = row.applied;

    return {
      key: `${row.job_id}-${payload?.date ?? ""}`,
      role: job?.name ?? String(row.job_id),
      employer: job?.company?.name ?? "-",
      applied,
      resumeSubmitted: formatMetricCell(
        row.resume_submitted,
        applied,
        row.applied,
      ),
      signedUp: formatMetricCell(row.signed_up, applied, row.resume_submitted),
      startedPrescreening: formatMetricCell(
        row.started_prescreening,
        applied,
        row.signed_up,
      ),
      completedPrescreening: formatMetricCell(
        row.completed_prescreening,
        applied,
        row.started_prescreening,
      ),
    };
  });

  const columns: ColumnsType<TableRow> = [
    { title: "Role", dataIndex: "role", key: "role", width: 160 },
    { title: "Employer", dataIndex: "employer", key: "employer", width: 140 },
    { title: "Applied", dataIndex: "applied", key: "applied", width: 80 },
    {
      title: "Resume Submitted",
      dataIndex: "resumeSubmitted",
      key: "resumeSubmitted",
      render: (t: string) => t,
    },
    {
      title: "Signed Up",
      dataIndex: "signedUp",
      key: "signedUp",
      render: (t: string) => t,
    },
    {
      title: "Started Prescreening",
      dataIndex: "startedPrescreening",
      key: "startedPrescreening",
      render: (t: string) => t,
    },
    {
      title: "Completed Prescreening",
      dataIndex: "completedPrescreening",
      key: "completedPrescreening",
      render: (t: string) => t,
    },
  ];

  const summaryRow = (
    <Table.Summary>
      <Table.Summary.Row>
        <Table.Summary.Cell index={0} colSpan={2}>
          <strong>All Roles</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={1}>{totals.applied}</Table.Summary.Cell>
        <Table.Summary.Cell index={2}>
          {formatMetricCell(
            totals.resume_submitted,
            totals.applied,
            totals.applied,
          )}
        </Table.Summary.Cell>
        <Table.Summary.Cell index={3}>
          {formatMetricCell(
            totals.signed_up,
            totals.applied,
            totals.resume_submitted,
          )}
        </Table.Summary.Cell>
        <Table.Summary.Cell index={4}>
          {formatMetricCell(
            totals.started_prescreening,
            totals.applied,
            totals.signed_up,
          )}
        </Table.Summary.Cell>
        <Table.Summary.Cell index={5}>
          {formatMetricCell(
            totals.completed_prescreening,
            totals.applied,
            totals.started_prescreening,
          )}
        </Table.Summary.Cell>
      </Table.Summary.Row>
    </Table.Summary>
  );

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPageHeader}>Daily Job Breakdown</div>
      <div className={styles.adminFilter}>
        <div className={styles.adminFilterItem}>
          <span>Date</span>
          <DatePicker
            value={selectedDate}
            onChange={(d) => d && setSelectedDate(d)}
            allowClear={false}
          />
        </div>
      </div>
      <div className={styles.adminMain}>
        {loading ? (
          <Spin />
        ) : (
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            scroll={{ x: 900 }}
            summary={() => summaryRow}
          />
        )}
      </div>
    </div>
  );
};

export default JobDailyStats;
