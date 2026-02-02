import { Get } from "@/utils/request";
import { Drawer, Input, message, Select, Table, Tag } from "antd";
import { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";

import styles from "../style.module.less";
import CandidateDrawerContent from "@/components/CandidateDrawerContent";
import dayjs from "dayjs";

const PAGE_SIZE = 10;

const CandidateConnections = () => {
  const [candidateConnections, setCandidateConnections] = useState<
    ICandidateConnection[]
  >([]);
  const [candidates, setCandidates] = useState<ICandidateSettings[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [selectedCandidate, setSelectedCandidate] =
    useState<ICandidateSettings>();
  const [candidateDrawerOpen, setCandidateDrawerOpen] = useState(false);

  useEffect(() => {
    fetchCandidates();
    fetchCandidateConnections();
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
      message.error("获取候选人失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidateConnections = async () => {
    const { code, data } = await Get("/api/admin/candidate_connections");
    if (code === 0) {
      setCandidateConnections(data.candidate_connections);
    }
  };

  const visibleCandidateConnections = candidateConnections
    .filter((candidateConnection) => {
      if (!searchKeyword) return true;
      const sourceCandidate = candidates.find(
        (candidate) => candidate.id === candidateConnection.source_candidate_id
      );
      const targetCandidate = candidates.find(
        (candidate) => candidate.id === candidateConnection.target_candidate_id
      );
      return (
        (sourceCandidate &&
          sourceCandidate.name
            .toLowerCase()
            .includes(searchKeyword.toLowerCase())) ||
        (targetCandidate &&
          targetCandidate.name
            .toLowerCase()
            .includes(searchKeyword.toLowerCase()))
      );
    })
    .filter((candidateConnection) => {
      if (statusFilter === "all") return true;

      if (statusFilter === "pending") {
        return (
          candidateConnection.source_status === "pending" ||
          candidateConnection.target_status === "pending"
        );
      }

      if (statusFilter === "approved") {
        return (
          candidateConnection.source_status === "approved" &&
          candidateConnection.target_status === "approved"
        );
      }

      if (statusFilter === "rejected") {
        return (
          candidateConnection.source_status === "rejected" &&
          candidateConnection.target_status === "rejected"
        );
      }

      return false;
    });

  const currentPageCandidateConnections = visibleCandidateConnections.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const columns: ColumnsType<ICandidateConnection> = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
    },
    {
      title: "匹配人A",
      dataIndex: "source_candidate_id",
      width: 120,
      render: (_, record: ICandidateConnection) => {
        return (
          <div
            onClick={() => {
              setSelectedCandidate(
                candidates.find(
                  (candidate) => candidate.id === record.source_candidate_id
                )
              );
              setCandidateDrawerOpen(true);
            }}
            style={{
              cursor: "pointer",
              color: "#1890ff",
              display: "inline-block",
            }}
          >
            {
              candidates.find(
                (candidate) => candidate.id === record.source_candidate_id
              )?.name
            }
          </div>
        );
      },
    },
    {
      title: "匹配人B",
      dataIndex: "target_candidate_id",
      width: 200,
      render: (_, record: ICandidateConnection) => {
        return (
          <div
            onClick={() => {
              setSelectedCandidate(
                candidates.find(
                  (candidate) => candidate.id === record.target_candidate_id
                )
              );
              setCandidateDrawerOpen(true);
            }}
            style={{
              cursor: "pointer",
              color: "#1890ff",
              display: "inline-block",
            }}
          >
            {
              candidates.find(
                (candidate) => candidate.id === record.target_candidate_id
              )?.name
            }
          </div>
        );
      },
    },
    {
      title: "匹配时间",
      dataIndex: "created_at",
      width: 150,
      render: (created_at: string) => {
        return dayjs(created_at).format("YYYY-MM-DD HH:mm:ss");
      },
    },
    {
      title: "匹配状态",
      dataIndex: "source_status",
      width: 150,
      render: (_, record: ICandidateConnection) => {
        if (
          record.source_status === "rejected" ||
          record.target_status === "rejected"
        ) {
          return <Tag color="red">匹配失败</Tag>;
        }
        if (
          record.source_status === "approved" &&
          record.target_status === "approved"
        ) {
          return <Tag color="green">匹配成功</Tag>;
        }
        return <Tag color="blue">匹配中</Tag>;
      },
    },
    {
      title: "失败理由",
      dataIndex: "reason",
      width: 150,
      render: (reason: string) => {
        return reason ?? "-";
      },
    },
    {
      title: "会议日程",
      dataIndex: "interview_info",
      width: 150,
      render: () => {
        return "TODO"; // TODO
      },
    },
  ];

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPageHeader}>匹配列表</div>
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
          <div>匹配状态: </div>
          <Select
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "所有匹配状态" },
              { value: "pending", label: "匹配中" },
              { value: "approved", label: "匹配成功" },
              { value: "rejected", label: "匹配失败" },
            ]}
          />
        </div>
      </div>
      <div className={styles.adminMain}>
        <Table<ICandidateConnection>
          loading={loading}
          style={{ height: "100%", overflow: "auto" }}
          rowKey="id"
          dataSource={currentPageCandidateConnections}
          columns={columns}
          pagination={{
            pageSize: PAGE_SIZE,
            current: page,
            total: visibleCandidateConnections.length,
            onChange: (page) => setPage(page),
            showSizeChanger: false,
          }}
          scroll={{ x: 1000, y: "100%" }}
        />
      </div>

      <Drawer
        open={candidateDrawerOpen}
        onClose={() => setCandidateDrawerOpen(false)}
        title={selectedCandidate?.name ?? ""}
        destroyOnClose
        width={1200}
      >
        {selectedCandidate && (
          <CandidateDrawerContent candidateId={selectedCandidate.id} />
        )}
      </Drawer>
    </div>
  );
};

export default CandidateConnections;
