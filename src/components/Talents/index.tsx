import { useEffect, useMemo, useState } from "react";
import { Button, Table, Tag, Tooltip } from "antd";
import { useNavigate } from "react-router";
import { ColumnsType } from "antd/es/table";
import classnames from "classnames";
import { Get } from "@/utils/request";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { parseJSON } from "@/utils";
import dayjs from "dayjs";
import Empty from "@/components/Empty";

export type TApproveStatus =
  | "message_read"
  | "message_sent"
  | "pending"
  | "staff_rejected"
  | "staff_accepted"
  | "interview_scheduled"
  | "interview_confirmed";

interface IProps {
  jobId?: number;
  filterParams?: {
    talentName?: string;
    jobId?: number;
    approveStatus?: TApproveStatus;
  };
}

type TDataSourceItem = {
  talent?: TTalentItem;
  linkedinProfile?: TLinkedinProfileItem;
};

type TTalentItem = TTalent & {
  current_job_title: string;
  current_company: string;
  current_compensation: string;
  visa: string;
  interviews: TInterview[];
};

type TLinkedinProfileItem = TLinkedinProfile & {
  current_job_title: string;
  current_company: string;
  current_compensation: string;
  visa: string;
};
const Talents = (props: IProps) => {
  const { jobId, filterParams } = props;
  const [talents, setTalents] = useState<TTalentItem[]>([]);
  const [linkedinProfiles, setLinkedinProfiles] = useState<
    TLinkedinProfileItem[]
  >([]);

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_talents.${key}`);

  useEffect(() => {
    fetchTalents();
  }, [jobId]);

  const fetchTalents = async () => {
    const { code, data } = await Get<{
      talents: TTalent[];
      linkedin_profiles: TLinkedinProfile[];
    }>(`/api/talents?job_id=${jobId ?? ""}`);

    if (code === 0) {
      setTalents(
        data.talents.map((talent) => {
          return {
            ...talent,
            ...parseJSON(talent.basic_info_json),
          };
        })
      );
      setLinkedinProfiles(
        (data.linkedin_profiles ?? []).map((linkedinProfile) => {
          return {
            ...linkedinProfile,
            ...parseJSON(linkedinProfile.basic_info_json),
          };
        })
      );
    }
  };

  const getApproveStatus = (talentItem: TDataSourceItem): TApproveStatus => {
    const talent = talentItem.talent;
    const interview = talent?.interviews?.[0];
    const linkedinProfile = talentItem.linkedinProfile;

    if (interview) {
      if (interview.scheduled_at) {
        return "interview_confirmed";
      } else {
        return "interview_scheduled";
      }
    }

    if (talent) {
      if (talent.status === "accepted") {
        return "staff_accepted";
      } else if (talent.status === "rejected") {
        return "staff_rejected";
      } else {
        return "pending";
      }
    }

    if (linkedinProfile?.message_read_at) {
      return "message_read";
    } else {
      return "message_sent";
    }
  };

  const getName = (talentItem: TDataSourceItem): string => {
    return talentItem.talent?.name || talentItem.linkedinProfile?.name || "";
  };

  const columns: ColumnsType<TDataSourceItem> = [
    {
      title: t("candidate_name"),
      dataIndex: "name",
      render: (_: string, record: TDataSourceItem) => {
        return record.talent?.name || record.linkedinProfile?.name || "-";
      },
    },
    ...(!jobId
      ? [
          {
            title: t("job_name"),
            dataIndex: "job_name",
            render: (_: string, record: TDataSourceItem) => {
              return (
                (record.talent
                  ? record.talent?.job?.name
                  : record.linkedinProfile?.job?.name) || "-"
              );
            },
            width: 150,
          },
        ]
      : []),
    {
      title: t("current_job_title"),
      dataIndex: "current_job_title",
      render: (_: string, record: TDataSourceItem) => {
        return (
          record.talent?.current_job_title ||
          record.linkedinProfile?.current_job_title ||
          "-"
        );
      },
      width: 150,
    },
    {
      title: t("current_company"),
      dataIndex: "current_company",
      render: (_: string, record: TDataSourceItem) => {
        return (
          record.talent?.current_company ||
          record.linkedinProfile?.current_company ||
          "-"
        );
      },
      width: 150,
    },
    {
      title: t("current_compensation"),
      dataIndex: "current_compensation",
      render: (_: string, record: TDataSourceItem) => {
        return (
          record.talent?.current_compensation ||
          record.linkedinProfile?.current_compensation ||
          "-"
        );
      },
      width: 150,
    },
    {
      title: t("visa"),
      dataIndex: "visa",
      render: (_: string, record: TDataSourceItem) => {
        return record.talent?.visa || record.linkedinProfile?.visa || "-";
      },
      width: 150,
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
        const status = getApproveStatus(record);
        if (status === "message_sent") {
          return <Tag color="default">{t("status_message_sent")}</Tag>;
        } else if (status === "message_read") {
          return <Tag color="default">{t("status_message_read")}</Tag>;
        } else if (status === "pending") {
          return <Tag color="default">{t("status_pending")}</Tag>;
        } else if (status === "staff_accepted") {
          return <Tag color="green">{t("status_staff_accepted")}</Tag>;
        } else if (status === "staff_rejected") {
          return <Tag color="red">{t("status_staff_rejected")}</Tag>;
        } else if (status === "interview_scheduled") {
          return <Tag color="green">{t("status_interview_scheduled")}</Tag>;
        } else if (status === "interview_confirmed") {
          return <Tag color="green">{t("status_interview_confirmed")}</Tag>;
        } else {
          return "-";
        }
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
                `/app/jobs/${record.talent?.job_id}/standard-board/talents/${record.talent?.id}`
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
                `/app/jobs/${record.linkedinProfile?.job_id}/standard-board/linkedin-profiles/${record.linkedinProfile?.id}`
              );
            }}
          >
            {t("view")}
          </Button>
        );
      },
    },
  ];

  const dataSource: TDataSourceItem[] = useMemo(() => {
    let result: TDataSourceItem[] = [];
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
              linkedinProfile.candidate_id !== 0 &&
              linkedinProfile.candidate_id === talent.candidate_id
          )
      )
      .forEach((talent) => {
        result.push({
          talent,
        });
      });

    if (filterParams?.talentName) {
      result = result.filter((item) => {
        return getName(item).includes(filterParams.talentName ?? "");
      });
    }

    if (filterParams?.approveStatus) {
      result = result.filter((item) => {
        return getApproveStatus(item) === filterParams.approveStatus;
      });
    }

    if (filterParams?.jobId) {
      result = result.filter((item) => {
        return item.talent
          ? item.talent?.job_id === filterParams.jobId
          : item.linkedinProfile?.job_id === filterParams.jobId;
      });
    }

    return result.sort((a, b) => {
      return dayjs(b.talent?.created_at || b.linkedinProfile?.created_at).diff(
        dayjs(a.talent?.created_at || a.linkedinProfile?.created_at)
      );
    });
  }, [talents, linkedinProfiles, filterParams]);

  return (
    <div
      className={classnames(styles.container, { [styles.noPadding]: !jobId })}
    >
      {jobId && <h3>{t("candidate_list")}</h3>}
      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          rowKey={(record) => {
            return record.talent?.id || record.linkedinProfile?.id || "";
          }}
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
