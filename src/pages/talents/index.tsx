import React, { useEffect, useState } from "react";
import { Input, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";

import globalStore from "@/store/global";
import TalentList, { TApproveStatus } from "@/components/Talents";
import useStaffs from "@/hooks/useStaffs";

import styles from "./style.module.less";

const Talents: React.FC = () => {
  const [searchName, setSearchName] = useState<string>();
  const [selectedJob, setSelectedJob] = useState<string>();
  const [selectedStatus, setSelectedStatus] = useState<TApproveStatus>();
  const [selectedCreatorId, setSelectedCreatorId] = useState<number>();
  const { staffs } = useStaffs();

  const { jobs } = globalStore;

  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>) =>
    originalT(`company_talents.${key}`, params);

  useEffect(() => {
    // 刷新未读候选人状态
    globalStore.refreshUnreadTalentsCount();
  }, []);

  return (
    <div className={styles.candidatesContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.title}>{t("title")}</div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterItem}>
          <Input
            placeholder={t("search_placeholder")}
            prefix={<SearchOutlined />}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
        </div>
        <div className={styles.filterItem}>
          <Select
            placeholder={t("job_placeholder")}
            value={selectedJob}
            onChange={setSelectedJob}
            style={{ width: 200 }}
            allowClear
            options={jobs.map((job) => ({
              label: job.name,
              value: job.id,
            }))}
            showSearch
            autoClearSearchValue
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>
        <div className={styles.filterItem}>
          <Select
            placeholder={t("status_placeholder")}
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: 200 }}
            allowClear
            options={[
              "message_sent",
              "message_read",
              "pending",
              "staff_rejected",
              "staff_accepted",
              "interview_scheduled",
              "interview_confirmed",
            ].map((c) => ({
              label: originalT(`job_talents.status_${c}`),
              value: c,
            }))}
            autoClearSearchValue
          />
        </div>
        <div className={styles.filterItem}>
          <Select
            placeholder={t("creator_placeholder")}
            value={selectedCreatorId}
            onChange={setSelectedCreatorId}
            style={{ width: 200 }}
            allowClear
            options={staffs.map((staff) => ({
              label: staff.name,
              value: staff.id,
            }))}
            autoClearSearchValue
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>
      </div>

      <div className={styles.pageBody}>
        <TalentList
          filterParams={{
            talentName: searchName,
            jobId: selectedJob ? parseInt(selectedJob) : undefined,
            approveStatus: selectedStatus,
            creatorId: selectedCreatorId,
          }}
        />
      </div>
    </div>
  );
};

export default observer(Talents);
