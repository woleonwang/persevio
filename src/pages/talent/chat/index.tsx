import { ArrowLeftOutlined } from "@ant-design/icons";
import ChatRoomNew from "@/components/ChatRoomNew";
import useJob from "@/hooks/useJob";
import useTalent from "@/hooks/useTalent";
import { Get } from "@/utils/request";
import { Button, Radio, Select, Spin } from "antd";
import { useEffect, useState } from "react";
import InterviewDesignerForm from "./components/InterviewDesignForm";
import InterviewFeedbacksForm from "./components/InterviewFeedbackForm";
import { useNavigate } from "react-router";

import styles from "./style.module.less";
import { parseJSON } from "@/utils";

const TalentChat = () => {
  const { job } = useJob();
  const { talent } = useTalent();
  const initChatType = (new URLSearchParams(window.location.search).get(
    "chatType"
  ) ?? "interview_designer") as TTalentChatType;

  const initRound =
    new URLSearchParams(window.location.search).get("round") ?? "1";
  const [round, setRound] = useState<number>(parseInt(initRound));
  const [chatType, setChatType] = useState<TTalentChatType>(initChatType);
  const [chatInstance, setChatInstance] = useState<
    TInterviewFeedback | TInterviewDesigner
  >();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingInstance, setIsLoadingInstance] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (job) {
      fetchChatInstance();
    }
  }, [job, chatType, round]);

  const interviewPlan = parseJSON(
    job?.interview_plan_json
  ) as TInterviewPlanDetail;

  const totalRound = (interviewPlan.rounds ?? []).length;

  const fetchChatInstance = async () => {
    setIsLoadingInstance(true);
    const { code, data } = await Get(
      `/api/jobs/${job?.id}/talents/${talent?.id}/${chatType}?round=${round}`
    );
    if (code === 0) {
      setChatInstance(data[chatType]);
    } else {
      setChatInstance(undefined);
    }
    setIsLoadingInstance(false);
  };

  if (!job || !talent || isLoadingInstance) {
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
        {talent.name} - {job.name}
        <div
          style={{
            position: "absolute",
            right: 0,
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          {!!chatInstance && (
            <Button
              onClick={() => {
                setIsEditing(true);
              }}
              style={{ marginRight: 12 }}
            >
              编辑上下文
            </Button>
          )}
          <Button
            onClick={() => {
              navigate(`/app/jobs/${job.id}/talents/${talent.id}/detail`);
            }}
          >
            面试详情
          </Button>
        </div>
      </div>
      {!isEditing && (
        <div className={styles.selector}>
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

      <div className={styles.body}>
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
                onFinish={() => fetchChatInstance()}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <InterviewFeedbacksForm
                key={round}
                type="edit"
                jobId={job.id}
                talentId={talent.id}
                round={round}
                interviewFeedbackId={chatInstance.id}
                onFinish={() => fetchChatInstance()}
                onCancel={() => setIsEditing(false)}
              />
            )
          ) : (
            <ChatRoomNew
              key={`${chatType}-${round}`}
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
          )
        ) : chatType === "interview_designer" ? (
          <InterviewDesignerForm
            key={round}
            type="create"
            jobId={job.id}
            talentId={talent.id}
            round={round}
            onFinish={() => fetchChatInstance()}
          />
        ) : (
          <InterviewFeedbacksForm
            key={round}
            type="create"
            jobId={job.id}
            talentId={talent.id}
            round={round}
            onFinish={() => fetchChatInstance()}
          />
        )}
      </div>
    </div>
  );
};

export default TalentChat;
