import React from "react";
import banner from "@/assets/login/banner.png";
import styles from "./style.module.less";

const SignContainer = (props: { children: React.ReactNode }) => {
  const { children } = props;
  return (
    <div className={styles.loginContainer}>
      <div className={styles.imgContainer}>
        <img src={banner} />
      </div>
      <div className={styles.formContainer}>
        <div style={{ width: 474 }}>{children}</div>
      </div>
    </div>
  );
};

export default SignContainer;
