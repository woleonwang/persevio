import styles from "./style.module.less";
import classnames from "classnames";

const Waiting = () => {
  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <div className={classnames(styles.textWrapper)}>
          我们的顾问将在 1-2个工作日内与您联系，请耐心等待！
        </div>
      </div>
    </div>
  );
};

export default Waiting;
