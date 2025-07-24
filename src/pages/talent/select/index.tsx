import { ArrowLeftOutlined } from "@ant-design/icons";
import { Avatar, Spin } from "antd";
import { useNavigate, useParams } from "react-router";

import useJob from "@/hooks/useJob";
import VionaAvatar from "@/assets/viona-avatar.png";
import SelectOrUploadTalent from "@/components/SelectOrUploadTalent";

import styles from "./style.module.less";

const TalentSelect = () => {
  const { job } = useJob();

  const { chatType } = useParams<{ chatType: TTalentChatType }>();

  const navigate = useNavigate();

  const onSubmit = (talentId: number) => {
    if (!job) return;

    navigate(
      `/app/jobs/${job.id}/talents/${talentId}/chat?chatType=${chatType}`
    );
  };

  if (!job) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ArrowLeftOutlined
          style={{
            position: "absolute",
            left: 0,
            fontSize: 20,
            cursor: "pointer",
          }}
          onClick={() => {
            navigate(`/app/jobs/${job.id}/board`);
          }}
        />
        <div>{job.name}</div>
      </div>
      <div className={styles.body}>
        <div>
          <div className={styles.avatar}>
            <Avatar src={VionaAvatar} />
            <div>Viona</div>
          </div>
          <div>
            您可以上传简历或选择一位候选人，与我一起制定该候选人的面试计划。
          </div>
          <div style={{ marginTop: 20 }}>
            <SelectOrUploadTalent
              jobId={job.id}
              onChange={(val) => {
                onSubmit(val);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalentSelect;
