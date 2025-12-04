import { Get } from "@/utils/request";
import { Empty, Table } from "antd";
import { useEffect, useState } from "react";
import EmptyReferrals from "@/assets/empty-referrals.png";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import styles from "./style.module.less";

interface IReferral {
  id: number;
  talent_name: string;
  job_name: string;
  referer_time: string;
  chain_count: number;
  bonus: number;
  status: string;
}

const Referrals = () => {
  const [refererTalents, setRefererTalents] = useState<IReferral[]>([]);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    const { code, data } = await Get("/api/candidate/referer_talents");
    if (code === 0) {
      setRefererTalents(data.referer_talents);
    }
  };

  if (refererTalents.length === 0) {
    return (
      <div className="flex-center">
        <Empty
          image={
            <img src={EmptyReferrals} alt="empty" style={{ width: "auto" }} />
          }
          description={
            <>
              <div>You don't have any referrals yet.</div>
              <div>All your referrals will be visible here</div>
            </>
          }
        />
      </div>
    );
  }

  const columns: ColumnsType<IReferral> = [
    {
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "Referred Person Name",
      dataIndex: "talent_name",
    },
    {
      title: "Referred Position  Name",
      dataIndex: "job_name",
    },
    {
      title: "Referral Time",
      dataIndex: "referer_time",
      render: (referer_time: string) => {
        return referer_time
          ? dayjs(referer_time).format("YYYY-MM-DD HH:mm:ss")
          : "-";
      },
    },
    {
      title: "Total Referral Chain Count",
      dataIndex: "chain_count",
    },
    {
      title: "Eligible Bonus",
      dataIndex: "bonus",
      render: (bonus: number, record: IReferral) => {
        return bonus ? `$ ${Math.ceil(bonus / record.chain_count)}` : "-";
      },
    },
    {
      title: "Referred Person Hiring Status",
      dataIndex: "status",
      render: (status: string) => {
        return status === "hired" ? "Hired" : "Not Hired";
      },
    },
  ];
  return (
    <div className={styles.container}>
      <div className={styles.title}>My referrals</div>
      <div className={styles.main}>
        <Table
          dataSource={refererTalents}
          columns={columns}
          className="persevio-table"
          rowKey="id"
        />
      </div>
    </div>
  );
};

export default Referrals;
