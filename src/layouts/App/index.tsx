import { Outlet, useLocation, useNavigate } from "react-router";

import {
  FileDoneOutlined,
  SettingOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import classnames from "classnames";
import logo from "../../assets/logo.png";
import Job from "../../assets/icons/job";
import Entry from "../../assets/icons/entry";
import styles from "./style.module.less";
import Icon from "../../components/Icon";
import { ReactNode, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Input, message, Modal, Popover, Spin, Badge } from "antd";
import { Get, Post } from "../../utils/request";
import { useTranslation } from "react-i18next";
import globalStore from "../../store/global";
import { deleteQuery, getQuery } from "@/utils";
import CollapseIcon from "@/assets/icons/collaspe";

const AppLayout = () => {
  const currentPath = useLocation().pathname;
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaffAdmin, setIsStaffAdmin] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const getCurrentUrl = () =>
    encodeURIComponent(location.pathname + location.search);

  const LayoutMapping = {
    blank: [/^\/app\/jobs\/\d+\/talents\/\d+$/, /^\/app\/company\/status$/],
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

  const {
    jobs,
    unreadTalentsCount,
    mode,
    fetchJobs,
    fetchUnreadTalentsCount,
    setMode,
  } = globalStore;

  const { menuCollapse, collapseForDrawer, setMenuCollapse } = globalStore;

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    // 获取未读候选人数量
    fetchUnreadTalentsCount();
  }, []);

  const MENU: TMenu[] = [
    {
      title: t("menu.newRole"),
      path: "/app/entry/create-job",
      img: <Entry />,
    },
    {
      title: t("menu.jobs"),
      key: "jobs",
      // path: "/app/jobs",
      img: <Job />,
      children: jobs
        .filter((job) => !searchKeyword || job.name.includes(searchKeyword))
        .map((job) => {
          const path =
            mode === "standard"
              ? `/app/jobs/${job.id}/standard-board`
              : `/app/jobs/${job.id}/board`;
          const isActive = currentPath.startsWith(path);
          return {
            title: job.name,
            path,
            active: isActive,
            onRemove: () => {
              Modal.confirm({
                title: t("app_layout.delete_job"),
                content: t("app_layout.delete_job_confirm", {
                  jobName: job.name,
                }),
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
      title: t("menu.talents"),
      path: "/app/talents",
      img: <FileDoneOutlined />,
      badge: unreadTalentsCount > 0 ? unreadTalentsCount : undefined,
    },
    {
      title: t("menu.account_management"),
      path: "/app/staffs",
      img: <FileDoneOutlined />,
      requireStaffAdmin: true,
    },
    {
      title: t("menu.job_management"),
      path: "/app/admin/jobs",
      img: <FileDoneOutlined />,
      requireAdmin: true,
    },
    {
      title: t("menu.job_apply_management"),
      path: "/app/admin/job-applies",
      img: <FileDoneOutlined />,
      requireAdmin: true,
    },
    {
      title: t("menu.candidate_list"),
      path: "/app/admin/candidates",
      img: <FileDoneOutlined />,
      requireAdmin: true,
    },
    {
      title: t("menu.candidate_connection_list"),
      path: "/app/admin/candidate-connections",
      img: <FileDoneOutlined />,
      requireAdmin: true,
    },
    {
      title: t("menu.company_list"),
      path: "/app/admin/companies",
      img: <FileDoneOutlined />,
      requireAdmin: true,
    },
  ].filter(
    (item) =>
      (!item.requireAdmin || isAdmin) &&
      (!item.requireStaffAdmin || isStaffAdmin)
  );

  const FOOTER = [
    {
      title: t("menu.settings"),
      path: "/app/settings",
      img: <SettingOutlined />,
    },
  ];

  const init = async () => {
    const initToken = getQuery("token");
    if (initToken) {
      localStorage.setItem("token", initToken);
      deleteQuery("token");
    }

    const share = getQuery("share");
    if (share === "1") {
      setMenuCollapse(true);
      deleteQuery("share");
    }

    // 校验 token
    const { code, data } = await Get("/api/settings");
    if (code === 0) {
      // 设置 i18n 语言
      const lang = data.lang ?? "en-US";
      i18n.changeLanguage(lang);

      // 根据语言设置 antd locale
      globalStore.setAntdLocale(lang as "zh-CN" | "en-US");

      setInited(true);

      if (data.company_status !== "approved") {
        navigate("/app/company/status");
      } else {
        // 获取职位
        fetchJobs();
        setIsAdmin(data.is_admin);
        setIsStaffAdmin(data.role === "admin");
        setMode(data.company_mode);
      }
    } else {
      navigate(`/signin?redirect=${getCurrentUrl()}`);
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
          <img
            src={logo}
            style={{ width: 220, margin: "21px 28px", cursor: "pointer" }}
            onClick={() => navigate("/")}
          />
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
          <div className={styles.header}>
            <Icon
              icon={<CollapseIcon />}
              className={styles.collapseIcon}
              onClick={() => setMenuCollapse(false)}
            />
          </div>
          <div className={styles.menuItemWrapper}>
            {MENU.map((item) => {
              const isActive = item.path && currentPath.startsWith(item.path);

              const menuNode: ReactNode = (
                <div className={styles.menuItemContainer} key={item.path}>
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
                    <Icon icon={item.img} style={{ fontSize: 20 }} />
                    {item.badge && (
                      <Badge
                        count={item.badge}
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          fontSize: "12px",
                        }}
                      />
                    )}
                  </div>
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
                            {child.badge && (
                              <Badge
                                count={child.badge}
                                style={{ marginLeft: 8 }}
                              />
                            )}
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
          <div>
            {FOOTER.map((item) => {
              const isActive = currentPath.startsWith(item.path);
              return (
                <div className={styles.menuItemContainer}>
                  <div
                    className={`${styles.menuItem} ${
                      isActive ? styles.active : ""
                    }`}
                    key={item.path}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon icon={item.img} style={{ fontSize: 20 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.menu}>
          <div className={styles.header}>
            <img src={logo} className={styles.logo} />
            <Icon
              icon={<CollapseIcon />}
              className={styles.collapseIcon}
              onClick={() => setMenuCollapse(true)}
            />
          </div>
          <div className={styles.menuItemWrapper}>
            {MENU.map((item) => {
              const isActive = item.path && currentPath.startsWith(item.path);
              return (
                <div className={styles.menuItemContainer} key={item.title}>
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
                    <Icon icon={item.img} style={{ fontSize: 20 }} />
                    <span style={{ marginLeft: 16 }}>{item.title}</span>
                    {item.badge && (
                      <Badge count={item.badge} style={{ marginLeft: 8 }} />
                    )}
                    {item.key === "jobs" && (
                      <div style={{ position: "absolute", right: 20 }}>
                        <SearchOutlined
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchKeyword("");
                            setShowSearch((current) => !current);
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {item.children && (
                    <div className={styles.subMenuContainer}>
                      {showSearch && (
                        <div style={{ marginBottom: 8 }}>
                          <Input
                            placeholder={t("app_layout.search_placeholder")}
                            onChange={(e) => {
                              setSearchKeyword(e.target.value);
                            }}
                            value={searchKeyword}
                            allowClear
                          />
                        </div>
                      )}
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
                            {child.badge && (
                              <Badge
                                count={child.badge}
                                style={{ marginLeft: 8 }}
                              />
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
          <div>
            {FOOTER.map((item) => {
              const isActive = currentPath.startsWith(item.path);
              return (
                <div className={styles.menuItemContainer}>
                  <div
                    className={`${styles.menuItem} ${
                      isActive ? styles.active : ""
                    }`}
                    key={item.path}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon icon={item.img} style={{ fontSize: 20 }} />
                    <span style={{ marginLeft: 16 }}>{item.title}</span>
                  </div>
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
