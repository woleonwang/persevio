import ChatRoomNew from "@/components/ChatRoomNew";
import useJob from "@/hooks/useJob";
import useTalent from "@/hooks/useTalent";
import { Get } from "@/utils/request";
import { Button, Radio, Select, Spin } from "antd";
import { useEffect, useState } from "react";
import InterviewDesignerForm from "./components/InterviewDesignForm";
import InterviewFeedbacksForm from "./components/InterviewFeedbackForm";

type TChatType = "interview_designer" | "interview_feedback";

const totalRound = 4;

const TalentChat = () => {
  const { job } = useJob();
  const { talent } = useTalent();
  const initChatType = (new URLSearchParams(window.location.search).get(
    "chatType"
  ) ?? "interview_designer") as TChatType;
  const [round, setRound] = useState<number>(1);
  const [chatType, setChatType] = useState<TChatType>(initChatType);
  const [chatInstance, setChatInstance] = useState<
    TInterviewFeedback | TInterviewDesigner
  >();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (job) {
      fetchChatInstance();
    }
  }, [job, chatType, round]);

  const fetchChatInstance = async () => {
    const { code, data } = await Get(
      `/api/jobs/${job?.id}/talents/${talent?.id}/${chatType}?round=${round}`
    );
    if (code === 0) {
      setChatInstance(data[chatType]);
    } else {
      setChatInstance(undefined);
    }
  };

  if (!job || !talent) {
    return <Spin />;
  }

  return (
    <div>
      <div>
        {talent.name} - {job.name}
        {!!chatInstance && (
          <div>
            <Button
              onClick={() => {
                setIsEditing(true);
              }}
            >
              编辑上下文
            </Button>
          </div>
        )}
      </div>
      {!isEditing && (
        <div>
          <Select
            value={round}
            onChange={(value) => setRound(value)}
            options={new Array(totalRound).fill(0).map((_, index) => ({
              value: index + 1,
              label: `Round ${index + 1}`,
            }))}
          />

          <Radio.Group
            optionType="button"
            value={chatType}
            onChange={(e) => setChatType(e.target.value)}
            options={[
              {
                label: "推荐面试问题",
                value: "interview_designer",
              },
              {
                label: "填写评分卡",
                value: "interview_feedback",
              },
            ]}
          />
        </div>
      )}

      <div>
        {!!chatInstance ? (
          isEditing ? (
            chatType === "interview_designer" ? (
              <InterviewDesignerForm
                key={round}
                type="edit"
                jobId={job.id}
                talentId={talent.id}
                round={round}
                interviewDesignerId={chatInstance.id}
                onFinish={() => {}}
              />
            ) : (
              <InterviewFeedbacksForm
                key={round}
                type="edit"
                jobId={job.id}
                talentId={talent.id}
                round={round}
                interviewFeedbackId={chatInstance.id}
                onFinish={() => {}}
              />
            )
          ) : (
            <div>
              <ChatRoomNew
                key={chatType}
                jobId={job.id}
                allowEditMessage
                userRole="staff"
                chatType={
                  chatType === "interview_designer"
                    ? "jobInterviewDesign"
                    : "jobInterviewFeedback"
                }
                {...{
                  [chatType === "interview_designer"
                    ? "jobInterviewDesignerId"
                    : "jobInterviewFeedbackId"]: chatInstance.id,
                }}
              />
            </div>
          )
        ) : chatType === "interview_designer" ? (
          <InterviewDesignerForm
            key={round}
            type="create"
            jobId={job.id}
            talentId={talent.id}
            round={round}
            onFinish={() => {}}
          />
        ) : (
          <InterviewFeedbacksForm
            key={round}
            type="create"
            jobId={job.id}
            talentId={talent.id}
            round={round}
            onFinish={() => {}}
          />
        )}
      </div>
    </div>
  );
};

export default TalentChat;
