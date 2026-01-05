import { Outlet, useNavigate } from "react-router";

import classnames from "classnames";
import logo from "../../assets/logo.png";
import styles from "./style.module.less";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Spin } from "antd";
import { Get } from "../../utils/request";
import { useTranslation } from "react-i18next";
import { tokenStorage } from "../../utils/storage";

const ShareLayout = () => {
  const currentUrl = encodeURIComponent(location.pathname + location.search);

  const navigate = useNavigate();

  const [inited, setInited] = useState(false);

  const { i18n } = useTranslation();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (token) {
      tokenStorage.setToken(token, "staff");
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.pathname + url.search);

      // 校验 token
      const { code, data } = await Get("/api/settings");
      if (code === 0) {
        i18n.changeLanguage(data.lang ?? "en-US");
        setInited(true);
      } else {
        navigate(`/signin?redirect=${currentUrl}`);
      }
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
};

export default observer(ShareLayout);
