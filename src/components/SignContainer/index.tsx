import React from "react";
import banner from "@/assets/login/banner.png";
import styles from "./style.module.less";
import NewLogo from "@/assets/new-logo.png";

const SignContainer = (props: { title: string; children: React.ReactNode }) => {
  const { title, children } = props;
  return (
    <div className={styles.loginContainer}>
      <div className={styles.imgContainer}>
        <img src={banner} />
      </div>
      <div className={styles.formContainer}>
        <div className={styles.formContent}>
          <div className={styles.logoWrapper}>
            <img src={NewLogo} style={{ width: 200 }} />
          </div>
          <div className={styles.title}>{title}</div>
          <div className={styles.formWrapper}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default SignContainer;
