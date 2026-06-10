import PercyAvatar from "./PercyAvatar";
import { SignupPrimaryButton } from "./FlowShell";
import styles from "../style.module.less";

type TWhoIsPercyModalProps = {
  open: boolean;
  onClose: () => void;
};

const WhoIsPercyModal: React.FC<TWhoIsPercyModalProps> = ({ open, onClose }) => {
  if (!open) {
    return null;
  }

  return (
    <>
      <div className={styles.sheetBackdrop} onClick={onClose} />
      <div className={styles.modalPanel} role="dialog" aria-modal="true">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <PercyAvatar size={72} />
          <div className={styles.eyebrow}>Your dedicated talent consultant</div>
          <h2 className={styles.serifTitle} style={{ fontSize: 24, textAlign: "center" }}>
            Meet Percy
          </h2>
        </div>
        <p className={styles.bodyText} style={{ marginTop: 16 }}>
          I work for you — not the employer. My job is to understand your background,
          represent you fairly, and help you land the right opportunities.
        </p>
        <p className={styles.bodyText} style={{ marginTop: 12 }}>
          I partner with hiring teams, but my loyalty is to you. I'll give you honest
          reads, keep you updated, and advocate for you throughout the process.
        </p>
        <p className={styles.bodyText} style={{ marginTop: 12 }}>
          This application is just the start. You can message me on Persevio or
          WhatsApp anytime for updates and career support.
        </p>
        <SignupPrimaryButton style={{ marginTop: 20 }} onClick={onClose}>
          Got it
        </SignupPrimaryButton>
      </div>
    </>
  );
};

export default WhoIsPercyModal;
