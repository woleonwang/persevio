import React, { useEffect, useState } from "react";
import { Button, Input, Select, Table, message, Modal, Space } from "antd";
import { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import { Get, Post } from "@/utils/request";
import dayjs from "dayjs";
import styles from "./style.module.less";
import globalStore from "@/store/global";
import { useNavigate } from "react-router";

const PAGE_SIZE = 10;

const Talents: React.FC = () => {
  const navigate = useNavigate();
  const [talents, setTalents] = useState<ITalentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchName, setSearchName] = useState<string>();
  const [selectedJob, setSelectedJob] = useState<string>();
  const { jobs } = globalStore;

  useEffect(() => {
    fetchTalents();
  }, []);

  const fetchTalents = async () => {
    setLoading(true);
    // 实际项目中这里应该调用真实的API
    const { code, data } = await Get(`/api/talents`);

    if (code === 0) {
      setTalents(
        data.talents.map((talent: ITalentListItem) => ({
          ...talent,
          source_channel: talent.source_channel || "upload",
        }))
      );
    }

    // 如果当前页超出范围，重置到第一页
    const maxPage = Math.ceil(talents.length / PAGE_SIZE);
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(1);
    }

    setLoading(false);
  };

  // 当筛选条件改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, selectedJob]);

  const visibleTalents = talents.filter((talent) => {
    const nameMatch = !searchName || talent.name.includes(searchName);
    const jobMatch = !selectedJob || talent.job_name === selectedJob;
    return nameMatch && jobMatch;
  });

  const currentPageTalents = visibleTalents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleDelete = (talent: ITalentListItem) => {
    Modal.confirm({
      title: "提示",
      content: `请确认是否删除${talent.name},删除后原有内容无法恢复。`,
      okText: "确认",
      cancelText: "取消",
      okType: "primary",
      onOk: async () => {
        const { code } = await Post(
          `/api/jobs/${talent.job_id}/talents/${talent.id}/destroy`
        );

        if (code === 0) {
          message.success("删除成功");
          fetchTalents();
        } else {
          message.error("删除失败");
        }
      },
    });
  };

  const handleViewDetails = (talent: ITalentListItem) => {
    navigate(
      `/app/jobs/${talent.job_id}/talents/${talent.id}/detail?tab=resume`
    );
  };

  const columns: ColumnsType<ITalentListItem> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "候选人",
      dataIndex: "name",
      key: "name",
      width: 120,
    },
    {
      title: "职位名称",
      dataIndex: "job_name",
      key: "job_name",
      width: 150,
    },
    {
      title: "获取渠道",
      dataIndex: "source_channel",
      key: "source_channel",
      width: 120,
      render: (_, record) => {
        return record.source_channel === "delivery" ? "主动投递" : "系统上传";
      },
    },
    {
      title: "简历申请/上传时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (_, record) => {
        return dayjs(record.created_at).format("YYYY-MM-DD HH:mm:ss");
      },
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
          {record.source_channel === "upload" && (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.candidatesContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.title}>候选人列表</div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterItem}>
          <Input
            placeholder="请输入候选人姓名进行搜索"
            prefix={<SearchOutlined />}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
        </div>
        <div className={styles.filterItem}>
          <Select
            placeholder="请选择职位进行筛选"
            value={selectedJob}
            onChange={setSelectedJob}
            style={{ width: 200 }}
            allowClear
            options={jobs.map((job) => ({
              label: job.name,
              value: job.id,
            }))}
          />
        </div>
      </div>

      <div className={styles.pageBody}>
        <Table
          columns={columns}
          dataSource={currentPageTalents}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: PAGE_SIZE,
            total: visibleTalents.length,
            onChange: setCurrentPage,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 1000 }}
        />
      </div>
    </div>
  );
};

export default Talents;
