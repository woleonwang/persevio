import { Button, Empty, Input, message, Modal, Select, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
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
interface IJobListItem extends IJob {
  total_candidates: number;
  candidates_passed_screening: number;
}

const JobList = () => {
  const [jobs, setJobs] = useState<IJobListItem[]>([]);
  const [searchName, setSearchName] = useState<string>();
  const [selectedCreatorId, setSelectedCreatorId] = useState<number>();

  const { staffs } = useStaffs();

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
      title: t("columns.creator"),
      dataIndex: "creator",
      render: (_: string, record: IJobListItem) => {
        return staffs.find((staff) => staff.id === record.staff_id)?.name;
      },
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
        return !!postedAt ? dayjs(postedAt).format("YYYY-MM-DD HH:mm:ss") : "-";
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
                placeholder={t("creator_placeholder")}
                value={selectedCreatorId}
                onChange={setSelectedCreatorId}
                style={{ width: 200 }}
                allowClear
                options={staffs.map((staff) => ({
                  label: staff.name,
                  value: staff.id,
                }))}
                autoClearSearchValue
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </div>
          </div>
          <div className={styles.table}>
            <Table
              dataSource={jobs.filter((job) => {
                return (
                  job.name.includes(searchName ?? "") &&
                  (selectedCreatorId
                    ? job.staff_id === selectedCreatorId
                    : true)
                );
              })}
              columns={columns}
              rowKey="id"
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
