import React, { useEffect } from "react";
import { Button, message } from "antd";
import { Get } from "@/utils/request";
import { GoogleOutlined, LinkedinOutlined } from "@ant-design/icons";

import styles from "./style.module.less";
import { useNavigate } from "react-router";

// import { useNavigate } from "react-router";

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
      navigate("/candidate/profile");
    }
  };

  return (
    <div className={styles.container}>
      <div>
        <h2 style={{ fontSize: 36 }}>Candidate Sign in</h2>
        <div>
          <Button
            icon={<GoogleOutlined />}
            shape="circle"
            size="large"
            onClick={() => {
              window.location.href = `/api/auth/google/login?role=candidate&auth_type=signin`;
            }}
          />

          <Button
            icon={<LinkedinOutlined />}
            shape="circle"
            size="large"
            onClick={() => {
              window.location.href = `/api/auth/linkedin/login?role=candidate&auth_type=signin`;
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CandidateSignIn;
