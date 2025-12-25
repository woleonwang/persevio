import React, { useState, useEffect } from "react";
import { Input, Select, Table, Button, Space, message, Modal } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import styles from "./style.module.less";
import { Get, Post } from "@/utils/request";
import { useTranslation } from "react-i18next";
import { parseJSON } from "@/utils";
import { ColumnsType } from "antd/es/table";

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
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`admin_companies.${key}`);

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
      message.error(t("fetchFailed"));
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
      title: t("audit.title"),
      content:
        action === "approve"
          ? t("audit.confirmApprove")
          : t("audit.confirmReject"),
      onOk: async () => {
        const { code } = await Post(
          `/api/admin/companies/${companyId}/audit/${action}`
        );
        if (code === 0) {
          message.success(
            action === "approve"
              ? t("audit.approveSuccess")
              : t("audit.rejectSuccess")
          );
          // 重新获取数据
          fetchCompanies();
        } else {
          message.error(t("operationFailed"));
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
        statusText = t("status.approving");
        break;
      case "rejected":
        className = styles.statusRejected;
        statusText = t("status.rejected");
        break;
      case "approved":
        className = styles.statusApproved;
        statusText = t("status.approved");
        break;
      default:
        statusText = status;
    }

    return <span className={className}>{statusText}</span>;
  };

  // 表格列定义
  const columns: ColumnsType<ICompany> = [
    {
      title: t("table.id"),
      dataIndex: "id",
      key: "id",
      width: 80,
      ellipsis: false,
    },
    {
      title: t("table.companyName"),
      dataIndex: "name",
      key: "name",
      width: 200,
      ellipsis: false,
    },
    {
      title: t("table.registerEmail"),
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
      title: t("table.website"),
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
      title: t("table.registrantName"),
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
      title: t("table.position"),
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
      title: t("table.phone"),
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
      title: t("table.companySize"),
      dataIndex: "size",
      key: "size",
      width: 150,
      ellipsis: false,
      render: (size: TCompanySize) =>
        size ? originalT(`signup.company_size_options.${size}`) : "-",
    },
    {
      title: t("table.roleType"),
      dataIndex: "recruitment_requirements_json",
      key: "role_type",
      width: 150,
      ellipsis: false,
      render: (recruitmentRequirements: string) => {
        const requirements = parseJSON(recruitmentRequirements);
        return (
          (requirements.role_type ?? [])
            .map((role: string) =>
              originalT(`signup.role_type_options.${role}`)
            )
            .join(", ") || "-"
        );
      },
    },
    {
      title: t("table.headcount"),
      dataIndex: "recruitment_requirements_json",
      key: "headcount_number",
      width: 150,
      ellipsis: false,
      render: (recruitmentRequirements: string) => {
        const requirements = parseJSON(recruitmentRequirements);
        return requirements.headcount_number || "-";
      },
    },
    {
      title: t("table.status"),
      dataIndex: "status",
      key: "status",
      width: 150,
      ellipsis: false,
      fixed: "right",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: t("table.actions"),
      key: "action",
      width: 200,
      ellipsis: false,
      fixed: "right",
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
                {t("buttons.reject")}
              </Button>
              <Button
                type="primary"
                size="small"
                onClick={() => handleAudit(record.id, "approve")}
              >
                {t("buttons.approve")}
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
      originalT("admin_companies.pagination.total", {
        start: range[0],
        end: range[1],
        total,
      }),
    onChange: (page: number) => {
      setCurrentPage(page);
    },
  };

  return (
    <div className={styles.companiesPage}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <ArrowLeftOutlined className={styles.backIcon} />
          <h1 className={styles.pageTitle}>{t("pageTitle")}</h1>
        </div>
      </div>

      <div className={styles.filterSection}>
        <Input.Search
          placeholder={t("searchPlaceholder")}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className={styles.searchInput}
        />

        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 200 }}
        >
          <Option value="all">{t("filters.all")}</Option>
          <Option value="approving">{t("filters.approving")}</Option>
          <Option value="approved">{t("filters.approved")}</Option>
          <Option value="rejected">{t("filters.rejected")}</Option>
        </Select>
      </div>

      <div className={styles.tableWrapper}>
        <Table
          scroll={{ x: "max-content" }}
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
