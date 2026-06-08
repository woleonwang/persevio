import { Tooltip } from "antd";
import styles from "./style.module.less";

const NameChip = (props: { name: string }) => {
  const { name } = props;

  if (!name) return null;

  return (
    <Tooltip title={name}>
      <div className={styles.nameChip}>{name}</div>
    </Tooltip>
  );
};

export default NameChip;
