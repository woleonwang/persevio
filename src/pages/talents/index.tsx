import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";

import globalStore from "@/store/global";
import styles from "./style.module.less";
import TalentCards from "@/components/TalentCards";

const Talents: React.FC = () => {
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

      <div className={styles.pageBody}>
        <TalentCards />
      </div>
    </div>
  );
};

export default observer(Talents);
