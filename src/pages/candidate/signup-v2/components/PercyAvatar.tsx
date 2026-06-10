import percyHi from "@/assets/percy-hi.png";

import styles from "../style.module.less";

type TPercyAvatarProps = {
  mode?: "face" | "wave";
  size?: number;
  presence?: boolean;
};

const PercyAvatar: React.FC<TPercyAvatarProps> = ({
  mode = "face",
  size = 58,
  presence = false,
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
    <div className={styles.percyAvatarWrap} style={{ width: size, height: size }}>
      <div
        className={styles.percyAvatarRing}
        style={{ width: size, height: size }}
      >
        <img src={percyHi} alt="Percy" className={styles.percyAvatarImg} />
      </div>
      {presence && <span className={styles.percyPresenceDot} />}
    </div>
  );
};

export default PercyAvatar;
