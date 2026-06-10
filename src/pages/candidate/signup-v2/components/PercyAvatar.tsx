import percyHi from "@/assets/percy-hi.png";

import styles from "../style.module.less";

type TPercyAvatarProps = {
  mode?: "face" | "wave";
  size?: number;
};

const PercyAvatar: React.FC<TPercyAvatarProps> = ({
  mode = "face",
  size = 58,
}) => {
  if (mode === "wave") {
    return (
      <img
        src={percyHi}
        alt="Percy waving"
        className={styles.percyWaveImg}
        style={{ height: size, width: "auto" }}
      />
    );
  }

  return (
    <div
      className={styles.percyAvatarRing}
      style={{ width: size, height: size }}
    >
      <img src={percyHi} alt="Percy" className={styles.percyAvatarImg} />
    </div>
  );
};

export default PercyAvatar;
