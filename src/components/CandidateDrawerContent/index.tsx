import MarkdownContainer from "@/components/MarkdownContainer";
import styles from "./style.module.less";
import classnames from "classnames";
import { useEffect, useState } from "react";
import { Get, Post } from "@/utils/request";
import { Button, message, Select, Table } from "antd";
import dayjs from "dayjs";

type TWorkExperience = {
  company_name: string;
  position: string;
  start_date: string;
  end_date: string;
  description: string;
};
const CandidateDrawerContent = (props: { candidate: ICandidateSettings }) => {
  const { candidate } = props;

  const [candidates, setCandidates] = useState<ICandidateSettings[]>([]);
  const [candidateConnections, setCandidateConnections] = useState<
    ICandidateConnection[]
  >([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number>();

  useEffect(() => {
    fetchCandidates();
    fetchCandidateConnections();
  }, []);

  const fetchCandidates = async () => {
    const { code, data } = await Get("/api/admin/candidates");
    if (code === 0) {
      setCandidates(
        data.candidates.filter(
          (item: ICandidateSettings) =>
            item.id !== candidate.id && item.approve_status === "approved"
        )
      );
    }
  };

  const fetchCandidateConnections = async () => {
    const { code, data } = await Get(
      `/api/admin/candidates/${candidate.id}/candidate_connections`
    );
    if (code === 0) {
      setCandidateConnections(data.candidate_connections);
    }
  };

  const resumeContent = () => {
    if (candidate.work_experience) {
      const workExperiences = JSON.parse(
        candidate.work_experience
      ) as TWorkExperience[];

      return workExperiences.map((workExperience) => (
        <div
          key={workExperience.company_name}
          className={styles.workExperienceItemWrapper}
        >
          <div className={styles.workExperienceItem}>
            <div className={styles.workExperienceItemLabel}>公司:</div>
            <div>{workExperience.company_name}</div>
          </div>
          <div className={styles.workExperienceItem}>
            <div className={styles.workExperienceItemLabel}>职位:</div>
            <div>{workExperience.position}</div>
          </div>
          <div className={styles.workExperienceItem}>
            <div className={styles.workExperienceItemLabel}>工作时间:</div>
            <div>
              {workExperience.start_date} - {workExperience.end_date ?? "至今"}
            </div>
          </div>
          <div
            className={classnames(
              styles.workExperienceItem,
              styles.description
            )}
          >
            <div className={styles.workExperienceItemLabel}>描述:</div>
            <div>{workExperience.description}</div>
          </div>
        </div>
      ));
    } else {
      return <MarkdownContainer content={candidate.resume_content} />;
    }
  };

  const createCandidateConnection = async () => {
    const { code } = await Post(`/api/admin/candidate_connections`, {
      source_candidate_id: candidate.id,
      target_candidate_id: selectedCandidateId,
    });

    if (code === 0) {
      message.success("推荐成功");
      fetchCandidateConnections();
    } else if (code === 10004) {
      message.error("推荐人才已存在");
    } else {
      message.error("推荐失败");
    }
  };

  const candidateConnectionsTableColumns = [
    {
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "推荐人才",
      dataIndex: "target_candidate_id",
      render: (_: any, record: ICandidateConnection) => {
        return (
          candidates.find(
            (item) =>
              item.id ===
              (record.target_candidate_id === candidate.id
                ? record.source_candidate_id
                : record.target_candidate_id)
          )?.name ?? "-"
        );
      },
    },
    {
      title: "推荐时间",
      dataIndex: "created_at",
      render: (created_at: string) => {
        return dayjs(created_at).format("YYYY-MM-DD HH:mm:ss");
      },
    },
  ];

  return (
    <div className={styles.container}>
      {candidate.approve_status === "approved" && (
        <div className={styles.candidateConnectionsWrapper}>
          <div className={styles.candidateConnectionsHeader}>
            <Select
              options={candidates.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              value={selectedCandidateId}
              onChange={(v) => setSelectedCandidateId(v)}
              style={{ width: 200 }}
              placeholder="选择推荐人才"
            />
            <Button type="primary" onClick={() => createCandidateConnection()}>
              推荐人才
            </Button>
          </div>
          <div>
            <Table
              dataSource={candidateConnections}
              columns={candidateConnectionsTableColumns}
              pagination={false}
            />
          </div>
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.left}>
          <div className={styles.title}>个人资料</div>
          <div>{resumeContent()}</div>
        </div>
        <div className={styles.right}>
          <div className={styles.title}>连接需求</div>
          <MarkdownContainer content={candidate.targets} />
        </div>
      </div>
    </div>
  );
};

export default CandidateDrawerContent;
