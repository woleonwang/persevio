import Bag from "../../assets/icons/bag.tsx";
import ArrowRight from "../../assets/icons/arrow-right.tsx";

import styles from "./style.module.less";
import { useNavigate } from "react-router";
import Icon from "../../components/Icon/index.tsx";
const Entry = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.container}>
      <div className={styles.title}>Tasks</div>
      <div className={styles.subTitle}>
        Unblock max to keep the hiring process moving along quickly
      </div>
      <div className={styles.buttonGroup}>
        <div
          className={styles.button}
          onClick={() => navigate("/app/jobs/create")}
        >
          <Icon icon={<Bag />} className={styles.prefixIcon} />
          Open a new role
          <Icon icon={<ArrowRight />} className={styles.suffixIcon} />
        </div>
      </div>
    </div>
  );
};

export default Entry;
