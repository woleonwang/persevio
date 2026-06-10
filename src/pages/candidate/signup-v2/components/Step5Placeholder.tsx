import FlowShell, { FlowShellFooterButton } from "./FlowShell";
import PercyHeader from "./PercyHeader";
import styles from "../style.module.less";

type TStep5PlaceholderProps = {
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  onContinue: () => void;
};

const Step5Placeholder: React.FC<TStep5PlaceholderProps> = ({
  jobTitle,
  companyName,
  companyLogo,
  onContinue,
}) => {
  return (
    <FlowShell
      currentStep={5}
      jobTitle={jobTitle}
      companyName={companyName}
      companyLogo={companyLogo}
      footer={
        <FlowShellFooterButton onClick={onContinue}>
          Continue to wrap-up →
        </FlowShellFooterButton>
      }
    >
      <PercyHeader
        speech="The discovery chat experience is being prepared. For now, let's move to your application wrap-up."
        title="Discovery chat"
        sub="This step will host your conversation with Percy. We're setting it up — your progress is saved."
      />

      <div
        className={styles.card}
        style={{
          marginTop: 24,
          padding: 24,
          textAlign: "center",
          background: "#FBF7EE",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
        <p className={styles.bodyText}>
          Step 5 — Discovery Chat — coming soon.
        </p>
        <p className={styles.bodyText} style={{ marginTop: 8 }}>
          You can continue to see what happens after your conversation.
        </p>
      </div>
    </FlowShell>
  );
};

export default Step5Placeholder;
