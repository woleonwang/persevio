import React from "react";
import { useNavigate } from "react-router";
import banner from "@/assets/login/banner.png";
import NewLogo from "@/assets/logo.png";

import styles from "./style.module.less";

const SignContainer = (props: { title: string; children: React.ReactNode }) => {
  const { title, children } = props;
  const navigate = useNavigate();

  return (
    <div className={styles.loginContainer}>
      <div className={styles.imgContainer}>
        <img src={banner} />
      </div>
      <div className={styles.formContainer}>
        <div className={styles.formContent}>
          <div className={styles.logoWrapper}>
            <img
              src={NewLogo}
              style={{ width: 200, cursor: "pointer" }}
              onClick={() => navigate("/")}
            />
          </div>
          <div className={styles.title}>{title}</div>
          <div className={styles.formWrapper}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default SignContainer;
