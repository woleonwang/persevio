import React, { useState, useEffect } from "react";
import { Input, Select, Table, Button, Space, message, Modal } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import styles from "./style.module.less";
import { Get, Post } from "@/utils/request";

const { Option } = Select;

interface RegisterInfo {
  email: string;
  name: string;
  phone: string;
  position: string;
}

const PAGE_SIZE = 10;
const AdminCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCompanies();
  }, []);

  // 筛选和搜索
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter]);

  // 获取公司列表
  const fetchCompanies = async () => {
    setLoading(true);
    const { code, data } = await Get("/api/all_companies");
    if (code === 0) {
      setCompanies(data.companies.reverse());
    } else {
      message.error("获取公司列表失败");
    }

    setLoading(false);
  };

  const visibleCompanies = companies
    .filter(
      (company) => statusFilter === "all" || company.status === statusFilter
    )
    .filter(
      (company) =>
        !searchText ||
        company.name.toLowerCase().includes(searchText.toLowerCase())
    );

  // 处理审核操作
  const handleAudit = async (
    companyId: number,
    action: "approve" | "reject"
  ) => {
    Modal.confirm({
      title: `审核企业`,
      content: `确定要${action === "approve" ? "通过" : "拒绝"}该企业吗？`,
      onOk: async () => {
        const { code } = await Post(
          `/api/admin/companies/${companyId}/audit/${action}`
        );
        if (code === 0) {
          message.success(`已${action === "approve" ? "通过" : "拒绝"}该公司`);
          // 重新获取数据
          fetchCompanies();
        } else {
          message.error("操作失败");
        }
      },
    });
  };

  // 解析 register_info
  const parseRegisterInfo = (registerInfo: string): RegisterInfo => {
    try {
      return JSON.parse(registerInfo);
    } catch {
      return { email: "", name: "", phone: "", position: "" };
    }
  };

  // 获取状态标签样式
  const getStatusTag = (status: string) => {
    let className = "";
    let statusText = "";

    switch (status) {
      case "approving":
        className = styles.statusPending;
        statusText = "审核中";
        break;
      case "rejected":
        className = styles.statusRejected;
        statusText = "未通过";
        break;
      case "approved":
        className = styles.statusApproved;
        statusText = "已通过";
        break;
      default:
        statusText = status;
    }

    return <span className={className}>{statusText}</span>;
  };

  // 表格列定义
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      ellipsis: false,
    },
    {
      title: "公司名称",
      dataIndex: "name",
      key: "name",
      width: 200,
      ellipsis: false,
    },
    {
      title: "注册邮箱",
      dataIndex: "register_info",
      key: "email",
      width: 200,
      ellipsis: false,
      render: (registerInfo: string) => {
        const info = parseRegisterInfo(registerInfo);
        return info.email;
      },
    },
    {
      title: "公司网址",
      dataIndex: "website",
      key: "website",
      width: 200,
      ellipsis: false,
      render: (website: string) => (
        <a href={website} target="_blank" rel="noopener noreferrer">
          {website}
        </a>
      ),
    },
    {
      title: "注册人姓名",
      dataIndex: "register_info",
      key: "registrantName",
      width: 150,
      ellipsis: false,
      render: (registerInfo: string) => {
        const info = parseRegisterInfo(registerInfo);
        return info.name;
      },
    },
    {
      title: "职位名称",
      dataIndex: "register_info",
      key: "position",
      width: 150,
      ellipsis: false,
      render: (registerInfo: string) => {
        const info = parseRegisterInfo(registerInfo);
        return info.position;
      },
    },
    {
      title: "电话号码",
      dataIndex: "register_info",
      key: "phone",
      width: 150,
      ellipsis: false,
      render: (registerInfo: string) => {
        const info = parseRegisterInfo(registerInfo);
        return info.phone;
      },
    },
    {
      title: "审核状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      ellipsis: false,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      ellipsis: false,
      render: (_: any, record: ICompany) => {
        if (record.status === "approving") {
          return (
            <Space>
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
            </Space>
          );
        }
        return null;
      },
    },
  ];

  // 分页配置
  const pagination = {
    current: currentPage,
    pageSize: PAGE_SIZE,
    total: visibleCompanies.length,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) =>
      `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
    onChange: (page: number) => {
      setCurrentPage(page);
    },
  };

  return (
    <div className={styles.companiesPage}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <ArrowLeftOutlined className={styles.backIcon} />
          <h1 className={styles.pageTitle}>公司列表</h1>
        </div>
      </div>

      <div className={styles.filterSection}>
        <Input.Search
          placeholder="公司名称"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className={styles.searchInput}
        />

        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 200 }}
        >
          <Option value="all">所有</Option>
          <Option value="approving">审核中</Option>
          <Option value="approved">已通过</Option>
          <Option value="rejected">未通过</Option>
        </Select>
      </div>

      <div className={styles.tableWrapper}>
        <Table
          columns={columns}
          dataSource={visibleCompanies.slice(
            (currentPage - 1) * PAGE_SIZE,
            currentPage * PAGE_SIZE
          )}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          className={styles.companiesTable}
        />
      </div>
    </div>
  );
};

export default AdminCompanies;
