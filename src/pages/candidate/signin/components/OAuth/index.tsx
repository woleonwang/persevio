import Logo from "@/assets/logo.png";
import Google from "@/assets/google.png";
import Linkedin from "@/assets/linkedin.png";
import styles from "./style.module.less";
import classnames from "classnames";
import { Link } from "react-router";

const OAuth = () => {
  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <div className={styles.buttonWrapper}>
          <div
            className={classnames(styles.logoWrapper, styles.desktopVisible)}
          >
            <img src={Logo} />
          </div>

          <div className={styles.listTitle}>
            Your next dream job is one conversation away.
          </div>

          <div className={styles.buttonGroup}>
            <div
              onClick={() => {
                window.location.href = `/api/auth/google/login?role=candidate`;
              }}
              className={classnames(styles.button, styles.google)}
            >
              <img src={Google} className={styles.brand} />
              Sign in with Google
            </div>

            <div
              onClick={() => {
                window.location.href = `/api/auth/linkedin/login?role=candidate`;
              }}
              className={classnames(styles.button, styles.linkedin)}
            >
              <img src={Linkedin} className={styles.brand} />
              Sign in with LinkedIn
            </div>
          </div>
        </div>
        <div className={styles.signupLink}>
          Don't have an account yet? <Link to="/signup-candidate">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default OAuth;
