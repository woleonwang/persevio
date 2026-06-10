import { useState } from "react";
import { Button } from "antd";

import WhoIsPercyModal from "./WhoIsPercyModal";
import styles from "../style.module.less";

const WhoIsPercyButton: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
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
      <WhoIsPercyModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default WhoIsPercyButton;
