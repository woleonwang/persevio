import { useEffect, useMemo, useState } from "react";
import { Empty, Select, Spin, Table, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import dayjs from "dayjs";

import useJob from "@/hooks/useJob";
import { Get } from "@/utils/request";
import { parseJSON } from "@/utils";
import styles from "./style.module.less";

type TExtractBasicInfo = {
  work_experiences: {
    company_name: string;
    job_title: string;
    is_present: boolean;
  }[];
};

type TLinkedinProfileItem = TLinkedinProfile & {
  basicInfo: TExtractBasicInfo;
};

type TOutreachStatus = "reached_out" | "viewed_job_info" | "resume_submitted";

type TTableRow = {
  id: number;
  candidateName: string;
  currentJobTitle: string;
  currentCompany: string;
  status: TOutreachStatus;
  reachedOut: string;
  lastActivity: string;
};

const getStatus = (
  profile: TLinkedinProfileItem,
  hasTalent: boolean
): TOutreachStatus => {
  if (hasTalent || profile.candidate_id) {
    return "resume_submitted";
  }
  if (profile.message_read_at) {
    return "viewed_job_info";
  }
  if (profile.message_sent_at) {
    return "reached_out";
  }
  return "reached_out";
};

const getCurrentJob = (basicInfo: TExtractBasicInfo | undefined) => {
  const experiences = basicInfo?.work_experiences ?? [];
  const current = experiences.find((e) => e.is_present) ?? experiences[0];
  return {
    jobTitle: current?.job_title ?? "-",
    companyName: current?.company_name ?? "-",
  };
};

const JobOutreachCampaigns = () => {
  const { job } = useJob();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [linkedinProfiles, setLinkedinProfiles] = useState<
    TLinkedinProfileItem[]
  >([]);
  const [talents, setTalents] = useState<TTalent[]>([]);
  const [statusFilter, setStatusFilter] = useState<TOutreachStatus | "all">(
    "all"
  );

  const { t: originalT } = useTranslation();
  const t = (key: string) =>
    originalT(`job_details.outreach_campaigns_table.${key}`);

  useEffect(() => {
    if (!job?.id) return;

    const fetchData = async () => {
      setLoading(true);
      const { code, data } = await Get<{
        talents: TTalent[];
        linkedin_profiles: TLinkedinProfile[];
      }>(`/api/talents?job_id=${job.id}`);

      if (code === 0) {
        setTalents(data.talents ?? []);
        setLinkedinProfiles(
          (data.linkedin_profiles ?? []).map((p) => ({
            ...p,
            basicInfo: parseJSON(p.basic_info_json),
          }))
        );
      }
      setLoading(false);
    };

    fetchData();
  }, [job?.id]);

  const talentByCandidateId = useMemo(() => {
    const map = new Map<number, TTalent>();
    talents.forEach((t) => map.set(t.candidate_id, t));
    return map;
  }, [talents]);

  const tableData: TTableRow[] = useMemo(() => {
    return linkedinProfiles.map((profile) => {
      const hasTalent =
        !!profile.candidate_id && talentByCandidateId.has(profile.candidate_id);
      const status = getStatus(profile, hasTalent);
      const { jobTitle, companyName } = getCurrentJob(profile.basicInfo);

      const reachedOut = profile.message_sent_at
        ? dayjs(profile.message_sent_at).format("MMM D, YYYY")
        : "-";
      const lastActivity = profile.message_read_at
        ? dayjs(profile.message_read_at).format("MMM D, YYYY")
        : reachedOut;

      return {
        id: profile.id,
        candidateName: profile.name,
        currentJobTitle: jobTitle,
        currentCompany: companyName,
        status,
        reachedOut,
        lastActivity,
      };
    });
  }, [linkedinProfiles, talentByCandidateId]);

  const filteredData = useMemo(() => {
    if (statusFilter === "all") return tableData;
    return tableData.filter((row) => row.status === statusFilter);
  }, [tableData, statusFilter]);

  const columns = [
    {
      title: t("candidate_name"),
      dataIndex: "candidateName",
      key: "candidateName",
      width: 180,
    },
    {
      title: t("current_job_title"),
      dataIndex: "currentJobTitle",
      key: "currentJobTitle",
      width: 200,
    },
    {
      title: t("current_company"),
      dataIndex: "currentCompany",
      key: "currentCompany",
      width: 180,
    },
    {
      title: t("status"),
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status: TOutreachStatus) => {
        const statusConfig: Record<
          TOutreachStatus,
          { label: string; color: string }
        > = {
          reached_out: {
            label: t("reached_out_status"),
            color: "blue",
          },
          viewed_job_info: {
            label: t("viewed_job_info_status"),
            color: "gold",
          },
          resume_submitted: {
            label: t("resume_submitted_status"),
            color: "green",
          },
        };
        const config = statusConfig[status];
        return config ? (
          <Tag color={config.color}>{config.label}</Tag>
        ) : (
          <Tag>{status}</Tag>
        );
      },
    },
    {
      title: t("reached_out"),
      dataIndex: "reachedOut",
      key: "reachedOut",
      width: 140,
    },
    {
      title: t("last_activity"),
      dataIndex: "lastActivity",
      key: "lastActivity",
      width: 140,
    },
  ];

  if (!job) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {originalT("job_details.outreach_campaigns")}
        </h3>
        <Select
          className={styles.statusSelect}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={[
            { value: "all", label: t("all_statuses") },
            { value: "reached_out", label: t("reached_out_status") },
            { value: "viewed_job_info", label: t("viewed_job_info_status") },
            { value: "resume_submitted", label: t("resume_submitted_status") },
          ]}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>
          <Spin />
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <Table<TTableRow>
            scroll={{ x: "max-content" }}
            columns={columns}
            rowKey="id"
            dataSource={filteredData}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: <Empty style={{ margin: "60px 0" }} />,
            }}
            onRow={(record) => {
              return {
                onClick: () => {
                  if (!job?.id) return;
                  navigate(
                    `/app/jobs/${job.id}/standard-board/linkedin-profiles/${record.id}`
                  );
                },
              };
            }}
          />
        </div>
      )}
    </div>
  );
};

export default JobOutreachCampaigns;
