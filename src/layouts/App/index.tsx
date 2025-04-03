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
import { ReactNode, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Popover, Spin } from "antd";
import { Get } from "../../utils/request";
import { useTranslation } from "react-i18next";
import globalStore from "../../store/global";

type TMenu = {
  title: string;
  path?: string;
  img: ReactNode;
  children?: {
    title: string;
    path: string;
    active: boolean;
  }[];
};

const AppLayout = () => {
  const currentPath = useLocation().pathname;
  const navigate = useNavigate();

  const [collapse, setCollapse] = useState(false);

  const [inited, setInited] = useState(false);

  const { t, i18n } = useTranslation();

  const { jobs, fetchJobs } = globalStore;

  const { collapseForDrawer } = globalStore;

  useEffect(() => {
    init();
  }, []);

  const MENU: TMenu[] = [
    {
      title: t("menu.newRole"),
      path: "/app/entry/create-job",
      img: <Entry />,
    },
    {
      title: t("menu.jobs"),
      // path: "/app/jobs",
      img: <Job />,
      children: jobs.map((job) => {
        const path = `/app/jobs/${job.id}`;
        return {
          title: job.name,
          path,
          active: currentPath.startsWith(path),
        };
      }),
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
  const init = async () => {
    try {
      // 校验 token
      const { code, data } = await Get("/api/settings");
      if (code === 0) {
        i18n.changeLanguage(data.lang ?? "en-US");
        setInited(true);
        // 获取职位
        fetchJobs();
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
                const isActive = item.path && currentPath.startsWith(item.path);

                const menuNode: ReactNode = (
                  <div
                    className={`${styles.menuItem} ${
                      isActive ? styles.active : ""
                    }`}
                    key={item.path}
                    onClick={
                      item.path
                        ? () => navigate(item.path as string)
                        : undefined
                    }
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

                if (!item.children) return menuNode;

                return (
                  <Popover
                    placement="rightTop"
                    rootClassName={styles.collapseSubMenuContainer}
                    // openClassName={styles.collapseSubMenuContainer}
                    // className={styles.collapseSubMenuContainer}
                    content={
                      <div>
                        {item.children.map((child) => {
                          return (
                            <div
                              className={`${styles.subMenuItem} ${
                                child.active ? styles.active : ""
                              }`}
                              key={item.path}
                              onClick={() => navigate(child.path)}
                            >
                              {child.title}
                            </div>
                          );
                        })}
                      </div>
                    }
                  >
                    {menuNode}
                  </Popover>
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
                const isActive = item.path && currentPath.startsWith(item.path);
                return (
                  <>
                    <div
                      className={`${styles.menuItem} ${
                        isActive ? styles.active : ""
                      }`}
                      key={item.path}
                      onClick={
                        item.path
                          ? () => navigate(item.path as string)
                          : undefined
                      }
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
                    {item.children && (
                      <div className={styles.subMenuContainer}>
                        {item.children.map((child) => {
                          return (
                            <div
                              className={`${styles.subMenuItem} ${
                                child.active ? styles.active : ""
                              }`}
                              key={item.path}
                              onClick={() => navigate(child.path)}
                            >
                              {child.title}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
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
