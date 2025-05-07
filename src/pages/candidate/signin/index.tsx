import React, { useEffect } from "react";
import { message } from "antd";
import { useNavigate } from "react-router";

import Logo from "@/assets/logo.png";
import { Get } from "@/utils/request";
import Google from "@/assets/google.png";
import Linkedin from "@/assets/linkedin.png";
import styles from "../signup/components/OAuth/style.module.less";

const CandidateSignIn: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    const code = urlParams.get("code");
    if (error === "google_login_failed" && code === "100001") {
      message.error("Email exists");
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
      navigate("/candidate/resume");
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
            Continue with Google
          </div>

          <div
            onClick={() => {
              window.location.href = `/api/auth/linkedin/login?role=candidate&auth_type=signin`;
            }}
            className={styles.button}
          >
            <img src={Linkedin} className={styles.brand} />
            Continue with Linked
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.textWrapper}>
          <div className={styles.title}>
            Stop the endless job hunt. Persevio uses AI to match you with top
            opportunities in <span className={styles.primary}>Singapore</span>.
          </div>
          <div className={styles.itemBlock}>
            <div className={styles.subTitle}>
              One Conversation, Many Opportunities:
            </div>
            <div className={styles.subText}>
              Chat once with Viona, our AI recruiter. We'll then proactively
              send you highly accurate, personalized job recommendations.
            </div>
          </div>
          <div className={styles.itemBlock}>
            <div className={styles.subTitle}>Confidentiality Assured</div>
            <div className={styles.subText}>
              Your profile remains private. Employers only see your details when
              you decide to apply for a specific role.
            </div>
          </div>
          <div className={styles.itemBlock}>
            <div className={styles.subTitle}>Guided Application Process</div>
            <div className={styles.subText}>
              Viona acts as your dedicated AI copilot, supporting you every step
              of the way.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateSignIn;
