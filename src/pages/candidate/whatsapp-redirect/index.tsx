import { getQuery } from "@/utils";
import { useEffect, useState } from "react";
import { message, Spin } from "antd";
import { Get, Post } from "@/utils/request";
import { useNavigate } from "react-router";

const WhatsappRedirect = () => {
  const [status, setStatus] = useState<"handling" | "error">("handling");

  const navigate = useNavigate();
  useEffect(() => {
    const action = getQuery("action");
    const jobId = getQuery("job_id");
    if (action === "switch_to_human") {
      switchConversationMode("human", jobId);
    } else if (action === "switch_to_ai") {
      switchConversationMode("ai", jobId);
    }
  }, []);

  const fetchJobApply = async (
    jobId: string
  ): Promise<IJobApply | undefined> => {
    const { code, data } = await Get(`/api/candidate/jobs/${jobId}/job_apply`);
    if (code === 0) {
      return data.job_apply as IJobApply;
    }
    return undefined;
  };

  const switchConversationMode = async (
    mode: "human" | "ai",
    jobId: string
  ) => {
    const jobApply = await fetchJobApply(jobId);
    if (!jobApply) {
      setStatus("error");
      return;
    }
    const { code } = await Post(
      `/api/candidate/job_applies/${jobApply.id}/interview_mode`,
      {
        mode,
      }
    );

    if (code === 0) {
      message.success(`Switch successful`);
      navigate(`/apply-job/${jobId}`, { replace: true });
    } else {
      setStatus("error");
    }
  };

  if (status === "handling") {
    return (
      <div className="flex-center">
        <Spin size="large" />
      </div>
    );
  } else if (status === "error") {
    return <div className="flex-center">处理失败，请联系客服</div>;
  }

  return null;
};

export default WhatsappRedirect;
