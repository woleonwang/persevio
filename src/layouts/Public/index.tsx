import { Outlet } from "react-router";

import classnames from "classnames";
import logo from "../../assets/logo.png";
import styles from "./style.module.less";
import { observer } from "mobx-react-lite";
const PublicLayout = () => {
  return (
    <div className={classnames(styles.container, styles.v)}>
      <div>
        <img src={logo} style={{ width: 220, margin: "21px 28px" }} />
      </div>
      <div
        className={styles.main}
        style={{ background: "rgba(247, 248, 250, 1)" }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default observer(PublicLayout);
