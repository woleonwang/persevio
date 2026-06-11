import PercyAvatar from "./PercyAvatar";
import WhoIsPercyButton from "./WhoIsPercyButton";
import styles from "../style.module.less";

type TPercyHeaderProps = {
  mode?: "face" | "wave";
  avatarSize?: number;
  speech: React.ReactNode;
  title: string;
  sub: string;
};

const PercyHeader: React.FC<TPercyHeaderProps> = ({
  mode = "face",
  avatarSize,
  speech,
  title,
  sub,
}) => {
  return (
    <>
      <div className={styles.percyRow}>
        <div className={styles.percyColumn}>
          <PercyAvatar
            mode={mode}
            size={avatarSize || (mode === "wave" ? 116 : 58)}
            asset="face"
          />
          <WhoIsPercyButton />
        </div>
        <div className={styles.speechBubble}>
          <div className={styles.speechBubbleTail} />
          {speech}
        </div>
      </div>
      <h1 className={styles.serifTitle}>{title}</h1>
      <p className={styles.bodyText} style={{ marginTop: 8 }}>
        {sub}
      </p>
    </>
  );
};

export default PercyHeader;
