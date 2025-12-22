import { Outlet, useNavigate } from "react-router";

import { SettingOutlined } from "@ant-design/icons";
import styles from "./style.module.less";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Spin } from "antd";
import { Get } from "../../utils/request";
import { useTranslation } from "react-i18next";
import globalStore from "../../store/global";
import { deleteQuery, getQuery } from "@/utils";
import JobManagement from "@/assets/icons/job-management";
import JobApplyManagement from "@/assets/icons/job-apply-management";
import CompanyList from "@/assets/icons/company-list";
import Sidebar from "@/components/Sidebar";

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
  }, []);

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
    // {
    //   title: t("menu.candidate_list"),
    //   path: "/admin/candidates",
    //   img: <CandidateConnectionList />,
    //   requireAdmin: true,
    // },
    // {
    //   title: t("menu.candidate_connection_list"),
    //   path: "/admin/candidate-connections",
    //   img: <CandidateConnectionList />,
    //   requireAdmin: true,
    // },
    {
      title: t("menu.company_list"),
      path: "/admin/companies",
      img: <CompanyList />,
      requireSuperAdmin: true,
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
      localStorage.setItem("token", initToken);
      deleteQuery("token");
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
        setCollapsed={setMenuCollapse}
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
