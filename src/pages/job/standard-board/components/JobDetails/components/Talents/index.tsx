import { useEffect, useState } from "react";
import { Button, Table, Tag } from "antd";
import { useNavigate } from "react-router";
import { ColumnsType } from "antd/es/table";

import { Get } from "@/utils/request";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";

interface IProps {
  jobId: number;
}
const Talents = (props: IProps) => {
  const { jobId } = props;
  const [talents, setTalents] = useState<TTalent[]>([]);

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
      setTalents(data.talents);
    }
  };

  const columns: ColumnsType<TTalent> = [
    {
      title: "候选人姓名",
      dataIndex: "name",
    },
    // {
    //   title: "邮箱地址",
    //   dataIndex: "email",
    // },
    // {
    //   title: "手机号码",
    //   dataIndex: "phone",
    // },
    {
      title: "筛选状态",
      dataIndex: "status",
      render: (status: string) => {
        if (status === "accepted") {
          return <Tag color="green">已通过</Tag>;
        }
        if (status === "rejected") {
          return <Tag color="red">未通过</Tag>;
        }
        return <Tag color="blue">未筛选</Tag>;
      },
    },
    {
      title: "操作",
      dataIndex: "action",
      render: (_, record) => {
        return (
          <Button
            type="link"
            onClick={() => {
              navigate(`/app/jobs/${jobId}/talents/${record.id}/detail`);
            }}
          >
            查看
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <div className={styles.block}>
        <h3>候选人列表</h3>
        <Table
          columns={columns}
          dataSource={talents}
          pagination={{
            pageSize: 10,
          }}
        />
      </div>
    </div>
  );
};

export default Talents;
