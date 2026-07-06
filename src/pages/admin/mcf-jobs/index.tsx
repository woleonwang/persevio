import { Get } from "@/utils/request";
import {
  Button,
  DatePicker,
  Drawer,
  Input,
  InputNumber,
  message,
  Select,
  Table,
} from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import pageStyles from "./style.module.less";

const PAGE_SIZE = 20;

type TMcfJobFilters = {
  search?: string;
  status?: string;
  ssocCode?: string;
  addressRegion?: string;
  isPostedOnBehalf?: boolean;
  salaryMin?: number;
  category?: string;
  employmentType?: string;
  positionLevel?: string;
  companyUen?: string;
  companyName?: string;
  newPostingDateFrom?: string;
  newPostingDateTo?: string;
};

const parseCategoryLabels = (categoriesJson?: string) => {
  if (!categoriesJson) {
    return "-";
  }
  try {
    const categories = JSON.parse(categoriesJson) as Array<{ category?: string }>;
    const labels = categories.map((item) => item.category).filter(Boolean);
    return labels.length > 0 ? labels.join(", ") : "-";
  } catch {
    return categoriesJson;
  }
};

const formatSalary = (job: IMcfJobListItem) => {
  if (job.salary_min == null && job.salary_max == null) {
    return "-";
  }
  const min = job.salary_min ?? "-";
  const max = job.salary_max ?? "-";
  const type = job.salary_type ? ` ${job.salary_type}` : "";
  return `${min} - ${max}${type}`;
};

const formatRawJson = (raw?: string) => {
  if (!raw) {
    return "";
  }
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
};

const McfJobs = () => {
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`admin_mcf_jobs.${key}`);

  const [jobs, setJobs] = useState<IMcfJobListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<IMcfJobListItem>();

  const [search, setSearch] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [ssocCode, setSsocCode] = useState<string>();
  const [addressRegion, setAddressRegion] = useState<string>();
  const [isPostedOnBehalf, setIsPostedOnBehalf] = useState<boolean>();
  const [salaryMin, setSalaryMin] = useState<number>();
  const [category, setCategory] = useState<string>();
  const [employmentType, setEmploymentType] = useState<string>();
  const [positionLevel, setPositionLevel] = useState<string>();
  const [companyUen, setCompanyUen] = useState<string>();
  const [companyName, setCompanyName] = useState<string>();
  const [newPostingDateRange, setNewPostingDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >();
  const [fetchParams, setFetchParams] = useState<TMcfJobFilters>();

  useEffect(() => {
    fetchJobs();
  }, [fetchParams, page]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { code, data } = await Get<{ jobs: IMcfJobListItem[]; total: number }>(
        "/api/admin/mcf_jobs",
        {
          page,
          search: fetchParams?.search,
          status: fetchParams?.status,
          ssoc_code: fetchParams?.ssocCode,
          address_region: fetchParams?.addressRegion,
          is_posted_on_behalf:
            fetchParams?.isPostedOnBehalf === undefined
              ? undefined
              : String(fetchParams.isPostedOnBehalf),
          salary_min: fetchParams?.salaryMin,
          category: fetchParams?.category,
          employment_type: fetchParams?.employmentType,
          position_level: fetchParams?.positionLevel,
          company_uen: fetchParams?.companyUen,
          company_name: fetchParams?.companyName,
          new_posting_date_from: fetchParams?.newPostingDateFrom,
          new_posting_date_to: fetchParams?.newPostingDateTo,
        },
      );
      if (code === 0) {
        setJobs(data.jobs);
        setTotal(data.total);
      } else {
        message.error(t("messages.fetchListFailed"));
      }
    } catch {
      message.error(t("messages.fetchListFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPage(1);
    setFetchParams({
      search,
      status,
      ssocCode,
      addressRegion,
      isPostedOnBehalf,
      salaryMin,
      category,
      employmentType,
      positionLevel,
      companyUen,
      companyName,
      newPostingDateFrom: newPostingDateRange?.[0]?.format("YYYY-MM-DD"),
      newPostingDateTo: newPostingDateRange?.[1]?.format("YYYY-MM-DD"),
    });
  };

  const handleClearFilters = () => {
    setSearch(undefined);
    setStatus(undefined);
    setSsocCode(undefined);
    setAddressRegion(undefined);
    setIsPostedOnBehalf(undefined);
    setSalaryMin(undefined);
    setCategory(undefined);
    setEmploymentType(undefined);
    setPositionLevel(undefined);
    setCompanyUen(undefined);
    setCompanyName(undefined);
    setNewPostingDateRange(null);
    setPage(1);
    setFetchParams({});
  };

  const handleOpenDetail = (job: IMcfJobListItem) => {
    setSelectedJob(job);
    setDrawerOpen(true);
  };

  const columns: ColumnsType<IMcfJobListItem> = [
    { title: t("table.jobPostId"), dataIndex: "job_post_id" },
    { title: t("table.title"), dataIndex: "title" },
    { title: t("table.status"), dataIndex: "status" },
    {
      title: t("table.company"),
      dataIndex: "company_name",
      render: (_, record) => record.company_name || "-",
    },
    {
      title: t("table.agency"),
      dataIndex: "agency_name",
      render: (_, record) => record.agency_name || "-",
    },
    {
      title: t("table.salary"),
      dataIndex: "salary_min",
      render: (_, record) => formatSalary(record),
    },
    { title: t("table.ssocCode"), dataIndex: "ssoc_code" },
    {
      title: t("table.category"),
      dataIndex: "categories_json",
      render: (value: string) => parseCategoryLabels(value),
    },
    { title: t("table.region"), dataIndex: "address_region" },
    {
      title: t("table.newPostingDate"),
      dataIndex: "new_posting_date",
      render: (value?: string) => (value ? dayjs(value).format("YYYY-MM-DD") : "-"),
    },
    {
      title: t("table.expiryDate"),
      dataIndex: "expiry_date",
      render: (value?: string) => (value ? dayjs(value).format("YYYY-MM-DD") : "-"),
    },
    {
      title: t("table.views"),
      dataIndex: "total_number_of_view",
    },
    {
      title: t("table.applications"),
      dataIndex: "total_number_job_application",
    },
    {
      title: t("table.onBehalf"),
      dataIndex: "is_posted_on_behalf",
      render: (value: boolean) => (value ? t("table.yes") : t("table.no")),
    },
    {
      title: t("table.actions"),
      dataIndex: "actions",
      width: 180,
      fixed: "right",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => handleOpenDetail(record)}>
            {t("table.view")}
          </Button>
          {record.job_details_url ? (
            <Button
              type="link"
              href={record.job_details_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("table.openMcf")}
            </Button>
          ) : null}
        </>
      ),
    },
  ];

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.pageHeader}>{t("pageTitle")}</div>
      <div className={pageStyles.filterSection}>
        <div className={pageStyles.filterItem}>
          <div className={pageStyles.filterItemLabel}>{t("filters.search")}:</div>
          <Input
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value || undefined)}
            placeholder={t("filters.searchPlaceholder")}
            style={{ width: 200 }}
          />
        </div>
        <div className={pageStyles.filterItem}>
          <div className={pageStyles.filterItemLabel}>{t("filters.status")}:</div>
          <Select
            allowClear
            value={status}
            onChange={(value) => setStatus(value)}
            options={[
              { label: "Open", value: "Open" },
              { label: "Closed", value: "Closed" },
            ]}
            style={{ width: 120 }}
          />
        </div>
        <div className={pageStyles.filterItem}>
          <div className={pageStyles.filterItemLabel}>{t("filters.ssocCode")}:</div>
          <Input
            allowClear
            value={ssocCode}
            onChange={(e) => setSsocCode(e.target.value || undefined)}
            style={{ width: 120 }}
          />
        </div>
        <div className={pageStyles.filterItem}>
          <div className={pageStyles.filterItemLabel}>{t("filters.addressRegion")}:</div>
          <Input
            allowClear
            value={addressRegion}
            onChange={(e) => setAddressRegion(e.target.value || undefined)}
            style={{ width: 140 }}
          />
        </div>
        <div className={pageStyles.filterItem}>
          <div className={pageStyles.filterItemLabel}>{t("filters.category")}:</div>
          <Input
            allowClear
            value={category}
            onChange={(e) => setCategory(e.target.value || undefined)}
            style={{ width: 160 }}
          />
        </div>
        <div className={pageStyles.filterItem}>
          <div className={pageStyles.filterItemLabel}>{t("filters.employmentType")}:</div>
          <Input
            allowClear
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value || undefined)}
            style={{ width: 140 }}
          />
        </div>
        <div className={pageStyles.filterItem}>
          <div className={pageStyles.filterItemLabel}>{t("filters.positionLevel")}:</div>
          <Input
            allowClear
            value={positionLevel}
            onChange={(e) => setPositionLevel(e.target.value || undefined)}
            style={{ width: 140 }}
          />
        </div>
        <div className={pageStyles.filterItem}>
          <div className={pageStyles.filterItemLabel}>{t("filters.salaryMin")}:</div>
          <InputNumber
            min={0}
            value={salaryMin}
            onChange={(value) => setSalaryMin(value ?? undefined)}
            style={{ width: 120 }}
          />
        </div>
        <div className={pageStyles.filterItem}>
          <div className={pageStyles.filterItemLabel}>{t("filters.companyUen")}:</div>
          <Input
            allowClear
            value={companyUen}
            onChange={(e) => setCompanyUen(e.target.value || undefined)}
            style={{ width: 160 }}
          />
        </div>
        <div className={pageStyles.filterItem}>
          <div className={pageStyles.filterItemLabel}>{t("filters.companyName")}:</div>
          <Input
            allowClear
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value || undefined)}
            style={{ width: 180 }}
          />
        </div>
        <div className={pageStyles.filterItem}>
          <div className={pageStyles.filterItemLabel}>{t("filters.isPostedOnBehalf")}:</div>
          <Select
            allowClear
            value={isPostedOnBehalf}
            onChange={(value) => setIsPostedOnBehalf(value)}
            options={[
              { label: t("table.yes"), value: true },
              { label: t("table.no"), value: false },
            ]}
            style={{ width: 120 }}
          />
        </div>
        <div className={pageStyles.filterItem}>
          <div className={pageStyles.filterItemLabel}>{t("filters.newPostingDate")}:</div>
          <DatePicker.RangePicker
            value={newPostingDateRange}
            onChange={(value) => setNewPostingDateRange(value)}
          />
        </div>
        <div className={pageStyles.filterActions}>
          <Button type="primary" onClick={handleFilter}>
            {t("filters.filter")}
          </Button>
          <Button onClick={handleClearFilters}>{t("filters.clear")}</Button>
        </div>
      </div>
      <div className={pageStyles.tableSection}>
        <Table<IMcfJobListItem>
          loading={loading}
          rowKey="id"
          dataSource={jobs}
          columns={columns}
          scroll={{ x: "max-content" }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            showSizeChanger: false,
            onChange: (nextPage) => setPage(nextPage),
          }}
        />
      </div>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={960}
        title={`${t("drawer.titlePrefix")} ${selectedJob?.job_post_id ?? ""}`}
        destroyOnClose
      >
        <pre className={pageStyles.rawJson}>{formatRawJson(selectedJob?.raw)}</pre>
      </Drawer>
    </div>
  );
};

export default McfJobs;
