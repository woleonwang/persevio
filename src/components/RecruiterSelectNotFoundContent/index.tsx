import { Empty } from "antd";
import { useTranslation } from "react-i18next";

import styles from "./style.module.less";

const RecruiterSelectNotFoundContent = () => {
  const { t } = useTranslation();

  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      className={styles.empty}
      description={
        <div className={styles.description}>
          <div className={styles.title}>{t("empty_text")}</div>
          <div className={styles.hint}>
            {t("job_talents.recruiter_select_empty_hint")}
          </div>
        </div>
      }
    />
  );
};

export default RecruiterSelectNotFoundContent;
