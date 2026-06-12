import { useState } from "react";
import { message } from "antd";

import CandidateChat from "@/components/CandidateChat";
import Icon from "@/components/Icon";
import WhatsappIcon from "@/assets/icons/whatsapp";
import { Post } from "@/utils/request";

import FlowShell from "./FlowShell";
import styles from "../style.module.less";

type TStep5DiscoveryProps = {
  jobApply?: IJobApply;
  onFinishChat: () => void;
  onRefreshJobApply?: () => Promise<IJobApply | undefined>;
};

const Step5Discovery: React.FC<TStep5DiscoveryProps> = ({
  jobApply,
  onFinishChat,
  onRefreshJobApply,
}) => {
  const [switchingToAi, setSwitchingToAi] = useState(false);
  const isWhatsapp = jobApply?.interview_mode === "whatsapp";

  const handleChatHereInstead = async () => {
    if (!jobApply?.id) {
      message.error("Application not found");
      return;
    }

    setSwitchingToAi(true);
    const { code } = await Post(
      `/api/candidate/job_applies/${jobApply.id}/interview_mode`,
      {
        mode: "ai",
        from: "web",
      },
    );

    if (code === 0) {
      await onRefreshJobApply?.();
      setSwitchingToAi(false);
      return;
    }

    setSwitchingToAi(false);
    message.error("Failed to start chat here");
  };

  return (
    <FlowShell
      currentStep={5}
      showJobHeader={false}
      showProgress
      wide={!isWhatsapp}
    >
      {isWhatsapp ? (
        <div className={styles.step5WhatsappWrap}>
          <div className={styles.step5WhatsappIcon}>
            <Icon icon={<WhatsappIcon />} style={{ fontSize: 72 }} />
          </div>
          <h1 className={styles.serifTitle}>Let's continue on WhatsApp</h1>
          <p
            className={styles.bodyText}
            style={{ marginTop: 12, maxWidth: 420 }}
          >
            I've just sent you a message on WhatsApp so we can pick up where my
            read leaves off. Reply when you have a moment — I'll guide our
            discovery conversation there, at your pace.
          </p>
          <p
            className={styles.bodyText}
            style={{ marginTop: 14, maxWidth: 420 }}
          >
            Once we've finished talking, <strong>refresh this page</strong> and
            I'll take you to your application summary.
          </p>
          <button
            type="button"
            className={styles.step5WhatsappAltButton}
            disabled={switchingToAi}
            onClick={() => void handleChatHereInstead()}
          >
            {switchingToAi ? "Switching…" : "Chat here instead"}
          </button>
        </div>
      ) : (
        <div className={styles.step5ChatWrap}>
          <CandidateChat
            chatType="job_interview"
            jobApplyId={jobApply?.id}
            transparentBackground
            onFinish={onFinishChat}
          />
        </div>
      )}
    </FlowShell>
  );
};

export default Step5Discovery;
