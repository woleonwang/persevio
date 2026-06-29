import { Outlet, useNavigate } from "react-router";

import {
  BarChartOutlined,
  DollarOutlined,
  FileTextOutlined,
  FunnelPlotOutlined,
  SettingOutlined,
  TagsOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import styles from "./style.module.less";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Spin } from "antd";
import { Get } from "../../utils/request";
import { useTranslation } from "react-i18next";
import globalStore from "../../store/global";
import { deleteQuery, getQuery } from "@/utils";
import { storage, StorageKey, tokenStorage } from "../../utils/storage";
import { refreshStaffTokenIfExpiringSoon } from "@/utils/staffToken";
import JobManagement from "@/assets/icons/job-management";
import JobApplyManagement from "@/assets/icons/job-apply-management";
import CompanyList from "@/assets/icons/company-list";
import Sidebar from "@/components/Sidebar";
import CandidateConnectionList from "@/assets/icons/candidate-connection-list";

const AdminLayout = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const getCurrentUrl = () =>
    encodeURIComponent(location.pathname + location.search);

  const navigate = useNavigate();

  const [inited, setInited] = useState(false);

  const { t, i18n } = useTranslation();

  const { menuCollapse, setMenuCollapse } = globalStore;

  useEffect(() => {
    init();
    resetMenuCollapse();
    const handleResize = () => {
      resetMenuCollapse();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
      title: t("menu.job_management"),
      path: "/admin/jobs",
      img: <JobManagement />,
      requireAdmin: true,
    },
    // {
    //   title: t("menu.talent_management"),
    //   path: "/admin/talents",
    //   img: <Candidates />,
    //   requireAdmin: true,
    // },
    {
      title: t("menu.talent_management"),
      path: "/admin/talents",
      img: <JobApplyManagement />,
      requireAdmin: true,
    },
    {
      title: t("menu.candidate_list"),
      path: "/admin/candidates",
      img: <CandidateConnectionList />,
      requireAdmin: true,
    },
    // {
    //   title: t("menu.candidate_connection_list"),
    //   path: "/admin/candidate-connections",
    //   img: <CandidateConnectionList />,
    //   requireAdmin: true,
    // },
    {
      title: t("menu.daily_breakdown"),
      path: "/admin/job-daily-stats",
      img: <BarChartOutlined />,
      requireAdmin: true,
    },
    {
      title: "Signup Funnel",
      path: "/admin/candidate-signup-funnel",
      img: <FunnelPlotOutlined />,
      requireAdmin: true,
    },
    {
      title: "Talent Tags",
      path: "/admin/talent-tags",
      img: <TagsOutlined />,
      requireAdmin: true,
    },
    {
      title: t("menu.tools"),
      path: "/admin/tools",
      img: <ToolOutlined />,
      requireAdmin: true,
    },
    {
      title: t("menu.kb_observation"),
      path: "/admin/kb-observations",
      img: <FileTextOutlined />,
      requireAdmin: true,
    },
    {
      title: t("menu.kb_entity_document"),
      path: "/admin/kb-entity-documents",
      img: <FileTextOutlined />,
      requireAdmin: true,
    },
    {
      title: t("menu.company_list"),
      path: "/admin/companies",
      img: <CompanyList />,
      requireSuperAdmin: true,
    },
    {
      title: t("menu.credit_config"),
      path: "/admin/credit-configs",
      img: <DollarOutlined />,
      requireAdmin: true,
    },
    {
      title: t("menu.credit_package"),
      path: "/admin/credit-packages",
      img: <DollarOutlined />,
      requireAdmin: true,
    },
  ].filter((item) => !item.requireSuperAdmin || isSuperAdmin);

  const FOOTER = [
    {
      title: t("menu.settings"),
      path: "/admin/settings",
      img: <SettingOutlined />,
    },
  ];

  const init = async () => {
    const initToken = getQuery("token");
    if (initToken) {
      tokenStorage.setToken(initToken, "staff");
      deleteQuery("token");
    }

    await refreshStaffTokenIfExpiringSoon();

    // 校验 token
    const { code, data } = await Get("/api/settings");
    if (code === 0) {
      // 设置 i18n 语言
      const lang = data.lang ?? "en-US";
      i18n.changeLanguage(lang);
      // 根据语言设置 antd locale
      globalStore.setAntdLocale(lang as "zh-CN" | "en-US");
      setInited(true);
      setIsSuperAdmin(data.is_admin === 1);
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

  return (
    <div className={styles.container}>
      <Sidebar
        collapsed={menuCollapse}
        setCollapsed={setAndCacheMenuCollapse}
        menu={MENU}
        footer={FOOTER}
        onSwitch={() => navigate("/app/jobs")}
        switchTooltip={t("menu.switch_to_employer_mode")}
      />
      <div className={styles.main}>
        <Outlet />
      </div>
    </div>
  );
};

export default observer(AdminLayout);
