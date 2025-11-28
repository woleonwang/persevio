import { Get } from "@/utils/request";
import { Button, Form, Modal, Select, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import styles from "../style.module.less";
import dayjs from "dayjs";

const PAGE_SIZE = 10;

type TRecommendedCandidate = {};

const Talents = () => {
  const [talents, setTalents] = useState<ITalentListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState();

  const [selectedTalent, setSelectedTalent] = useState<ITalentListItem>();
  const [hireStatusModalOpen, setHireStatusModalOpen] = useState(false);
  const [shareChainModalOpen, setShareChainModalOpen] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchTalents();
  }, [page]);
  const fetchTalents = async () => {
    const { code, data } = await Get(
      `/api/admin/talents?page=${page}&size=${PAGE_SIZE}`
    );

    if (code === 0) {
      setTalents(data.talents);
      setTotal(data.total);
    }
  };

  const talentTableColumns: ColumnsType<ITalentListItem> = [
    {
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "Talent Name",
      dataIndex: "name",
    },
    {
      title: "Position Phone",
      dataIndex: "job_name",
    },
    {
      title: "Bonus Pool",
      dataIndex: "bonus_pool",
      render: (bonusPool: number) => {
        return bonusPool ? `$ ${bonusPool}` : "-";
      },
    },
    {
      title: "Hire Status",
      dataIndex: "hire_status",
      render: (hireStatus: string) => {
        return hireStatus === "hired" ? "Hired" : "Not Hired";
      },
    },
    {
      title: "操作",
      key: "actions",
      width: 350,
      render: (_, talent: ITalentListItem) => {
        return (
          <div>
            <Button
              variant="outlined"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTalent(talent);
                setHireStatusModalOpen(true);
                form.setFieldsValue({
                  hire_status: talent.hire_status,
                });
              }}
            >
              Edit Hire Status
            </Button>
            {!!talent.share_token_id && (
              <Button
                variant="outlined"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTalent(talent);
                  setShareChainModalOpen(true);
                }}
                style={{ marginLeft: 12 }}
              >
                View Referral Link Details
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const recommendedTalentTableColumns: ColumnsType<TRecommendedCandidate> = [
    {
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "候选人",
      dataIndex: "candidate",
      render: (candidate: ICandidateSettings) => {
        return <div>{candidate.name}</div>;
      },
    },
    {
      title: "推送时间",
      dataIndex: "created_at",
      render: (datetime: string) => {
        return dayjs(datetime).format("YYYY-MM-DD HH:mm:ss");
      },
    },
  ];

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPageHeader}>职位列表</div>
      <div className={styles.adminFilter}>
        <div className={styles.adminFilterItem}></div>
      </div>
      <div className={styles.adminMain}>
        <Table<ITalentListItem>
          className="persevio-table"
          style={{ height: "100%", overflow: "auto" }}
          rowKey="id"
          dataSource={talents}
          columns={talentTableColumns}
          pagination={{
            pageSize: PAGE_SIZE,
            current: page,
            total,
            onChange: (page) => setPage(page),
          }}
        />
      </div>

      <Modal
        open={hireStatusModalOpen}
        onClose={() => setHireStatusModalOpen(false)}
        title="Hire Status"
        cancelText="Cancel"
        onCancel={() => {
          setHireStatusModalOpen(false);
        }}
      >
        <Form
          form={form}
          layout="vertical"
          className={styles.bonusPoolModalForm}
        >
          <div className={styles.hireStatusModalDescription}>
             If the referred person has been hired by the company, all users in
            the referral chain will share 8000 S$; after confirmation, the
            system will send an email notification to the users. Please contact
            the users promptly.
          </div>
          <Form.Item
            label="*Please select the current hiring status of the referred person"
            name="hire_status"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "hired", label: "Hired" },
                { value: "not_hired", label: "Not Hired" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Talents;
