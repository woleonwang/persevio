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
import { useEffect, useState } from "react";
import globalStore from "../../store/global";
import { observer } from "mobx-react-lite";
import { Spin } from "antd";
import { Get } from "../../utils/request";
import { useTranslation } from "react-i18next";

const AppLayout = () => {
  const currentPath = useLocation().pathname;
  const navigate = useNavigate();

  const [collapse, setCollapse] = useState(false);

  const [inited, setInited] = useState(false);

  const { t, i18n } = useTranslation();

  const { collapseForDrawer } = globalStore;

  useEffect(() => {
    getBasicInfo();
  }, []);

  const MENU = [
    {
      // title: "Chat with Viona",
      // path: "/app/entry",
      title: t("menu.newRole"),
      path: "/app/entry/create-job",
      img: <Entry />,
    },
    {
      title: t("menu.jobs"),
      path: "/app/jobs",
      img: <Job />,
    },
    {
      title: t("menu.company"),
      path: "/app/company",
      img: <FileDoneOutlined />,
    },
  ];

  const FOOTER = [
    {
      title: t("menu.settings"),
      path: "/app/settings",
      img: <SettingOutlined />,
    },
  ];
  const getBasicInfo = async () => {
    try {
      const { code, data } = await Get("/api/settings");
      if (code === 0) {
        i18n.changeLanguage(data.lang ?? "en-US");
        setInited(true);
      }
    } catch (e) {
      navigate("/signin");
    }
  };

  if (!inited) {
    return (
      <div
        style={{
          width: "100vw",
          height: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {t("hello")}
        <Spin size="large" />
      </div>
    );
  }
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
