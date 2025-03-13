import { Outlet, useLocation, useNavigate } from "react-router";
import logo from "../../assets/logo.png";
import Job from "../../assets/icons/job";
import Entry from "../../assets/icons/entry";
import styles from "./style.module.less";
import Icon from "../../components/Icon";
import { Button } from "antd";

const MENU = [
  {
    title: "Chat with Viona",
    path: "/app/entry",
    img: <Entry />,
  },
  {
    title: "Jobs",
    path: "/app/jobs",
    img: <Job />,
  },
];

const AppLayout = () => {
  const currentPath = useLocation().pathname;
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  return (
    <div className={styles.container}>
      <div className={styles.menu}>
        <div>
          <img src={logo} style={{ width: "100%" }} />
          <div className={styles.menuItemWrapper}>
            {MENU.map((item) => {
              const isActive = currentPath.startsWith(item.path);
              return (
                <div
                  className={`${styles.menuItem} ${
                    isActive ? styles.active : ""
                  }`}
                  key={item.path}
                  onClick={() => navigate(item.path)}
                >
                  <Icon
                    icon={item.img}
                    style={{
                      fontSize: 20,
                      color: isActive ? "#1FAC6A" : "#949DAC",
                    }}
                  />
                  <span style={{ marginLeft: 16 }}>{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <Button
            type="primary"
            onClick={() => logout()}
            style={{ width: "100%" }}
          >
            Logout
          </Button>
        </div>
      </div>
      <div className={styles.main}>
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
