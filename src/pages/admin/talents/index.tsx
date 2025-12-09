import { Get, Post } from "@/utils/request";
import { Button, Form, message, Modal, Select, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import commonStyles from "../style.module.less";
import styles from "./style.module.less";
import { parseJSON } from "@/utils";

const PAGE_SIZE = 10;

interface IAdminTalentListItem {
  id: number;
  name: string;
  job: {
    name: string;
    bonus_pool: number;
  };
  hire_status: "hired" | "not_hired";
  share_token_id?: number;
}

interface IAdminTalentShareChain {
  id: number;
  name: string;
  email: string;
  phone: string;
}
const Talents = () => {
  const [talents, setTalents] = useState<IAdminTalentListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState();

  const [selectedTalent, setSelectedTalent] = useState<IAdminTalentListItem>();
  const [hireStatusModalOpen, setHireStatusModalOpen] = useState(false);
  const [shareChainModalOpen, setShareChainModalOpen] = useState(false);
  const [shareChainCandidates, setShareChainCandidates] = useState<
    IAdminTalentShareChain[]
  >([]);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchTalents();
  }, [page]);

  useEffect(() => {
    if (shareChainModalOpen && selectedTalent) {
      fetchShareChain();
    }
  }, [shareChainModalOpen]);

  const fetchTalents = async () => {
    const { code, data } = await Get(
      `/api/admin/talents?page=${page}&size=${PAGE_SIZE}`
    );

    if (code === 0) {
      setTalents(data.talents ?? []);
      setTotal(data.total);
    }
  };

  const fetchShareChain = async () => {
    const { code, data } = await Get(
      `/api/admin/talents/${selectedTalent?.id}/share_chain`
    );

    if (code === 0) {
      setShareChainCandidates(
        (data.candidates ?? []).map((candidate: ICandidateSettings) => {
          const preRegisterInfo = parseJSON(
            candidate.pre_register_info ?? "{}"
          );
          return {
            id: candidate.id,
            name: candidate.name || preRegisterInfo.name,
            email: candidate.email,
            phone: `${preRegisterInfo.country_code ?? ""} ${
              preRegisterInfo.phone ?? ""
            }`,
          };
        })
      );
    }
  };

  const talentTableColumns: ColumnsType<IAdminTalentListItem> = [
    {
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "Talent Name",
      dataIndex: "name",
    },
    {
      title: "Position Name",
      dataIndex: "job_name",
      render: (_, record: IAdminTalentListItem) => {
        return <div>{record.job?.name ?? "-"}</div>;
      },
    },
    {
      title: "Bonus Pool",
      dataIndex: "bonus_pool",
      render: (_, record: IAdminTalentListItem) => {
        return record.job?.bonus_pool ? `$ ${record.job?.bonus_pool}` : "-";
      },
    },
    {
      title: "Hire Status",
      dataIndex: "hire_status",
      render: (hireStatus: string) => {
        return hireStatus === "hired"
          ? "Hired"
          : hireStatus === "not_hired"
          ? "Not Hired"
          : "-";
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 400,
      render: (_, talent: IAdminTalentListItem) => {
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
                  hire_status: talent.hire_status || "not_hired",
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

  return (
    <div className={commonStyles.adminContainer}>
      <div className={commonStyles.adminPageHeader}>候选人列表</div>
      <div className={commonStyles.adminFilter}>
        <div className={commonStyles.adminFilterItem}></div>
      </div>
      <div className={commonStyles.adminMain}>
        <Table<IAdminTalentListItem>
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
        title="Hire Status"
        cancelText="Cancel"
        onCancel={() => {
          setHireStatusModalOpen(false);
        }}
        onOk={async () => {
          form.validateFields().then(async (values) => {
            const { code } = await Post(
              `/api/admin/talents/${selectedTalent?.id}`,
              {
                hire_status: values.hire_status,
              }
            );

            if (code === 0) {
              message.success("Update hire status success");
              fetchTalents();
              setHireStatusModalOpen(false);
            } else {
              message.error("Update hire status failed");
            }
          });
        }}
      >
        <Form
          form={form}
          layout="vertical"
          className={commonStyles.bonusPoolModalForm}
        >
          <div className={commonStyles.modalDescription}>
            If the referred person has been hired by the company, all users in
            the referral chain will share {selectedTalent?.job?.bonus_pool} S$;
            Please contact the users promptly.
          </div>
          <Form.Item
            label="Please select the current hiring status of the referred person"
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

      <Modal
        open={shareChainModalOpen}
        onCancel={() => setShareChainModalOpen(false)}
        title="Referral Chain Details"
        cancelButtonProps={{
          style: {
            display: "none",
          },
        }}
        onOk={async () => {
          setShareChainModalOpen(false);
        }}
        width={740}
        centered
      >
        <div>
          {shareChainCandidates.map((candidate, index) => {
            return (
              <div key={candidate.id} className={styles.shareChainCandidate}>
                <div className={styles.index}>{index + 1}</div>
                <div className={styles.candidateInfo}>
                  <div className={styles.candidateName}>{candidate.name}</div>
                  <div className={styles.candidateContactInfo}>
                    <div>{candidate.email}</div>
                    <div>{candidate.phone}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default Talents;
