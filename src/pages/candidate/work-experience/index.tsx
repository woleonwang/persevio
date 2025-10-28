import CandidateChat from "@/components/CandidateChat";
import styles from "./style.module.less";
import { LeftCircleOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router";
const WorkExperience = () => {
  const navigate = useNavigate();
  const { companyName } = useParams();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>{`Deep dive into your work at ${companyName}`}</div>
        <LeftCircleOutlined
          style={{ color: "#3682fe", cursor: "pointer" }}
          onClick={() => navigate("/candidate/home")}
        />
      </div>
      <div style={{ flex: "auto", overflow: "hidden", display: "flex" }}>
        <CandidateChat
          chatType="work_experience"
          workExperienceCompanyName={companyName}
        />
      </div>
    </div>
  );
};

export default WorkExperience;
