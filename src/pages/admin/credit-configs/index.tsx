import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Delete, Get, Post } from "@/utils/request";
import adminStyles from "../style.module.less";
import ConfigDrawer from "./components/ConfigDrawer";
import DuplicateModal from "./components/DuplicateModal";
import {
  CUSTOM_CONFIG_PAGE_SIZE,
  CREDIT_CONFIG_TABLE_SCROLL_X,
} from "./constants";
import styles from "./style.module.less";
import type { ICreditConfig, ICompanyOption, IStaffOption } from "./types";
import { getDefaultFields, getResolvedFields } from "./utils";

type SortKey =
  | "id"
  | "name"
  | "currency"
  | "display_rate"
  | "topup_rate"
  | "updated_at"
  | "modified_by_staff_id";

const CreditConfigListPage = () => {
  const { t: originalT } = useTranslation();
  const t = (key: string, options?: Record<string, unknown>) =>
    originalT(`admin_credit_configs.${key}`, options);
  const navigate = useNavigate();

  const [configs, setConfigs] = useState<ICreditConfig[]>([]);
  const [companies, setCompanies] = useState<ICompanyOption[]>([]);
  const [staffOptions, setStaffOptions] = useState<IStaffOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState<number | undefined>();
  const [customPage, setCustomPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend">("descend");
  const [drawerConfig, setDrawerConfig] = useState<ICreditConfig | null>(null);
  const [duplicateSource, setDuplicateSource] = useState<ICreditConfig | null>(
    null,
  );
  const [duplicateLoading, setDuplicateLoading] = useState(false);

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((item) => [item.id, item.name])),
    [companies],
  );
  const staffNameMap = useMemo(
    () => Object.fromEntries(staffOptions.map((item) => [item.id, item.name])),
    [staffOptions],
  );
  const formatStaffName = (staffId?: number | null) =>
    staffId ? (staffNameMap[staffId] ?? `#${staffId}`) : "—";

  const defaultConfig = configs.find((item) => item.type === "default") ?? null;
  const customConfigs = configs.filter((item) => item.type === "custom");
  const defaultFields = useMemo(() => getDefaultFields(configs), [configs]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, companyRes, hunterRes] = await Promise.all([
        Get<{ configs: ICreditConfig[] }>("/api/admin/credit_configs"),
        Get<{ companies: ICompanyOption[] }>("/api/admin/companies/options"),
        Get<{ hunters: IStaffOption[] }>("/api/admin/hunters"),
      ]);
      if (configRes.code === 0) {
        setConfigs(configRes.data.configs);
      } else {
        message.error(t("messages.fetchFailed"));
      }
      if (companyRes.code === 0) {
        setCompanies(companyRes.data.companies);
      }
      if (hunterRes.code === 0) {
        setStaffOptions(hunterRes.data.hunters);
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

  const filteredCustomConfigs = useMemo(() => {
    return customConfigs.filter((item) => {
      const matchName =
        !nameFilter.trim() ||
        item.name.toLowerCase().includes(nameFilter.trim().toLowerCase());
      const matchCompany =
        !companyFilter || item.company_ids.includes(companyFilter);
      return matchName && matchCompany;
    });
  }, [customConfigs, nameFilter, companyFilter]);

  const sortedCustomConfigs = useMemo(() => {
    const list = [...filteredCustomConfigs];
    list.sort((a, b) => {
      const resolvedA = getResolvedFields(a, defaultFields);
      const resolvedB = getResolvedFields(b, defaultFields);
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortKey) {
        case "id":
          av = a.id;
          bv = b.id;
          break;
        case "name":
          av = a.name;
          bv = b.name;
          break;
        case "currency":
          av = a.currency;
          bv = b.currency;
          break;
        case "display_rate":
          av = resolvedA.display_rate.value ?? 0;
          bv = resolvedB.display_rate.value ?? 0;
          break;
        case "topup_rate":
          av = resolvedA.topup_rate.value ?? 0;
          bv = resolvedB.topup_rate.value ?? 0;
          break;
        case "modified_by_staff_id":
          av = a.modified_by_staff_id ?? 0;
          bv = b.modified_by_staff_id ?? 0;
          break;
        default:
          av = dayjs(a.updated_at).valueOf();
          bv = dayjs(b.updated_at).valueOf();
      }
      if (av < bv) {
        return sortOrder === "ascend" ? -1 : 1;
      }
      if (av > bv) {
        return sortOrder === "ascend" ? 1 : -1;
      }
      return 0;
    });
    return list;
  }, [filteredCustomConfigs, sortKey, sortOrder, defaultFields]);

  const pagedCustomConfigs = useMemo(() => {
    const start = (customPage - 1) * CUSTOM_CONFIG_PAGE_SIZE;
    return sortedCustomConfigs.slice(start, start + CUSTOM_CONFIG_PAGE_SIZE);
  }, [sortedCustomConfigs, customPage]);

  const buildColumns = (
    isDefaultTable: boolean,
  ): ColumnsType<ICreditConfig> => {
    return [
      {
        title: t("table.id"),
        dataIndex: "id",
        key: "id",
        width: 100,
        sorter: !isDefaultTable,
      },
      {
        title: t("table.name"),
        dataIndex: "name",
        key: "name",
        width: 220,
        sorter: !isDefaultTable,
      },
      {
        title: t("table.appliedEmployers"),
        dataIndex: "company_ids",
        key: "company_ids",
        width: 360,
        render: (companyIds: number[]) =>
          companyIds.length > 0 ? (
            <div className={styles.employerChips}>
              {companyIds.map((id) => (
                <Tag key={id}>{companyMap[id] ?? `#${id}`}</Tag>
              ))}
            </div>
          ) : (
            "—"
          ),
      },
      {
        title: t("table.currency"),
        dataIndex: "currency",
        key: "currency",
        width: 120,
        sorter: !isDefaultTable,
      },
      {
        title: t("table.displayRate"),
        key: "display_rate",
        width: 160,
        sorter: !isDefaultTable,
        render: (_, record) =>
          getResolvedFields(record, defaultFields).display_rate.value ?? "—",
      },
      {
        title: t("table.topupRate"),
        key: "topup_rate",
        width: 160,
        sorter: !isDefaultTable,
        render: (_, record) =>
          getResolvedFields(record, defaultFields).topup_rate.value ?? "—",
      },
      {
        title: t("table.modifiedTime"),
        dataIndex: "updated_at",
        key: "updated_at",
        width: 200,
        sorter: !isDefaultTable,
        defaultSortOrder: !isDefaultTable ? "descend" : undefined,
        render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm"),
      },
      {
        title: t("table.modifiedBy"),
        dataIndex: "modified_by_staff_id",
        key: "modified_by_staff_id",
        width: 160,
        sorter: !isDefaultTable,
        render: (value?: number | null) => formatStaffName(value),
      },
      {
        title: t("table.actions"),
        key: "actions",
        width: 350,
        fixed: "right" as const,
        render: (_, record) => (
          <Space onClick={(e) => e.stopPropagation()}>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() =>
                navigate(`/admin/credit-configs/${record.id}/edit`)
              }
            >
              {t("actions.edit")}
            </Button>
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={() => setDuplicateSource(record)}
            >
              {t("actions.duplicate")}
            </Button>
            {!isDefaultTable ? (
              <Popconfirm
                title={t("deleteConfirm")}
                onConfirm={async () => {
                  const { code, message: errMsg } = await Delete(
                    `/api/admin/credit_configs/${record.id}`,
                  );
                  if (code === 0) {
                    message.success(t("messages.deleteSuccess"));
                    fetchData();
                  } else {
                    message.error(errMsg || t("messages.deleteFailed"));
                  }
                }}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  {t("actions.delete")}
                </Button>
              </Popconfirm>
            ) : null}
          </Space>
        ),
      },
    ];
  };

  const handleDuplicate = async (name: string) => {
    if (!duplicateSource) {
      return;
    }
    setDuplicateLoading(true);
    try {
      const { code, data } = await Post<{ id: number; name: string }>(
        `/api/admin/credit_configs/${duplicateSource.id}/duplicate`,
        { name },
      );
      if (code === 0 && data?.id) {
        message.success(t("messages.duplicateSuccess"));
        setDuplicateSource(null);
        navigate(`/admin/credit-configs/${data.id}/edit`);
      } else {
        message.error(t("messages.duplicateFailed"));
      }
    } catch {
      message.error(t("messages.duplicateFailed"));
    } finally {
      setDuplicateLoading(false);
    }
  };

  const defaultColumns = buildColumns(true).filter(
    (column) =>
      column.key !== "company_ids" || defaultConfig?.type === "custom",
  );

  return (
    <div className={adminStyles.adminContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>{t("pageTitle")}</div>
      </div>

      <div className={styles.mainScroll}>
        <div className={styles.sectionTitleRow}>
          <div className={styles.sectionTitle}>{t("defaultSectionTitle")}</div>
        </div>
        <Table
          className={styles.configTable}
          loading={loading}
          rowKey="id"
          dataSource={defaultConfig ? [defaultConfig] : []}
          columns={defaultColumns.filter(
            (column) => column.key !== "company_ids",
          )}
          scroll={{ x: CREDIT_CONFIG_TABLE_SCROLL_X }}
          pagination={false}
          onRow={(record) => ({
            onClick: (event) => {
              if ((event.target as HTMLElement).closest("button,a")) {
                return;
              }
              setDrawerConfig(record);
            },
            style: { cursor: "pointer" },
          })}
        />

        <div className={styles.sectionTitleRow}>
          <div className={styles.sectionTitle}>{t("customSectionTitle")}</div>
        </div>
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <div className={styles.filterItem}>
              <span>{t("filters.configName")}</span>
              <Input
                allowClear
                style={{ width: 220 }}
                value={nameFilter}
                onChange={(e) => {
                  setNameFilter(e.target.value);
                  setCustomPage(1);
                }}
              />
            </div>
            <div className={styles.filterItem}>
              <span>{t("filters.appliedCompany")}</span>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ width: 260 }}
                placeholder={t("filters.selectCompany")}
                value={companyFilter}
                options={companies.map((item) => ({
                  label: item.name,
                  value: item.id,
                }))}
                onChange={(value) => {
                  setCompanyFilter(value);
                  setCustomPage(1);
                }}
              />
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/admin/credit-configs/new")}
          >
            {t("newCustomConfig")}
          </Button>
        </div>
        <Table
          className={styles.configTable}
          loading={loading}
          rowKey="id"
          dataSource={pagedCustomConfigs}
          columns={buildColumns(false)}
          scroll={{ x: CREDIT_CONFIG_TABLE_SCROLL_X }}
          pagination={{
            current: customPage,
            pageSize: CUSTOM_CONFIG_PAGE_SIZE,
            total: sortedCustomConfigs.length,
            showSizeChanger: false,
            onChange: setCustomPage,
          }}
          onChange={(_, __, sorter) => {
            if (Array.isArray(sorter) || !sorter.columnKey) {
              return;
            }
            setSortKey(sorter.columnKey as SortKey);
            setSortOrder(sorter.order === "ascend" ? "ascend" : "descend");
          }}
          onRow={(record) => ({
            onClick: (event) => {
              if ((event.target as HTMLElement).closest("button,a")) {
                return;
              }
              setDrawerConfig(record);
            },
            style: { cursor: "pointer" },
          })}
        />
      </div>

      <ConfigDrawer
        open={!!drawerConfig}
        config={drawerConfig}
        configs={configs}
        companyMap={companyMap}
        staffNameMap={staffNameMap}
        onClose={() => setDrawerConfig(null)}
        onDuplicate={setDuplicateSource}
        onDeleted={() => {
          message.success(t("messages.deleteSuccess"));
          fetchData();
        }}
      />

      <DuplicateModal
        open={!!duplicateSource}
        source={duplicateSource}
        configs={configs}
        loading={duplicateLoading}
        onCancel={() => setDuplicateSource(null)}
        onSubmit={handleDuplicate}
      />
    </div>
  );
};

export default CreditConfigListPage;
