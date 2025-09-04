import { Get, Post } from "@/utils/request";
import { Button, Drawer, Input, message, Select, Table, Tag } from "antd";
import { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";

import styles from "../style.module.less";
import CandidateDrawerContent from "./components/CandidateDrawerContent";

const PAGE_SIZE = 10;

const Candidates = () => {
  const [candidates, setCandidates] = useState<ICandidateSettings[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [candidateDrawerOpen, setCandidateDrawerOpen] = useState(false);
  const [candidate, setCandidate] = useState<ICandidateSettings>();

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { code, data } = await Get("/api/admin/candidates");
      if (code === 0) {
        setCandidates(
          data.candidates.filter(
            (candidate: ICandidateSettings) =>
              candidate.approve_status && candidate.approve_status !== "init"
          )
        );
      }
    } catch (error) {
      message.error("获取候选人列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async (
    candidateId: number,
    action: "approve" | "reject"
  ) => {
    if (
      confirm(`确定要${action === "approve" ? "通过" : "拒绝"}该候选人吗？`)
    ) {
      const { code } = await Post(
        `/api/admin/candidates/${candidateId}/audit/${action}`
      );
      if (code === 0) {
        message.success(action === "approve" ? "审核通过成功" : "审核拒绝成功");
        fetchCandidates();
      } else {
        message.error("审核操作失败");
      }
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "pending":
        return <Tag color="orange">审核中</Tag>;
      case "approved":
        return <Tag color="green">已通过</Tag>;
      case "rejected":
        return <Tag color="red">未通过</Tag>;
      default:
        return <Tag color="default">未知</Tag>;
    }
  };

  const visibleCandidates = candidates
    .filter((candidate) => {
      if (!searchKeyword) return true;
      return (
        candidate.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    })
    .filter((candidate) => {
      if (statusFilter === "all") return true;
      return candidate.approve_status === statusFilter;
    });

  const currentPageCandidates = visibleCandidates.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const columns: ColumnsType<ICandidateSettings> = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
    },
    {
      title: "用户名称",
      dataIndex: "name",
      width: 120,
    },
    {
      title: "注册邮箱",
      dataIndex: "email",
      width: 200,
    },
    {
      title: "LinkedIn Profile",
      dataIndex: "linkedin_profile_url",
      width: 150,
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url ?? "-"}
        </a>
      ),
    },
    {
      title: "简历详情",
      dataIndex: "resume_path",
      width: 150,
      render: (_, record: ICandidateSettings) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setCandidate(record);
            setCandidateDrawerOpen(true);
          }}
        >
          查看
        </Button>
      ),
    },
    {
      title: "审核状态",
      dataIndex: "approve_status",
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_, record: ICandidateSettings) => {
        if (record.approve_status === "pending") {
          return (
            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                type="primary"
                danger
                size="small"
                onClick={() => handleAudit(record.id, "reject")}
              >
                不通过
              </Button>
              <Button
                type="primary"
                size="small"
                onClick={() => handleAudit(record.id, "approve")}
              >
                通过
              </Button>
            </div>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPageHeader}>候选人列表</div>
      <div className={styles.adminFilter}>
        <div className={styles.adminFilterItem}>
          <div>用户名称: </div>
          <Input
            placeholder="搜索用户名称"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
        </div>
        <div className={styles.adminFilterItem}>
          <div>审核状态: </div>
          <Select
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "所有审核状态" },
              { value: "pending", label: "审核中" },
              { value: "approved", label: "已通过" },
              { value: "rejected", label: "未通过" },
            ]}
          />
        </div>
      </div>
      <div className={styles.adminMain}>
        <Table<ICandidateSettings>
          loading={loading}
          style={{ height: "100%", overflow: "auto" }}
          rowKey="id"
          dataSource={currentPageCandidates}
          columns={columns}
          pagination={{
            pageSize: PAGE_SIZE,
            current: page,
            total: visibleCandidates.length,
            onChange: (page) => setPage(page),
            showSizeChanger: false,
          }}
          scroll={{ x: 1000, y: "100%" }}
        />
      </div>

      <Drawer
        open={candidateDrawerOpen}
        onClose={() => setCandidateDrawerOpen(false)}
        title={candidate?.name ?? ""}
        destroyOnClose
        width={1200}
      >
        {candidate && <CandidateDrawerContent candidate={candidate} />}
      </Drawer>
    </div>
  );
};

export default Candidates;
