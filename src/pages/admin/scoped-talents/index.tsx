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
  const t = (key: string) => originalT(`scoped_talents.${key}`);

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPageHeader}>{t("pageTitle")}</div>
      <div className={styles.adminFilter}>
        <div className={styles.adminFilterItem}>
          <div>{t("filters.talentOrJobName")}</div>
          <Input
            style={{ width: 200 }}
            value={talentOrJobName}
            onChange={(e) => setTalentOrJobName(e.target.value)}
            placeholder={t("filters.talentOrJobNamePlaceholder")}
          />
        </div>
        <div className={styles.adminFilterItem}>
          <div>{t("filters.approveStatus")}</div>
          <Select
            style={{ width: 200 }}
            options={[
              "initialize",
              "interviewing",
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
            placeholder={t("filters.approveStatusPlaceholder")}
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
            {t("filters.filter")}
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setTalentOrJobName(undefined);
              setApproveStatus(undefined);
              setFilterParams(undefined);
            }}
          >
            {t("filters.clear")}
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
