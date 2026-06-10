import percyHi from "@/assets/percy-hi.png";
import percyHiFace from "@/assets/percy-hi-face.png";

import styles from "../style.module.less";

type TPercyAvatarProps = {
  mode?: "face" | "wave";
  size?: number;
  presence?: boolean;
  ring?: boolean;
  asset?: "hi" | "face";
};

const PercyAvatar: React.FC<TPercyAvatarProps> = ({
  mode = "face",
  size = 58,
  presence = false,
  ring = true,
  asset = "hi",
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

  const isFaceAsset = asset === "face";
  const ringClassName = isFaceAsset
    ? ring
      ? styles.percyAvatarRingFace
      : styles.percyAvatarRingFacePlain
    : styles.percyAvatarRing;
  const imgClassName = isFaceAsset
    ? styles.percyAvatarImgFace
    : styles.percyAvatarImg;

  return (
    <div className={styles.percyAvatarWrap} style={{ width: size, height: size }}>
      <div
        className={ringClassName}
        style={{ width: size, height: size }}
      >
        <img
          src={isFaceAsset ? percyHiFace : percyHi}
          alt="Percy"
          className={imgClassName}
        />
      </div>
      {presence && <span className={styles.percyPresenceDot} />}
    </div>
  );
};

export default PercyAvatar;
