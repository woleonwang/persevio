import Logo from "@/assets/logo.png";
import styles from "./style.module.less";
import classnames from "classnames";

const Approve = ({ status }: { status: string }) => {
  return (
    <div className={styles.container}>
      <div
        className={styles.body}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div className={styles.logoWrapper}>
          <img src={Logo} style={{ width: 250 }} />
        </div>

        <div
          className={classnames(styles.textWrapper, {
            [styles.rejected]: status === "rejected",
          })}
        >
          {status === "pending"
            ? "非常感谢您的时间！您的背景和需求我已经清晰了解了。我会尽快为您寻找合适的人选，一有消息就第一时间联系您。"
            : "您的申请已被拒绝，请联系 viona@persevio.ai"}
        </div>
      </div>
    </div>
  );
};

export default Approve;
