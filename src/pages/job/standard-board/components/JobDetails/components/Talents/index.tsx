import { useEffect, useState } from "react";
import { Button, Table, Tag } from "antd";
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

type TTalentItem = TTalent & {
  current_job_title: string;
  current_company: string;
  current_compensation: string;
  visa: string;
};

const Talents = (props: IProps) => {
  const { jobId } = props;
  const [talents, setTalents] = useState<TTalentItem[]>([]);

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
    }
  };

  const columns: ColumnsType<TTalent> = [
    {
      title: t("candidate_name"),
      dataIndex: "name",
    },
    {
      title: t("current_job_title"),
      dataIndex: "current_job_title",
    },
    {
      title: t("current_company"),
      dataIndex: "current_company",
    },
    {
      title: t("current_compensation"),
      dataIndex: "current_compensation",
    },
    {
      title: t("visa"),
      dataIndex: "visa",
    },
    {
      title: t("received_on"),
      dataIndex: "created_at",
      render: (created_at: string) => {
        return dayjs(created_at).format("YYYY-MM-DD HH:mm:ss");
      },
    },
    {
      title: t("screening_status"),
      dataIndex: "status",
      render: (status: string) => {
        if (status === "accepted") {
          return <Tag color="green">{t("status_accepted")}</Tag>;
        }
        if (status === "rejected") {
          return <Tag color="red">{t("status_rejected")}</Tag>;
        }
        return <Tag color="default">{t("status_unfiltered")}</Tag>;
      },
    },
    {
      title: t("action"),
      dataIndex: "action",
      render: (_: any, record: TTalent) => {
        return (
          <Button
            type="link"
            onClick={() => {
              navigate(
                `/app/jobs/${jobId}/standard-board/talents/${record.id}`
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

  return (
    <div className={styles.container}>
      <h3>{t("candidate_list")}</h3>
      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          rowKey="id"
          dataSource={talents}
          pagination={{
            pageSize: 10,
          }}
          locale={{
            emptyText: <Empty style={{ margin: "60px 0" }} />,
          }}
        />
      </div>
    </div>
  );
};

export default Talents;
