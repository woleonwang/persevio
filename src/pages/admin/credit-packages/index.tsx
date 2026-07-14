import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Table,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Get, Post } from "@/utils/request";
import adminStyles from "../style.module.less";

const PAGE_SIZE = 20;

const SOURCE_TYPE_OPTIONS = ["topup", "gift", "adjustment"] as const;

interface ICreditPackage {
  id: number;
  company_id: number;
  original_amount: number;
  remaining_amount: number;
  valid_from?: string | null;
  expires_at?: string | null;
  description?: string;
  created_by_staff_id?: number | null;
  created_at: string;
  updated_at: string;
}

interface ICompanyOption {
  id: number;
  name: string;
}

interface ICreateFormValues {
  company_id: number;
  amount: number;
  description?: string;
  source_type?: string;
  valid_from?: Dayjs;
  expires_at?: Dayjs;
}

const CreditPackageListPage = () => {
  const { t: originalT } = useTranslation();
  const t = (key: string, options?: Record<string, unknown>) =>
    originalT(`admin_credit_packages.${key}`, options);

  const [packages, setPackages] = useState<ICreditPackage[]>([]);
  const [companies, setCompanies] = useState<ICompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [companyFilter, setCompanyFilter] = useState<number | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<ICreateFormValues>();

  const companyMap = Object.fromEntries(
    companies.map((item) => [item.id, item.name]),
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [packageRes, companyRes] = await Promise.all([
        Get<{ packages: ICreditPackage[] }>("/api/admin/credit_packages"),
        Get<{ companies: ICompanyOption[] }>("/api/admin/companies/options"),
      ]);
      if (packageRes.code === 0) {
        setPackages(packageRes.data.packages);
      } else {
        message.error(t("messages.fetchFailed"));
      }
      if (companyRes.code === 0) {
        setCompanies(companyRes.data.companies);
      }
    } catch {
      message.error(t("messages.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [companyFilter]);

  const filteredPackages = packages.filter((item) => {
    if (!companyFilter) {
      return true;
    }
    return item.company_id === companyFilter;
  });

  const formatDateTime = (value?: string | null) =>
    value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "—";

  const columns: ColumnsType<ICreditPackage> = [
    {
      title: t("table.id"),
      dataIndex: "id",
      width: 80,
    },
    {
      title: t("table.company"),
      dataIndex: "company_id",
      width: 180,
      render: (companyId: number) => companyMap[companyId] ?? `#${companyId}`,
    },
    {
      title: t("table.originalAmount"),
      dataIndex: "original_amount",
      width: 120,
    },
    {
      title: t("table.remainingAmount"),
      dataIndex: "remaining_amount",
      width: 120,
    },
    {
      title: t("table.validFrom"),
      dataIndex: "valid_from",
      width: 180,
      render: formatDateTime,
    },
    {
      title: t("table.expiresAt"),
      dataIndex: "expires_at",
      width: 180,
      render: formatDateTime,
    },
    {
      title: t("table.description"),
      dataIndex: "description",
      ellipsis: true,
    },
    {
      title: t("table.createdBy"),
      dataIndex: "created_by_staff_id",
      width: 100,
      render: (staffId?: number | null) => (staffId ? `#${staffId}` : "—"),
    },
    {
      title: t("table.createdAt"),
      dataIndex: "created_at",
      width: 180,
      render: formatDateTime,
    },
  ];

  const showCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({ source_type: "gift" });
    setIsModalOpen(true);
  };

  const handleCreate = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const payload = {
        company_id: values.company_id,
        amount: values.amount,
        description: values.description?.trim() ?? "",
        source_type: values.source_type || "gift",
        valid_from: values.valid_from
          ? values.valid_from.toISOString()
          : undefined,
        expires_at: values.expires_at
          ? values.expires_at.toISOString()
          : undefined,
      };
      const { code } = await Post("/api/admin/credit_packages", payload);
      if (code === 0) {
        message.success(t("messages.createSuccess"));
        setIsModalOpen(false);
        fetchData();
      } else {
        message.error(t("messages.createFailed"));
      }
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={adminStyles.adminContainer}>
      <div className={adminStyles.adminPageHeader}>{t("pageTitle")}</div>

      <div className={adminStyles.adminFilter}>
        <div className={adminStyles.adminFilterItem}>
          <span>{t("filters.company")}</span>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={t("filters.selectCompany")}
            style={{ width: 260 }}
            value={companyFilter}
            onChange={(value) => setCompanyFilter(value)}
            options={companies.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showCreateModal}
        >
          {t("actions.create")}
        </Button>
      </div>

      <div className={adminStyles.adminMain}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredPackages}
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize: PAGE_SIZE,
            total: filteredPackages.length,
            showSizeChanger: false,
            onChange: (page) => setCurrentPage(page),
          }}
        />
      </div>

      <Modal
        title={t("createModalTitle")}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="company_id"
            label={t("form.company")}
            rules={[
              { required: true, message: t("validation.companyRequired") },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={t("form.selectCompany")}
              options={companies.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label={t("form.amount")}
            rules={[
              { required: true, message: t("validation.amountRequired") },
              {
                type: "number",
                min: 1,
                message: t("validation.amountPositive"),
              },
            ]}
          >
            <InputNumber min={1} precision={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="source_type" label={t("form.sourceType")}>
            <Select
              options={SOURCE_TYPE_OPTIONS.map((value) => ({
                value,
                label: t(`sourceType.${value}`),
              }))}
            />
          </Form.Item>
          <Form.Item name="description" label={t("form.description")}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="valid_from" label={t("form.validFrom")}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="expires_at" label={t("form.expiresAt")}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CreditPackageListPage;
