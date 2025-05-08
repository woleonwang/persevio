import Logo from "@/assets/logo.png";
import Google from "@/assets/google.png";
import Linkedin from "@/assets/linkedin.png";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";

interface IProps {
  fileId: number;
  jobId?: string;
}

const OAuth = (props: IProps) => {
  const { fileId, jobId } = props;

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`candidate_sign.${key}`);

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.panel}>
          <div className={styles.logoWrapper}>
            <img src={Logo} style={{ width: 190 }} />
          </div>

          <div
            onClick={() => {
              window.location.href = `/api/auth/google/login?role=candidate&file_id=${fileId}&job_id=${
                jobId ?? ""
              }`;
            }}
            className={styles.button}
          >
            <img src={Google} className={styles.brand} />
            {t("connect_google")}
          </div>

          <div
            onClick={() => {
              window.location.href = `/api/auth/linkedin/login?role=candidate&file_id=${fileId}&job_id=${
                jobId ?? ""
              }`;
            }}
            className={styles.button}
          >
            <img src={Linkedin} className={styles.brand} />
            {t("connect_linkedin")}
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.textWrapper}>
          <div className={styles.title}>
            {t("connect_title")}
            <span className={styles.primary}>{t("singapore")}</span>.
          </div>
          <div className={styles.itemBlock}>
            <div className={styles.subTitle}>{t("connect_intro_title_1")}</div>
            <div className={styles.subText}>{t("connect_intro_content_1")}</div>
          </div>
          <div className={styles.itemBlock}>
            <div className={styles.subTitle}>{t("connect_intro_title_2")}</div>
            <div className={styles.subText}>{t("connect_intro_content_2")}</div>
          </div>
          <div className={styles.itemBlock}>
            <div className={styles.subTitle}>{t("connect_intro_title_3")}</div>
            <div className={styles.subText}>{t("connect_intro_content_3")}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuth;
