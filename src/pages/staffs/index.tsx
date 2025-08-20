import React, { useState, useEffect } from "react";
import { Table, Button, Input, Space } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { Get } from "@/utils/request";
import styles from "./style.module.less";

const Staffs: React.FC = () => {
  const navigate = useNavigate();
  const [staffs, setStaffs] = useState<IStaffWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 获取员工数据
  const fetchStaffs = async () => {
    setLoading(true);
    const { code, data } = await Get<{ staffs: IStaffWithAccount[] }>(
      "/api/staffs"
    );
    if (code === 0) {
      setStaffs(data.staffs);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  // 过滤员工数据
  const filteredStaffs = staffs.filter(
    (staff) =>
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.account.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 返回上一页
  const handleBack = () => {
    navigate(-1);
  };

  // 表格列定义
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      width: 120,
    },
    {
      title: "邮箱",
      dataIndex: ["account", "username"],
      key: "email",
      width: 200,
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role: string) => {
        return role === "admin" ? "管理员" : "员工";
      },
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_: any, record: IStaffWithAccount) => (
        <Space size="small">
          <Button type="link" size="small">
            编辑
          </Button>
          <Button type="link" size="small" danger>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.staffsPage}>
      {/* 头部区域 */}
      <div className={styles.headerSection}>
        <div className={styles.titleSection}>
          <ArrowLeftOutlined
            className={styles.backArrow}
            onClick={handleBack}
          />
          <h1 className={styles.pageTitle}>员工列表</h1>
        </div>
      </div>

      {/* 筛选和操作区域 */}
      <div className={styles.filterSection}>
        <div className={styles.searchSection}>
          <Input
            placeholder="员工姓名、账号邮箱"
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            allowClear
          />
        </div>

        <div className={styles.actionSection}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className={styles.createButton}
          >
            创建员工
          </Button>
        </div>
      </div>

      {/* 表格区域 */}
      <div className={styles.tableSection}>
        <Table
          columns={columns}
          dataSource={filteredStaffs}
          loading={loading}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            defaultPageSize: 10,
            pageSizeOptions: ["10", "20", "50"],
          }}
        />
      </div>
    </div>
  );
};

export default Staffs;
