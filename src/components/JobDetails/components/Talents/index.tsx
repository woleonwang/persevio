import { useEffect, useMemo, useState } from "react";
import { Button, Table, Tag, Tooltip } from "antd";
import { useNavigate } from "react-router";
import { ColumnsType } from "antd/es/table";

import { Get } from "@/utils/request";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { parseJSON } from "@/utils";
import dayjs from "dayjs";
import Empty from "@/components/Empty";

interface IProps {
  jobId: number;
}

type TDataSourceItem = {
  talent?: TTalentItem;
  linkedinProfile?: TLinkedinProfile;
};

type TTalentItem = TTalent & {
  current_job_title: string;
  current_company: string;
  current_compensation: string;
  visa: string;
  interviews: TInterview[];
};

const Talents = (props: IProps) => {
  const { jobId } = props;
  const [talents, setTalents] = useState<TTalentItem[]>([]);
  const [linkedinProfiles, setLinkedinProfiles] = useState<TLinkedinProfile[]>(
    []
  );

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_talents.${key}`);

  useEffect(() => {
    if (jobId) {
      fetchTalents();
    }
  }, [jobId]);

  const fetchTalents = async () => {
    const { code, data } = await Get<{
      talents: TTalent[];
      linkedin_profiles: TLinkedinProfile[];
    }>(`/api/jobs/${jobId}/talents`);

    if (code === 0) {
      setTalents(
        data.talents.map((talent) => {
          return {
            ...talent,
            ...parseJSON(talent.basic_info_json),
          };
        })
      );
      setLinkedinProfiles(data.linkedin_profiles);
    }
  };

  const columns: ColumnsType<TDataSourceItem> = [
    {
      title: t("candidate_name"),
      dataIndex: "name",
      render: (_: string, record: TDataSourceItem) => {
        return record.talent?.name || record.linkedinProfile?.name || "-";
      },
    },
    {
      title: t("current_job_title"),
      dataIndex: "current_job_title",
      render: (_: string, record: TDataSourceItem) => {
        return record.talent?.current_job_title || "-";
      },
    },
    {
      title: t("current_company"),
      dataIndex: "current_company",
      render: (_: string, record: TDataSourceItem) => {
        return record.talent?.current_company || "-";
      },
    },
    {
      title: t("current_compensation"),
      dataIndex: "current_compensation",
      render: (_: string, record: TDataSourceItem) => {
        return record.talent?.current_compensation || "-";
      },
    },
    {
      title: t("visa"),
      dataIndex: "visa",
      render: (_: string, record: TDataSourceItem) => {
        return record.talent?.visa || "-";
      },
    },
    {
      title: t("received_on"),
      dataIndex: "created_at",
      render: (_: string, record: TDataSourceItem) => {
        return dayjs(
          record.talent?.created_at || record.linkedinProfile?.created_at
        ).format("YYYY-MM-DD HH:mm:ss");
      },
    },
    {
      title: t("screening_status"),
      dataIndex: "status",
      render: (_: string, record: TDataSourceItem) => {
        const talent = record.talent;
        if (!talent) {
          return "-";
        }

        const status = talent?.status;
        if (status === "accepted") {
          if (!talent.interviews?.length) {
            return <Tag color="green">{t("status_pending_interview")}</Tag>;
          } else if (!talent.interviews[0].scheduled_at) {
            return (
              <Tag color="green">{t("status_pending_candidate_confirm")}</Tag>
            );
          } else {
            return <Tag color="green">{t("status_interview_scheduled")}</Tag>;
          }
        }
        if (status === "rejected") {
          return <Tag color="red">{t("status_rejected")}</Tag>;
        }
        return <Tag color="default">{t("status_unfiltered")}</Tag>;
      },
    },
    {
      title: t("feedback"),
      dataIndex: "feedback",
      render: (_: string, record: TDataSourceItem) => {
        const feedback = record.talent?.feedback;
        if (!feedback) {
          return "-";
        }

        return (
          <Tooltip title={feedback}>
            <div
              style={{
                maxWidth: 100,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {feedback || "-"}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: t("interview_mode"),
      dataIndex: "interview_mode",
      render: (_: string, record: TDataSourceItem) => {
        const interview = record.talent?.interviews?.[0];
        return interview ? t(interview.mode) : "-";
      },
    },
    {
      title: t("schedule_time"),
      dataIndex: "scheduled_at",
      render: (_: string, record: TDataSourceItem) => {
        const scheduled_at = record.talent?.interviews?.[0]?.scheduled_at;
        return scheduled_at
          ? dayjs(scheduled_at).format("YYYY-MM-DD HH:mm")
          : "-";
      },
    },
    {
      title: t("action"),
      dataIndex: "action",
      fixed: "right" as const,
      render: (_: any, record: TDataSourceItem) => {
        return record.talent ? (
          <Button
            type="link"
            onClick={() => {
              navigate(
                `/app/jobs/${jobId}/standard-board/talents/${record.talent?.id}`
              );
            }}
          >
            {t("view")}
          </Button>
        ) : (
          <Button
            type="link"
            onClick={() => {
              navigate(
                `/app/jobs/${jobId}/standard-board/linkedin-profiles/${record.linkedinProfile?.id}`
              );
            }}
          >
            {t("view")}
          </Button>
        );
      },
    },
  ].map((item) => {
    return {
      ...item,
      render:
        item.render ??
        ((data) => {
          return data ?? "--";
        }),
    };
  });

  const dataSource: TDataSourceItem[] = useMemo(() => {
    const result: TDataSourceItem[] = [];
    linkedinProfiles.forEach((linkedinProfile) => {
      // 1. 只有 profile，没有 talent
      // 2. 有 profile + talent, 刚注册
      // 3. 只有 talent 没有 profile
      if (linkedinProfile.candidate_id) {
        // 2
        const talent = talents.find(
          (talent) => talent.candidate_id === linkedinProfile.candidate_id
        );
        result.push({
          linkedinProfile,
          talent,
        });
      } else {
        // 1
        result.push({
          linkedinProfile: linkedinProfile,
        });
      }
    });

    talents
      .filter(
        (talent) =>
          !linkedinProfiles.find(
            (linkedinProfile) =>
              linkedinProfile.candidate_id === talent.candidate_id
          )
      )
      .forEach((talent) => {
        result.push({
          talent,
        });
      });

    return result.sort((a, b) => {
      return dayjs(b.talent?.created_at || b.linkedinProfile?.created_at).diff(
        dayjs(a.talent?.created_at || a.linkedinProfile?.created_at)
      );
    });
  }, [talents, linkedinProfiles]);

  return (
    <div className={styles.container}>
      <h3>{t("candidate_list")}</h3>
      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          rowKey="id"
          dataSource={dataSource}
          pagination={{
            pageSize: 10,
          }}
          locale={{
            emptyText: <Empty style={{ margin: "60px 0" }} />,
          }}
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};

export default Talents;
