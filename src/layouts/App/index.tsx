import { Outlet, useLocation, useNavigate } from "react-router";

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
import { storage, StorageKey, tokenStorage } from "../../utils/storage";
import { refreshStaffTokenIfExpiringSoon } from "@/utils/staffToken";
import NewChat from "@/assets/icons/new-chat";
import Jobs from "@/assets/icons/jobs";
import Candidates from "@/assets/icons/candidates";
import Sidebar from "@/components/Sidebar";
import OrgChat from "@/assets/icons/org-chat";
import Dashboard from "@/assets/icons/dashboard";

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
    menuCollapse,
    collapseForDrawer,
    staffRole,
    isAdmin,
    unreadTalentsJobIds,
    setMenuCollapse,
    setStaffRole,
    setIsAdmin,
    setOrgNodeId,
    setEmail,
    setStaffName,
    setCompanyName,
    setAvailableCredits,
    setAntdLocale,
    fetchJobs,
    fetchUnreadTalentsCount,
    setMode,
    setUseNewTalentDetailsPage,
    setVisibleOrgNodeIds,
  } = globalStore;

  useEffect(() => {
    init();
    resetMenuCollapse();

    const handleResize = () => {
      resetMenuCollapse();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // 获取未读候选人数量
    fetchUnreadTalentsCount();
  }, []);

  const resetMenuCollapse = () => {
    const menuCollapse = String(storage.get(StorageKey.MENU_COLLAPSE));
    if (window.innerWidth <= 1280) {
      setMenuCollapse(true);
    } else {
      setMenuCollapse(menuCollapse === "1");
    }
  };

  const setAndCacheMenuCollapse = (collapse: boolean) => {
    setMenuCollapse(collapse);
    storage.set(StorageKey.MENU_COLLAPSE, collapse ? "1" : "0");
  };

  const MENU: TMenu[] = [
    {
      title: t("menu.newRole"),
      path: "/app/entry/create-job",
      img: <NewChat />,
      alwaysHighlighted: true,
      iconStyle: {
        top: "-1px",
      },
    },
    {
      title: t("menu.dashboard"),
      path: "/app/dashboard",
      img: <Dashboard />,
    },
    {
      title: t("menu.jobs"),
      key: "jobs",
      path: "/app/jobs",
      img: <Jobs />,
      children: jobs
        .filter(
          (job) =>
            !searchKeyword ||
            job.name.toLowerCase().includes(searchKeyword.toLowerCase()),
        )
        .map((job) => {
          const jobSeg = job.invitation_token;
          const path =
            mode === "standard"
              ? `/app/jobs/${jobSeg}/standard-board`
              : `/app/jobs/${jobSeg}/board`;
          const isActive = currentPath.startsWith(path);
          return {
            title: job.name,
            path,
            active: isActive,
            badge: unreadTalentsJobIds.includes(job.id),
            unpublished: !job.initial_posted_at,
            onRemove: () => {
              Modal.confirm({
                title: t("app_layout.delete_job"),
                content: t("app_layout.delete_job_confirm", {
                  jobName: job.name,
                }),
                onOk: async () => {
                  const { code } = await Post(`/api/jobs/${jobSeg}/destroy`);
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
      title: t("menu.talents"),
      path: "/app/talents",
      img: <Candidates />,
      badge: unreadTalentsCount > 0 ? unreadTalentsCount : undefined,
    },
    {
      title: t("menu.member_team"),
      path: "/app/member-team",
      img: <OrgChat />,
      requireStaffAdmin: true,
    },
  ].filter((item) => !item.requireStaffAdmin || staffRole === "admin");

  const init = async () => {
    const initToken = getQuery("token");
    if (initToken) {
      tokenStorage.setToken(initToken, "staff");
      deleteQuery("token");
    }

    await refreshStaffTokenIfExpiringSoon();

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

      setUseNewTalentDetailsPage(data.use_new_talent_details_page === true);

      setInited(true);

      if (data.company_status !== "approved") {
        navigate("/signup");
      } else {
        if (data.onboarding_status !== "done") {
          navigate("/onboard", { replace: true });
          return;
        }
        // 获取职位
        fetchJobs();
        setStaffRole(data.role);
        setIsAdmin(data.is_admin === 1 || data.is_admin === 2);
        setEmail(data.email);
        setStaffName(data.staff_name);
        setCompanyName(data.company_name);
        setAvailableCredits(
          typeof data.available_credits === "number"
            ? data.available_credits
            : null,
        );
        setOrgNodeId(data.org_node_id);
        setMode(data.company_mode);
        setVisibleOrgNodeIds(data.visible_org_node_ids ?? []);
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
        setCollapsed={setAndCacheMenuCollapse}
        menu={MENU}
        showProfileMenu
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
