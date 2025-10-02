import styles from "./style.module.less";
import classnames from "classnames";

interface IProps {
  mode: "ai" | "human";
}
const Waiting = (props: IProps) => {
  const { mode } = props;
  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <div className={classnames(styles.textWrapper)}>
          {mode === "ai"
            ? "Excellent! We have everything we need for now and are preparing your application. We're now working to get you feedback as quickly as possible."
            : "Thank you.  A consultant will be calling you soon."}
        </div>
      </div>
    </div>
  );
};

export default Waiting;
