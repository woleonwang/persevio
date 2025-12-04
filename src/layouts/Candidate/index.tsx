import { Outlet, useLocation, useNavigate } from "react-router";
import { ProfileOutlined, SettingOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Spin } from "antd";
import { Get } from "../../utils/request";
import { useTranslation } from "react-i18next";
import styles from "./style.module.less";
import globalStore from "@/store/global";
import classnames from "classnames";
import logo from "@/assets/logo.png";
import { deleteQuery, getQuery } from "@/utils";
import Sidebar from "@/components/Sidebar";
import Jobs from "@/assets/icons/jobs";
import Referrals from "@/assets/icons/referrals";

const CandidateLayout = () => {
  const currentPath = useLocation().pathname;

  const navigate = useNavigate();

  const LayoutMapping = {
    blank: [/\/apply-job/, /\/whatsapp-redirect/],
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
    // {
    //   title: t("menu.home"),
    //   path: "/candidate/home",
    //   img: <ProfileOutlined />,
    // },
    // {
    //   title: t("menu.aspirations"),
    //   path: "/candidate/aspirations",
    //   img: <ProfileOutlined />,
    // },
    {
      title: t("menu.job_applies"),
      path: "/candidate/jobs",
      img: <Jobs />,
    },
    {
      title: t("menu.profile"),
      path: "/candidate/profile",
      img: <ProfileOutlined />,
    },
    {
      title: t("menu.referrals"),
      path: "/candidate/referrals",
      img: <Referrals />,
    },
    // {
    //   title: t("menu.connections"),
    //   path: "/candidate/connections",
    //   img: <ProfileOutlined />,
    // },
  ];

  const FOOTER = [
    {
      title: t("menu.settings"),
      path: "/candidate/settings",
      img: <SettingOutlined />,
    },
  ];

  const init = async () => {
    const initToken = getQuery("candidate_token");
    if (initToken) {
      localStorage.setItem("candidate_token", initToken);
      deleteQuery("candidate_token");
    }

    // 校验 token
    const { code, data } = await Get("/api/candidate/settings");
    if (code === 0) {
      setInited(true);
      i18n.changeLanguage(data.candidate.lang ?? "zh-CN");
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
      <Sidebar
        collapsed={menuCollapse || collapseForDrawer}
        setCollapsed={setMenuCollapse}
        menu={MENU}
        footer={FOOTER}
      />
      <div className={styles.main}>
        <Outlet />
      </div>
    </div>
  );
};

export default observer(CandidateLayout);
