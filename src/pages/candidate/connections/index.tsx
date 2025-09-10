import { useEffect, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Tabs, Input } from "antd";
import { Get } from "@/utils/request";
import styles from "./style.module.less";
import ConnectionsList, { getFinalStatus } from "../components/ConnectionsList";
import type { TCandidateConnectionForCandidate } from "../components/ConnectionsList";

// 过滤状态类型
type FilterStatus =
  | "all"
  | "pending"
  | "matching"
  | "approved"
  | "rejected"
  | "stored";

const CandidateConnections = () => {
  const [connections, setConnections] = useState<
    TCandidateConnectionForCandidate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [searchName, setSearchName] = useState("");

  useEffect(() => {
    fetchConnections();
  }, []);

  // 获取匹配数据
  const fetchConnections = async () => {
    setLoading(true);
    const response = await Get<{
      candidate_connections: TCandidateConnectionForCandidate[];
    }>("/api/candidate/candidate_connections");
    if (response.code === 0) {
      setConnections(response.data.candidate_connections);
    }
    setLoading(false);
  };

  // 动态计算过滤后的连接
  const getFilteredConnections = () => {
    let filtered = connections;

    // 按状态过滤
    if (activeFilter !== "all") {
      filtered = connections.filter((conn) => {
        const finalStatus = getFinalStatus(conn.status, conn.target_status);
        return finalStatus === activeFilter;
      });
    }

    // 按姓名搜索
    if (searchName.trim()) {
      filtered = filtered.filter((conn) =>
        conn.target_candidate.name
          .toLowerCase()
          .includes(searchName.toLowerCase())
      );
    }

    return filtered;
  };

  const filterTabs = [
    { key: "all", label: "所有匹配状态" },
    { key: "pending", label: "未处理" },
    { key: "matching", label: "匹配中" },
    { key: "approved", label: "匹配成功" },
    { key: "rejected", label: "匹配失败" },
    { key: "stored", label: "已暂存" },
  ];

  const tabItems = filterTabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>Matches/Meetings</div>

      <div className={styles.navBar}>
        <Tabs
          activeKey={activeFilter}
          onChange={(key) => setActiveFilter(key as FilterStatus)}
          items={tabItems}
          className={styles.tabs}
          tabBarStyle={{ borderBottom: "none" }}
          tabBarExtraContent={
            <Input
              placeholder="匹配人姓名"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              prefix={<SearchOutlined />}
              className={styles.searchInput}
            />
          }
        />
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : (
          <ConnectionsList
            connections={getFilteredConnections()}
            onRefresh={fetchConnections}
          />
        )}
      </div>
    </div>
  );
};

export default CandidateConnections;
