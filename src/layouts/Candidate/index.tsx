import { Outlet, useLocation, useNavigate } from "react-router";
import {
  LeftCircleFilled,
  ProfileOutlined,
  RightCircleFilled,
  SettingOutlined,
} from "@ant-design/icons";
import { ReactNode, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Popover, Spin } from "antd";
import { Get } from "../../utils/request";
import { useTranslation } from "react-i18next";
import styles from "./style.module.less";
import globalStore from "@/store/global";
import classnames from "classnames";
import Icon from "@/components/Icon";
import logo from "../../assets/logo.png";

const CandidateLayout = () => {
  const currentPath = useLocation().pathname;

  const navigate = useNavigate();

  const LayoutMapping = {
    blank: [],
  };

  const layout =
    (
      Object.keys(LayoutMapping) as unknown as (keyof typeof LayoutMapping)[]
    ).find((key: keyof typeof LayoutMapping) => {
      return LayoutMapping[key].some((regex) => {
        // @ts-ignore
        if (regex.test(currentPath)) {
          return key;
        }
      });
    }) ?? "default";

  const [inited, setInited] = useState(false);

  const { t, i18n } = useTranslation();

  const { menuCollapse, collapseForDrawer, setMenuCollapse } = globalStore;

  useEffect(() => {
    init();
  }, []);

  const MENU: TMenu[] = [
    {
      title: t("menu.home"),
      path: "/candidate/home",
      img: <ProfileOutlined />,
    },
    {
      title: t("menu.profile"),
      path: "/candidate/profile",
      img: <ProfileOutlined />,
    },
    {
      title: t("menu.aspirations"),
      path: "/candidate/aspirations",
      img: <ProfileOutlined />,
    },
    {
      title: t("menu.job_applies"),
      path: "/candidate/job-applies",
      img: <ProfileOutlined />,
    },
  ];

  const FOOTER = [
    {
      title: t("menu.settings"),
      path: "/candidate/settings",
      img: <SettingOutlined />,
    },
  ];

  const init = async () => {
    // 校验 token
    const { code, data } = await Get("/api/candidate/settings");
    if (code === 0) {
      setInited(true);
      i18n.changeLanguage(data.candidate.lang ?? "zh-CN");
      if (!(data.candidate as ICandidateSettings).interview_finished_at) {
        navigate("/signup-candidate");
      }
    } else {
      navigate("/signin-candidate");
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

  if (layout === "blank") {
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
  }

  return (
    <div className={styles.container}>
      {menuCollapse || collapseForDrawer ? (
        <div className={classnames(styles.menu, styles.collapse)}>
          <div style={{ position: "relative" }}>
            <RightCircleFilled
              className={styles.collapseIcon}
              onClick={() => setMenuCollapse(false)}
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
                              key={child.path}
                              onClick={() => navigate(child.path)}
                            >
                              {child.title}
                            </div>
                          );
                        })}
                      </div>
                    }
                    key={item.title}
                  >
                    {menuNode}
                  </Popover>
                );
              })}
            </div>
          </div>
          {/* <div>
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
          </div> */}
        </div>
      ) : (
        <div className={styles.menu}>
          <div style={{ position: "relative" }}>
            <LeftCircleFilled
              className={styles.collapseIcon}
              onClick={() => setMenuCollapse(true)}
            />
            <img src={logo} style={{ width: "80%" }} />
            <div className={styles.menuItemWrapper}>
              {MENU.map((item) => {
                const isActive = item.path && currentPath.startsWith(item.path);
                return (
                  <div key={item.title}>
                    <div
                      className={`${styles.menuItem} ${
                        isActive ? styles.active : ""
                      }`}
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
                              key={child.path}
                              onClick={() => navigate(child.path)}
                            >
                              {child.title}
                            </div>
                          );
                        })}
                      </div>
                    )}
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

export default observer(CandidateLayout);
