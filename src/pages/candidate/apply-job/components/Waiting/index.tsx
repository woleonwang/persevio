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
        <div
          className={classnames(styles.textWrapper)}
          dangerouslySetInnerHTML={{
            __html:
              mode === "ai"
                ? "Excellent! <br/>We have everything we need for now and are preparing your application. <br/>We're now working to get you feedback as quickly as possible."
                : "Thank you.  A consultant will be calling you soon.",
          }}
        />
      </div>
    </div>
  );
};

export default Waiting;
