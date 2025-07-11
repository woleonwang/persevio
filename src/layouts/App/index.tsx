import { Outlet, useLocation, useNavigate } from "react-router";

import {
  LeftCircleFilled,
  RightCircleFilled,
  FileDoneOutlined,
  SettingOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import classnames from "classnames";
import logo from "../../assets/logo.png";
import Job from "../../assets/icons/job";
import Entry from "../../assets/icons/entry";
import styles from "./style.module.less";
import Icon from "../../components/Icon";
import { ReactNode, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { message, Modal, Popover, Spin } from "antd";
import { Get, Post } from "../../utils/request";
import { useTranslation } from "react-i18next";
import globalStore from "../../store/global";

const AppLayout = () => {
  const currentPath = useLocation().pathname;
  const [isAdmin, setIsAdmin] = useState(false);

  const currentUrl = encodeURIComponent(location.pathname + location.search);

  const LayoutMapping = {
    blank: [/^\/app\/jobs\/\d+\/talents\/\d+$/],
  };

  const layout =
    (
      Object.keys(LayoutMapping) as unknown as (keyof typeof LayoutMapping)[]
    ).find((key: keyof typeof LayoutMapping) => {
      return LayoutMapping[key].some((regex) => {
        if (regex.test(currentPath)) {
          return key;
        }
      });
    }) ?? "default";

  const navigate = useNavigate();

  const [inited, setInited] = useState(false);

  const { t, i18n } = useTranslation();

  const { jobs, fetchJobs } = globalStore;

  const { menuCollapse, collapseForDrawer, setMenuCollapse } = globalStore;

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
        const isActive = currentPath.startsWith(path);
        return {
          title: job.name,
          path,
          active: isActive,
          onRemove: () => {
            Modal.confirm({
              title: "Delete Job",
              content: `Are you sure you want to delete【${job.name}】?`,
              onOk: async () => {
                const { code } = await Post(`/api/jobs/${job.id}/destroy`);
                if (code === 0) {
                  message.success(t("submit_succeed"));
                  fetchJobs();
                  if (isActive) {
                    navigate("/app/entry/create-job");
                  }
                }
              },
            });
          },
        };
      }),
    },
    {
      title: t("menu.company"),
      path: "/app/company",
      img: <FileDoneOutlined />,
    },
    {
      title: t("menu.interviewer"),
      path: "/app/interviewer",
      img: <FileDoneOutlined />,
    },
    {
      title: t("职位管理"),
      path: "/app/admin/jobs",
      img: <FileDoneOutlined />,
      requireAdmin: true,
    },
    {
      title: t("申请管理"),
      path: "/app/admin/job-applies",
      img: <FileDoneOutlined />,
      requireAdmin: true,
    },
  ].filter((item) => !item.requireAdmin || isAdmin);

  const FOOTER = [
    {
      title: t("menu.settings"),
      path: "/app/settings",
      img: <SettingOutlined />,
    },
  ];

  const init = async () => {
    // 校验 token
    const { code, data } = await Get("/api/settings");
    if (code === 0) {
      i18n.changeLanguage(data.lang ?? "en-US");
      setInited(true);
      // 获取职位
      fetchJobs();
      setIsAdmin(data.is_admin);
    } else {
      navigate(`/signin?redirect=${currentUrl}`);
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
                              <div>{child.title}</div>
                              {!!child.onRemove && (
                                <div
                                  className={styles.deleteIcon}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    child.onRemove?.();
                                  }}
                                >
                                  <DeleteOutlined />
                                </div>
                              )}
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

export default observer(AppLayout);
