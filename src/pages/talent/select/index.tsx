import { Avatar, Spin } from "antd";
import { useNavigate, useParams } from "react-router";

import useJob from "@/hooks/useJob";
import VionaAvatar from "@/assets/viona-avatar.png";
import SelectOrUploadTalent from "@/components/SelectOrUploadTalent";

type TChatType = "interview_designer" | "interview_feedback";
const TalentSelect = () => {
  const { job } = useJob();

  const { chatType } = useParams<{ chatType: TChatType }>();

  const navigate = useNavigate();

  const onSubmit = (talentId: number) => {
    if (!job) return;

    navigate(`/app/jobs/${job.id}/talents/${talentId}/chat?chatType=${chatType}`);
  };

  if (!job) {
    return <Spin />;
  }

  return (
    <div>
      <div>{job.name}</div>

      <div>
        <div>
          <Avatar src={VionaAvatar} />
          <div>Viona</div>
        </div>
        <div>
          <div>
            您可以上传简历或选择一位候选人，与我一起制定该候选人的面试计划。
          </div>
          <div>
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
