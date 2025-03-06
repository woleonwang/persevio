import { Outlet } from "react-router";
import logo from "../../assets/logo.png";
import menuChat from "../../assets/menu-chat.png";
import styles from "./style.module.less";

const AppLayout = () => {
  return (
    <div className={styles.container}>
      <div className={styles.menu}>
        <img src={logo} style={{ width: "100%" }} />
        <div className={styles.menuItemWrapper}>
          <div className={`${styles.menuItem} ${styles.active}`}>
            <img src={menuChat} style={{ width: 24 }} />
            <span style={{ marginLeft: 16 }}>Chat with Viona</span>
          </div>
        </div>
      </div>
      <div className={styles.main}>
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
