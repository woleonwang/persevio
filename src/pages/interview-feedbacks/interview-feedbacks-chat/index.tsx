import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { LeftCircleOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
import ChatRoom from "@/components/ChatRoom";
// import CandidateChatVoice from "@/components/CandidateChatVoice";
const InteviewFeedbacksChat = () => {
  const { t: originalT } = useTranslation();
  const navigate = useNavigate();
  const { jobId, interviewFeedbackId } = useParams();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>{originalT("chat_title")}</div>
        <LeftCircleOutlined
          style={{ color: "#1FAC6A", cursor: "pointer" }}
          onClick={() => navigate(-1)}
        />
      </div>
      <div style={{ flex: "auto", overflow: "hidden", display: "flex" }}>
        <ChatRoom
          jobId={parseInt(jobId ?? "0")}
          jobInterviewFeedbackId={parseInt(interviewFeedbackId ?? "0")}
          hideSidebar={true}
        />
      </div>
    </div>
  );
};

export default InteviewFeedbacksChat;
