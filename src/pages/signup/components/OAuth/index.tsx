import Google from "@/assets/google.png";
import styles from "./style.module.less";
import classnames from "classnames";
import Email from "@/assets/email.png";
import { useState } from "react";
import { Checkbox, message } from "antd";
import { useTranslation } from "react-i18next";

interface IProps {
  onWithEmail: () => void;
}

const OAuth = (props: IProps) => {
  const { onWithEmail } = props;

  const [isTermsAgreed, setIsTermsAgreed] = useState(false);

  const { t: originalT } = useTranslation();
  const t = (key: string) => {
    return originalT("signup." + key);
  };

  return (
    <div className={styles.container}>
      <div
        onClick={() => {
          if (!isTermsAgreed) {
            message.warning(t("agree_terms_warning"));
            return;
          }
          window.location.href = `/api/auth/google/login?role=staff`;
        }}
        className={classnames(styles.button, styles.google)}
      >
        <img src={Google} className={styles.brand} />
        {t("signin_with_google")}
      </div>
      <div
        onClick={() => {
          if (!isTermsAgreed) {
            message.warning(t("agree_terms_warning"));
            return;
          }
          onWithEmail();
        }}
        className={classnames(styles.button, styles.email)}
      >
        <img src={Email} className={styles.brand} />
        {t("signup_with_email")}
      </div>
      <div>
        <Checkbox
          checked={isTermsAgreed}
          onChange={(e) => setIsTermsAgreed(e.target.checked)}
        >
          {t("agree_terms_text")}
        </Checkbox>
      </div>
    </div>
  );
};

export default OAuth;
