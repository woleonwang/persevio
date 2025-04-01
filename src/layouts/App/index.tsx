import { Outlet, useLocation, useNavigate } from "react-router";
import {
  LeftCircleFilled,
  RightCircleFilled,
  FileDoneOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import classnames from "classnames";
import logo from "../../assets/logo.png";
import Job from "../../assets/icons/job";
import Entry from "../../assets/icons/entry";
import styles from "./style.module.less";
import Icon from "../../components/Icon";
import { useState } from "react";
import globalStore from "../../store/global";
import { observer } from "mobx-react-lite";

const MENU = [
  {
    // title: "Chat with Viona",
    // path: "/app/entry",
    title: "Open a new role",
    path: "/app/entry/create-job",
    img: <Entry />,
  },
  {
    title: "Jobs",
    path: "/app/jobs",
    img: <Job />,
  },
  {
    title: "Company Info",
    path: "/app/company",
    img: <FileDoneOutlined />,
  },
];

const FOOTER = [
  {
    title: "Settings",
    path: "/app/settings",
    img: <SettingOutlined />,
  },
];

const AppLayout = () => {
  const currentPath = useLocation().pathname;
  const navigate = useNavigate();

  const [collapse, setCollapse] = useState(false);

  const { collapseForDrawer } = globalStore;

  return (
    <div className={styles.container}>
      {collapse || collapseForDrawer ? (
        <div className={classnames(styles.menu, styles.collapse)}>
          <div style={{ position: "relative" }}>
            <RightCircleFilled
              className={styles.collapseIcon}
              onClick={() => setCollapse(false)}
            />
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
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            {FOOTER.map((item) => {
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
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.menu}>
          <div style={{ position: "relative" }}>
            <LeftCircleFilled
              className={styles.collapseIcon}
              onClick={() => setCollapse(true)}
            />
            <img src={logo} style={{ width: "80%" }} />
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
            {FOOTER.map((item) => {
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
      )}
      <div className={styles.main}>
        <Outlet />
      </div>
    </div>
  );
};

export default observer(AppLayout);
