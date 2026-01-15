import { Outlet, useLocation, useNavigate } from "react-router";

import { FileDoneOutlined } from "@ant-design/icons";
import classnames from "classnames";
import logo from "../../assets/logo.png";
import styles from "./style.module.less";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { message, Modal, Spin } from "antd";
import { Get, Post } from "../../utils/request";
import { useTranslation } from "react-i18next";
import globalStore from "../../store/global";
import { deleteQuery, getQuery } from "@/utils";
import { tokenStorage } from "../../utils/storage";
import NewChat from "@/assets/icons/new-chat";
import Jobs from "@/assets/icons/jobs";
import CompanyInfo from "@/assets/icons/company-info";
import Candidates from "@/assets/icons/candidates";
import Sidebar from "@/components/Sidebar";
import Settings from "@/assets/icons/settings";

const AppLayout = () => {
  const currentPath = useLocation().pathname;
  const [searchKeyword, setSearchKeyword] = useState("");

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

  const {
    menuCollapse,
    collapseForDrawer,
    staffRole,
    isAdmin,
    setMenuCollapse,
    setStaffRole,
    setIsAdmin,
    setAntdLocale,
  } = globalStore;

  useEffect(() => {
    init();
    if (window.innerWidth < 768) {
      setMenuCollapse(true);
    }
  }, []);

  useEffect(() => {
    // 获取未读候选人数量
    fetchUnreadTalentsCount();
  }, []);

  const MENU: TMenu[] = [
    {
      title: t("menu.newRole"),
      path: "/app/entry/create-job",
      img: <NewChat />,
    },
    {
      title: t("menu.jobs"),
      key: "jobs",
      path: "/app/jobs",
      img: <Jobs />,
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
      img: <CompanyInfo />,
      requireStaffAdmin: true,
    },

    {
      title: t("menu.talents"),
      path: "/app/talents",
      img: <Candidates />,
      badge: unreadTalentsCount > 0 ? unreadTalentsCount : undefined,
    },
    {
      title: t("menu.account_management"),
      path: "/app/staffs",
      img: <FileDoneOutlined />,
      requireStaffAdmin: true,
    },
  ].filter((item) => !item.requireStaffAdmin || staffRole === "admin");

  const FOOTER = [
    {
      title: t("menu.settings"),
      path: "/app/settings",
      img: <Settings />,
    },
  ];

  const init = async () => {
    const initToken = getQuery("token");
    if (initToken) {
      tokenStorage.setToken(initToken, "staff");
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
      const lang = data.lang || "en-US";
      i18n.changeLanguage(lang);

      // 根据语言设置 antd locale
      setAntdLocale(lang as "zh-CN" | "en-US");

      setInited(true);

      if (data.company_status !== "approved") {
        navigate("/signup");
      } else {
        // 获取职位
        fetchJobs();
        setStaffRole(data.role);
        setIsAdmin(data.is_admin === 1);
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
      <Sidebar
        collapsed={menuCollapse || collapseForDrawer}
        setCollapsed={setMenuCollapse}
        menu={MENU}
        footer={FOOTER}
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        onSwitch={isAdmin ? () => navigate("/admin/jobs") : undefined}
        switchTooltip={t("menu.switch_to_admin_mode")}
      />
      <div className={styles.main}>
        <Outlet />
      </div>
    </div>
  );
};

export default observer(AppLayout);
