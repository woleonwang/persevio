import Google from "@/assets/google.png";
import styles from "./style.module.less";
import classnames from "classnames";
import NewLogo from "@/assets/new-logo.png";
import Email from "@/assets/email.png";
import { useState } from "react";
import { Checkbox, message } from "antd";

interface IProps {
  onWithEmail: () => void;
}

const OAuth = (props: IProps) => {
  const { onWithEmail } = props;

  const [isTermsAgreed, setIsTermsAgreed] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <div className={styles.logoWrapper}>
          <img src={NewLogo} style={{ width: 250 }} />
        </div>

        <div style={{ width: "50%" }}>
          <div>Sign up for an account</div>
          <div
            onClick={() => {
              if (!isTermsAgreed) {
                message.warning(
                  "Please agree to the terms of service and privacy policy"
                );
                return;
              }
              window.location.href = `/api/auth/google/login?role=staff`;
            }}
            className={classnames(styles.button, styles.google)}
          >
            <img src={Google} className={styles.brand} />
            使用 Google 登录
          </div>
          <div
            onClick={() => {
              if (!isTermsAgreed) {
                message.warning(
                  "Please agree to the terms of service and privacy policy"
                );
                return;
              }
              onWithEmail();
            }}
            className={classnames(styles.button, styles.email)}
          >
            <img src={Email} className={styles.brand} />
            Sign up with email
          </div>
        </div>

        <div>
          <Checkbox
            checked={isTermsAgreed}
            onChange={(e) => setIsTermsAgreed(e.target.checked)}
          >
            By signing in,you are agreeing to the Terms of Service and Privacy
            Policy
          </Checkbox>
        </div>
      </div>
    </div>
  );
};

export default OAuth;
