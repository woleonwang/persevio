import React, { useEffect, useState } from "react";
import { Button, Input, Select, Table, message, Modal, Space } from "antd";
import { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import { Get, Post } from "@/utils/request";
import dayjs from "dayjs";
import styles from "./style.module.less";
import globalStore from "@/store/global";
import { useNavigate } from "react-router";
import { parseJSON } from "@/utils";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 10;

const Talents: React.FC = () => {
  const navigate = useNavigate();
  const [talents, setTalents] = useState<ITalentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchName, setSearchName] = useState<string>();
  const [selectedJob, setSelectedJob] = useState<string>();
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const { jobs } = globalStore;

  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>) =>
    originalT(`company_talents.${key}`, params);

  useEffect(() => {
    fetchTalents();
    // 刷新未读候选人状态
    globalStore.refreshUnreadTalentsCount();
  }, []);

  const fetchTalents = async () => {
    setLoading(true);
    // 实际项目中这里应该调用真实的API
    const { code, data } = await Get(`/api/talents`);

    if (code === 0) {
      setTalents(
        data.talents.map(
          (talent: any): ITalentListItem => ({
            ...talent,
            source_channel: talent.source_channel || "upload",
            evaluate_result: parseJSON(talent.evaluate_result),
            status:
              talent.status === "accepted"
                ? "accepted"
                : talent.status === "rejected"
                ? "rejected"
                : "pending",
          })
        )
      );
    }

    // 如果当前页超出范围，重置到第一页
    const maxPage = Math.ceil(talents.length / PAGE_SIZE);
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(1);
    }

    setLoading(false);
  };

  // 当筛选条件改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, selectedJob]);

  const visibleTalents = talents.filter((talent) => {
    const nameMatch = !searchName || talent.name.includes(searchName);
    const jobMatch = !selectedJob || talent.job_name === selectedJob;
    const statusMatch = !selectedStatus || talent.status === selectedStatus;
    return nameMatch && jobMatch && statusMatch;
  });

  const currentPageTalents = visibleTalents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleDelete = (talent: ITalentListItem) => {
    Modal.confirm({
      title: t("delete_confirm_title"),
      content: t("delete_confirm_content", { name: talent.name }),
      okText: t("confirm_button"),
      cancelText: t("cancel_button"),
      okType: "primary",
      onOk: async () => {
        const { code } = await Post(
          `/api/jobs/${talent.job_id}/talents/${talent.id}/destroy`
        );

        if (code === 0) {
          message.success(t("delete_success"));
          fetchTalents();
        } else {
          message.error(t("delete_failed"));
        }
      },
    });
  };

  const handleViewDetails = (talent: ITalentListItem) => {
    navigate(`/app/jobs/${talent.job_id}/standard-board/talents/${talent.id}`);
  };

  const columns: ColumnsType<ITalentListItem> = [
    {
      title: t("id_column"),
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: t("candidate_column"),
      dataIndex: "name",
      key: "name",
      width: 120,
      render: (_, record) => (
        <div className={styles.candidateNameWrapper}>
          <span>{record.name}</span>
          {!record.viewed_at && record.source_channel === "delivery" && (
            <span className={styles.unreadDot}></span>
          )}
        </div>
      ),
    },
    {
      title: t("job_name_column"),
      dataIndex: "job_name",
      key: "job_name",
      width: 150,
    },
    {
      title: t("source_channel_column"),
      dataIndex: "source_channel",
      key: "source_channel",
      width: 120,
      render: (_, record) => {
        return record.source_channel === "delivery"
          ? t("active_delivery")
          : t("system_upload");
      },
    },
    {
      title: t("apply_time_column"),
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (_, record) => {
        return dayjs(record.created_at).format("YYYY-MM-DD HH:mm:ss");
      },
    },
    {
      title: t("match_level_column"),
      dataIndex: "match_level",
      key: "match_level",
      width: 180,
      render: (_, record) => {
        return (
          !!record.evaluate_result.overall_match_level &&
          originalT(`talent.${record.evaluate_result.overall_match_level}`)
        );
      },
    },
    {
      title: t("status_column"),
      dataIndex: "status",
      key: "status",
      width: 180,
      render: (_, record) => {
        if (record.interviews?.length) {
          return t(
            record.interviews[0].scheduled_at
              ? "interview_scheduled"
              : "interview_created"
          );
        }
        return t(record.status);
      },
    },
    {
      title: t("action_column"),
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            {t("details_button")}
          </Button>
          {record.source_channel === "upload" && (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => handleDelete(record)}
            >
              {t("delete_button")}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.candidatesContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.title}>{t("title")}</div>
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
            placeholder={t("job_placeholder")}
            value={selectedJob}
            onChange={setSelectedJob}
            style={{ width: 200 }}
            allowClear
            options={jobs.map((job) => ({
              label: job.name,
              value: job.id,
            }))}
            showSearch
            autoClearSearchValue
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>
        <div className={styles.filterItem}>
          <Select
            placeholder={t("status_placeholder")}
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: 200 }}
            allowClear
            options={[
              {
                label: t("accepted"),
                value: "accepted",
              },
              {
                label: t("rejected"),
                value: "rejected",
              },
              {
                label: t("pending"),
                value: "pending",
              },
            ]}
            autoClearSearchValue
          />
        </div>
      </div>

      <div className={styles.pageBody}>
        <Table
          columns={columns}
          dataSource={currentPageTalents}
          rowKey="id"
          loading={loading}
          locale={{
            emptyText: t("empty_text"),
          }}
          pagination={{
            current: currentPage,
            pageSize: PAGE_SIZE,
            total: visibleTalents.length,
            onChange: setCurrentPage,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) =>
              originalT("pagination_total", {
                rangeStart: String(range[0]),
                rangeEnd: String(range[1]),
                total: String(total),
              }),
          }}
          scroll={{ x: 1000 }}
        />
      </div>
    </div>
  );
};

export default Talents;
