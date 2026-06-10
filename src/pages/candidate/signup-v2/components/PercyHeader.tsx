import { useState } from "react";
import { Button } from "antd";

import PercyAvatar from "./PercyAvatar";
import WhoIsPercyModal from "./WhoIsPercyModal";
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
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className={styles.percyRow}>
        <div className={styles.percyColumn}>
          <PercyAvatar mode={mode} size={avatarSize || (mode === "wave" ? 116 : 58)} />
          <Button
            type="link"
            className={styles.whoIsPercyLink}
            onClick={() => setModalOpen(true)}
          >
            <span className={styles.whoIsPercyIcon} aria-hidden="true">
              ?
            </span>
            <span className={styles.whoIsPercyLabel}>Who is Percy?</span>
          </Button>
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
      <WhoIsPercyModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default PercyHeader;
