import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";

import globalStore from "@/store/global";
import styles from "./style.module.less";
import TalentCards from "@/components/TalentCards";

const Talents: React.FC = () => {
  useEffect(() => {
    // 刷新未读候选人状态
    globalStore.refreshUnreadTalentsCount();
  }, []);

  return (
    <div className={styles.candidatesContainer}>
      <div className={styles.pageBody}>
        <TalentCards />
      </div>
    </div>
  );
};

export default observer(Talents);
