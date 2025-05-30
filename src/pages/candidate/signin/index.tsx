import React, { useEffect } from "react";
import { message } from "antd";
import { useNavigate } from "react-router";

import Logo from "@/assets/logo.png";
import { Get } from "@/utils/request";
import Google from "@/assets/google.png";
import Linkedin from "@/assets/linkedin.png";
import styles from "../signup/components/OAuth/style.module.less";
import { useTranslation } from "react-i18next";

const CandidateSignIn: React.FC = () => {
  const navigate = useNavigate();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`candidate_sign.${key}`);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    const code = urlParams.get("code");
    if (error === "google_login_failed" && code === "10001") {
      message.error("Email not found");
    }

    const tokenFromUrl = urlParams.get("token");
    if (tokenFromUrl) {
      urlParams.delete("token");
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${
          urlParams.toString() ? `?${urlParams.toString()}` : ""
        }`
      );

      localStorage.setItem("candidate_token", tokenFromUrl);
    }

    if (localStorage.getItem("candidate_token")) {
      fetchProfile();
    }
  }, []);

  const fetchProfile = async () => {
    const { code } = await Get(`/api/candidate/settings`);
    if (code === 0) {
      navigate("/candidate/profile");
    }
  };

  return (
    <div
      className={styles.container}
      style={{ height: "100vh", backgroundColor: "#f7f8fa" }}
    >
      <div className={styles.left}>
        <div className={styles.panel}>
          <div className={styles.logoWrapper}>
            <img src={Logo} style={{ width: 190 }} />
          </div>

          <div
            onClick={() => {
              window.location.href = `/api/auth/google/login?role=candidate&auth_type=signin`;
            }}
            className={styles.button}
          >
            <img src={Google} className={styles.brand} />
            {t("connect_google")}
          </div>

          <div
            onClick={() => {
              window.location.href = `/api/auth/linkedin/login?role=candidate&auth_type=signin`;
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

export default CandidateSignIn;
