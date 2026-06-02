import StaffChat from "@/components/StaffChat";

import styles from "./style.module.less";
import { useEffect, useState } from "react";
import { Post } from "@/utils/request";

interface IProps {
  jobId: string | number;
  talentId: number;
  source: "reject_calibration" | "evaluate_feedback";
}
const Details = (props: IProps) => {
  const { jobId, talentId, source } = props;

  const [jrdConversationId, setJrdConversationId] = useState<number>();
  const chatType =
    source === "reject_calibration"
      ? "jobJrdEdit"
      : "jobTalentEvaluateFeedback";

  useEffect(() => {
    if (source === "reject_calibration") {
      createJrdConversation();
    }
  }, [source]);

  const createJrdConversation = async () => {
    const { code, data } = await Post(
      `/api/jobs/${jobId}/jrd-edit-conversations`,
      {
        talent_id: talentId,
        source: "reject_calibration",
      },
    );
    if (code === 0) {
      setJrdConversationId(data.id);
    }
  };

  if (source === "reject_calibration" && !jrdConversationId) {
    return null;
  }

  return (
    <div className={styles.container}>
      <StaffChat
        chatType={chatType}
        jrdEditConversationId={jrdConversationId}
        jobId={jobId}
        talentId={talentId}
        hidePredefinedButtons
      />
    </div>
  );
};

export default Details;
