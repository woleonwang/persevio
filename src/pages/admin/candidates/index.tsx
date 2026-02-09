import { Get } from "@/utils/request";
import { Button, Drawer, Input, message, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import styles from "../style.module.less";
import CandidateDrawerContent from "@/components/CandidateDrawerContent";
import { isTempAccount, parseJSON } from "@/utils";
import dayjs from "dayjs";

const PAGE_SIZE = 10;

type TCandidateListItemApi = {
  id: number;
  email: string;
  name: string;
  basic_info_json: string;
  resume_path: string;
  interview_finished_at: string;
  created_at: string;
  job_id?: number;
};

type TCandidateListItem = TCandidateListItemApi & {
  basic_info: {
    current_job_title: string;
    current_company: string;
    current_compensation: string;
    visa: string;
  };
};

const Candidates = () => {
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`admin_candidates.${key}`);

  const [candidates, setCandidates] = useState<TCandidateListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [candidateDrawerOpen, setCandidateDrawerOpen] = useState(false);
  const [candidate, setCandidate] = useState<TCandidateListItem>();

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { code, data } = await Get<{ candidates: TCandidateListItemApi[] }>(
        "/api/admin/candidates"
      );
      if (code === 0) {
        setCandidates(
          data.candidates.map((candidate) => ({
            ...candidate,
            basic_info: parseJSON(candidate.basic_info_json),
          }))
        );
      }
    } catch (error) {
      message.error(t("error.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const visibleCandidates = candidates.filter((candidate) => {
    if (!searchKeyword) return true;
    return (
      candidate.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  });

  const currentPageCandidates = visibleCandidates.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const columns: ColumnsType<TCandidateListItem> = [
    {
      title: t("table.id"),
      dataIndex: "id",
      width: 80,
    },
    {
      title: t("table.userName"),
      dataIndex: "name",
      width: 120,
    },
    {
      title: t("table.email"),
      dataIndex: "email",
      width: 200,
    },
    {
      title: t("table.createdAt"),
      dataIndex: "created_at",
      width: 150,
      render: (created_at: string) => {
        return dayjs(created_at).format("YYYY-MM-DD HH:mm:ss");
      },
    },
    {
      title: t("table.registerSource"),
      dataIndex: "job_id",
      width: 150,
      render: (job_id: number) => {
        return job_id ? t("registerSource.job") : t("registerSource.home");
      },
    },
    {
      title: t("table.status"),
      dataIndex: "status",
      width: 150,
      render: (_: string, record: TCandidateListItem) => {
        return record.interview_finished_at
          ? t("status.aiFinished")
          : !isTempAccount(record)
          ? t("status.boundEmail")
          : record.resume_path
          ? t("status.uploadedResume")
          : t("status.filledBasicInfo");
      },
    },
    {
      title: t("table.resumeDetail"),
      dataIndex: "resume_path",
      width: 150,
      render: (_, record: TCandidateListItem) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setCandidate(record);
            setCandidateDrawerOpen(true);
          }}
        >
          {t("table.view")}
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPageHeader}>{t("pageTitle")}</div>
      <div className={styles.adminFilter}>
        <div className={styles.adminFilterItem}>
          <div>{t("filters.userNameLabel")}</div>
          <Input
            placeholder={t("filters.userNamePlaceholder")}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
        </div>
      </div>
      <div className={styles.adminMain}>
        <Table<TCandidateListItem>
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
        {candidate && <CandidateDrawerContent candidateId={candidate.id} />}
      </Drawer>
    </div>
  );
};

export default Candidates;
