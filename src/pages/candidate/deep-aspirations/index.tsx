import CandidateChat from "@/components/CandidateChat";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { LeftCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
// import CandidateChatVoice from "@/components/CandidateChatVoice";
const DeepAspirations = () => {
  const { t: originalT } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>{originalT("candidate_home.deep_aspirations")}</div>
        <LeftCircleOutlined
          style={{ color: "#3682fe", cursor: "pointer" }}
          onClick={() => navigate("/candidate/home")}
        />
      </div>
      <div style={{ flex: "auto", overflow: "hidden", display: "flex" }}>
        <CandidateChat chatType="deep_aspirations" />
      </div>
    </div>
  );
};

export default DeepAspirations;
