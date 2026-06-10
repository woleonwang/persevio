import CandidateChat from "@/components/CandidateChat";
import Icon from "@/components/Icon";
import WhatsappIcon from "@/assets/icons/whatsapp";

import FlowShell from "./FlowShell";
import styles from "../style.module.less";

type TStep5DiscoveryProps = {
  jobApply?: IJobApply;
  onFinishChat: () => void;
};

const Step5Discovery: React.FC<TStep5DiscoveryProps> = ({
  jobApply,
  onFinishChat,
}) => {
  const isWhatsapp = jobApply?.interview_mode === "whatsapp";

  return (
    <FlowShell currentStep={5} showJobHeader={false} showProgress>
      {isWhatsapp ? (
        <div className={styles.step5WhatsappWrap}>
          <div className={styles.step5WhatsappIcon}>
            <Icon icon={<WhatsappIcon />} style={{ fontSize: 72 }} />
          </div>
          <h1 className={styles.serifTitle}>Let's continue on WhatsApp</h1>
          <p className={styles.bodyText} style={{ marginTop: 12, maxWidth: 420 }}>
            I've just sent you a message on WhatsApp so we can pick up where my
            read leaves off. Reply when you have a moment — I'll guide our
            discovery conversation there, at your pace.
          </p>
          <p className={styles.bodyText} style={{ marginTop: 14, maxWidth: 420 }}>
            Once we've finished talking, <strong>refresh this page</strong> and
            I'll take you to your application summary.
          </p>
        </div>
      ) : (
        <div className={styles.step5ChatWrap}>
          <CandidateChat
            chatType="job_interview"
            jobApplyId={jobApply?.id}
            onFinish={onFinishChat}
          />
        </div>
      )}
    </FlowShell>
  );
};

export default Step5Discovery;
