import Logo from "@/assets/logo.png";
import styles from "./style.module.less";
import classnames from "classnames";
import { useEffect, useState } from "react";
import { Get } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import { Empty } from "antd";
import { useNavigate } from "react-router";

const Approve = () => {
  const [candidate, setCandidate] = useState<ICandidateSettings>();

  const status = candidate?.approve_status ?? "";
  const navigate = useNavigate();

  useEffect(() => {
    fetchCandidate();

    const interval = setInterval(() => {
      fetchCandidate();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchCandidate = async () => {
    const { code, data } = await Get("/api/candidate/settings");
    if (code === 0) {
      setCandidate(data.candidate);
      if (data.candidate.approve_status === "approved") {
        navigate("/candidate/home");
      }
    }
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.body}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div className={styles.logoWrapper}>
          <img src={Logo} style={{ width: 250 }} />
        </div>

        <div className={styles.profileDoc}>
          {candidate && (
            <>
              <div className={styles.profileDocTitle}>个人报告</div>
              <div className={styles.profileDocContent}>
                {candidate.profile_doc ? (
                  <MarkdownContainer content={candidate.profile_doc} />
                ) : (
                  <Empty
                    style={{ marginTop: 20 }}
                    description="个人报告正在生成中，请稍候"
                  />
                )}
              </div>
            </>
          )}
        </div>

        <div
          className={classnames(styles.textWrapper, {
            [styles.rejected]: status === "rejected",
          })}
        >
          {candidate &&
            (status === "pending"
              ? "非常感谢您的时间！您的背景和需求我已经清晰了解了。我会尽快为您寻找合适的人选，一有消息就第一时间联系您。"
              : "您的申请已被拒绝，请联系 viona@persevio.ai")}
        </div>
      </div>
    </div>
  );
};

export default Approve;
