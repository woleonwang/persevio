import AdminTalents from "@/components/AdminTalents";
import styles from "../style.module.less";
import { Button, Input, Select } from "antd";
import { useState } from "react";
import { TApproveStatus } from "@/components/AdminTalents";
import { useTranslation } from "react-i18next";
const ScopedTalents = () => {
  const [talentOrJobName, setTalentOrJobName] = useState<string>();
  const [approveStatus, setApproveStatus] = useState<TApproveStatus>();

  const [filterParams, setFilterParams] = useState<{
    talentOrJobName?: string;
    approveStatus?: TApproveStatus;
  }>();

  const { t: originalT } = useTranslation();

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPageHeader}>候选人列表</div>
      <div className={styles.adminFilter}>
        <div className={styles.adminFilterItem}>
          <div>候选人/职位名称: </div>
          <Input
            style={{ width: 200 }}
            value={talentOrJobName}
            onChange={(e) => setTalentOrJobName(e.target.value)}
            placeholder="按候选人/职位名称筛选"
          />
        </div>
        <div className={styles.adminFilterItem}>
          <div>申请状态: </div>
          <Select
            style={{ width: 200 }}
            options={[
              "initialize",
              "interviewing",
              "interview_finished",
              "hunter_rejected",
              "hunter_accepted",
              "staff_rejected",
              "staff_accepted",
              "interview_scheduled",
              "interview_confirmed",
            ].map((c) => ({
              value: c,
              label: originalT(`admin_talents.screening_status_options.${c}`),
            }))}
            value={approveStatus}
            onChange={(v) => setApproveStatus(v)}
            placeholder="筛选申请状态"
          />
        </div>
        <div className={styles.adminFilterItem}>
          <Button
            type="primary"
            onClick={() => {
              setFilterParams({
                talentOrJobName,
                approveStatus,
              });
            }}
          >
            筛选
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setTalentOrJobName(undefined);
              setApproveStatus(undefined);
              setFilterParams(undefined);
            }}
          >
            清空
          </Button>
        </div>
      </div>
      <div className={styles.adminMain} style={{ overflow: "auto" }}>
        <AdminTalents hideHeader={true} filterParams={filterParams} />
      </div>
    </div>
  );
};

export default ScopedTalents;
