import classnames from "classnames";
import Google from "@/assets/google.png";
import Linkedin from "@/assets/linkedin.png";
import logo from "@/assets/logo.png";
import styles from "./style.module.less";

interface IProps {
  mode: "ai" | "human";
}
const Waiting = (props: IProps) => {
  const { mode } = props;
  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <div
          className={classnames(styles.textWrapper)}
          dangerouslySetInnerHTML={{
            __html:
              mode === "ai"
                ? "Excellent! <br/>We have everything we need for now and are preparing your application. <br/>We're now working to get you feedback as quickly as possible."
                : "Thank you. <br/>A consultant will be calling you soon.",
          }}
        />
        <div className={styles.buttonWrapper}>
          <div
            className={classnames(styles.logoWrapper, styles.desktopVisible)}
          >
            <img src={logo} />
          </div>
          <div className={styles.listTitle}>
            In the meantime, log onto the Persevio platform to manage your
            entire application process in one place.
          </div>
          <div className={styles.listItem}>
            Track your application status 24/7.
          </div>
          <div className={styles.listItem}>
            Receive instant updates on interview schedules.
          </div>
          <div className={styles.listItem}>
            Get hyper-personalized job recommendations just like this one.
          </div>

          <div className={styles.buttonGroup}>
            <div
              onClick={() => {
                window.location.href = `/api/auth/google/login?role=candidate&candidate_token=${localStorage.getItem(
                  "candidate_token"
                )}&referrer=${window.location.href}`;
              }}
              className={classnames(styles.button, styles.google)}
            >
              <img src={Google} className={styles.brand} />
              Sign up with Google
            </div>

            <div
              onClick={() => {
                window.location.href = `/api/auth/linkedin/login?role=candidate&candidate_token=${localStorage.getItem(
                  "candidate_token"
                )}&referrer=${window.location.href}`;
              }}
              className={classnames(styles.button, styles.linkedin)}
            >
              <img src={Linkedin} className={styles.brand} />
              Sign up with LinkedIn
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Waiting;
