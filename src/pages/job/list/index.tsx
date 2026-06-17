import {
  Button,
  Empty,
  Input,
  message,
  Modal,
  Select,
  Table,
  Tooltip,
} from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import classnames from "classnames";
import { SearchOutlined } from "@ant-design/icons";

import EmptyImg from "@/assets/job-applies-empty.png";
import styles from "./style.module.less";
import { useNavigate } from "react-router";
import { getJobChatbotUrl } from "@/utils";
import { useTranslation } from "react-i18next";
import Flash from "@/assets/icons/flash";
import Icon from "@/components/Icon";
import useStaffs from "@/hooks/useStaffs";
import { Get, Post } from "@/utils/request";
import Loading from "@/components/Loading";

interface IJobListItem extends IJob {
  total_candidates: number;
  candidates_passed_screening: number;
}

const getRecruiterEntries = (
  job: IJobListItem,
  staffsList: IStaffWithAccount[],
): { staffId: number; name: string }[] => {
  if (!job.initial_posted_at) return [];
  return (job.collaborators ?? [])
    .filter((c) => c.role === "recruiter")
    .map((c) => ({
      staffId: c.staff_id,
      name:
        c.staff?.name ??
        staffsList.find((s) => s.id === c.staff_id)?.name ??
        "",
    }))
    .filter((row) => row.name);
};

const JobList = () => {
  const [jobs, setJobs] = useState<IJobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState<string>();
  const [selectedOwnerId, setSelectedOwnerId] = useState<number>();
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<number>();

  const { staffs } = useStaffs({ includeDeactivated: true });

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string | number>) =>
    originalT(`job_list.${key}`, params);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { code, data } = await Get("/api/jobs?with_candidates=1");
    if (code === 0) {
      setJobs(data.jobs);
    }
    setLoading(false);
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
      title: t("columns.owner"),
      dataIndex: "staff_id",
      render: (_: number, record: IJobListItem) => {
        const name = staffs.find((staff) => staff.id === record.staff_id)?.name;
        return name ? (
          <div className={styles.chipWrap}>
            <Tooltip title={name}>
              <span className={styles.personChip}>{name}</span>
            </Tooltip>
          </div>
        ) : (
          "-"
        );
      },
    },
    {
      title: t("columns.recruiters"),
      dataIndex: "collaborators",
      width: 200,
      render: (_: unknown, record: IJobListItem) => {
        const rows = getRecruiterEntries(record, staffs);
        if (!rows.length) return "-";
        return (
          <div className={styles.chipWrap}>
            {rows.map((row) => (
              <Tooltip key={row.staffId} title={row.name}>
                <span className={styles.personChip}>{row.name}</span>
              </Tooltip>
            ))}
          </div>
        );
      },
    },
    {
      title: t("columns.post_status"),
      dataIndex: "posted_at",
      render: (_: string, record: IJobListItem) => {
        if (record.posted_at) {
          return (
            <div className={classnames(styles.tag, styles.published)}>
              {t("post_status.published")}
            </div>
          );
        }
        if (record.initial_posted_at) {
          return (
            <div className={classnames(styles.tag, styles.delisted)}>
              {t("post_status.delisted")}
            </div>
          );
        }
        return (
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
        return !!postedAt ? dayjs(postedAt).format("YYYY-MM-DD HH:mm:ss") : "-";
      },
    },
    {
      title: t("columns.total_candidates"),
      dataIndex: "total_candidates",
      width: 180,
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
                navigate(`/app/jobs/${record.invitation_token}/standard-board`);
              }}
            >
              {t("details")}
            </Button>
            {record.posted_at && (
              <Button
                type="link"
                onClick={() => {
                  window.open(
                    getJobChatbotUrl(
                      record.candidate_uuid,
                      record.jd_version?.toString(),
                      "customer",
                    ),
                  );
                }}
              >
                {t("go_to_listing")}
              </Button>
            )}
            <Button
              type="link"
              danger
              onClick={() => {
                Modal.confirm({
                  title: originalT("app_layout.delete_job"),
                  content: originalT("app_layout.delete_job_confirm", {
                    jobName: record.name,
                  }),
                  onOk: async () => {
                    const { code } = await Post(
                      `/api/jobs/${record.invitation_token}/destroy`,
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
          </div>
        );
      },
    },
  ];

  const filteredJobs = useMemo(() => {
    const q = (searchName ?? "").trim().toLowerCase();
    return jobs.filter((job) => {
      const nameOk = !q || job.name.toLowerCase().includes(q);
      const ownerOk =
        selectedOwnerId == null || job.staff_id === selectedOwnerId;
      const recruiterOk =
        selectedRecruiterId == null ||
        (job.collaborators ?? []).some(
          (c) => c.role === "recruiter" && c.staff_id === selectedRecruiterId,
        );
      return nameOk && ownerOk && recruiterOk;
    });
  }, [jobs, searchName, selectedOwnerId, selectedRecruiterId]);

  const staffFilterOptions = useMemo(
    () =>
      staffs.map((staff) => ({
        label: staff.name,
        value: staff.id,
      })),
    [staffs],
  );

  const staffSelectFilterOption = useCallback(
    (input: string, option?: { value?: number }) => {
      const staff = staffs.find((s) => s.id === option?.value);
      if (!staff) return false;
      const needle = input.toLowerCase();
      const email = staff.account?.username ?? "";
      return (
        staff.name.toLowerCase().includes(needle) ||
        email.toLowerCase().includes(needle)
      );
    },
    [staffs],
  );

  const isEmpty = !loading && jobs.length === 0;

  return (
    <div
      className={classnames(styles.container, { [styles.isEmpty]: isEmpty })}
    >
      {loading && jobs.length === 0 ? (
        <div className={styles.loading}>
          <Loading />
        </div>
      ) : jobs.length > 0 ? (
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
          <div className={styles.filterSection}>
            <div className={styles.filterItem}>
              <Input
                placeholder={t("search_placeholder")}
                prefix={<SearchOutlined />}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
            </div>
            <div className={styles.filterItem}>
              <Select
                placeholder={t("owner_placeholder")}
                value={selectedOwnerId}
                onChange={setSelectedOwnerId}
                style={{ width: 200 }}
                allowClear
                options={staffFilterOptions}
                autoClearSearchValue
                showSearch
                filterOption={staffSelectFilterOption}
              />
            </div>
            <div className={styles.filterItem}>
              <Select
                placeholder={t("recruiter_placeholder")}
                value={selectedRecruiterId}
                onChange={setSelectedRecruiterId}
                style={{ width: 200 }}
                allowClear
                options={staffFilterOptions}
                autoClearSearchValue
                showSearch
                filterOption={staffSelectFilterOption}
              />
            </div>
          </div>
          <div className={styles.table}>
            <Table
              dataSource={filteredJobs}
              columns={columns}
              rowKey="id"
              loading={loading}
            />
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
