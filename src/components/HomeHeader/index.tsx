import styles from "./style.module.less";
import logo from "../../assets/logo.png";
import classnames from "classnames";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

interface IProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const menusConfigs = {
  home: "/",
  jobs: "/jobs",
};
const HomeHeader = (props: IProps) => {
  const { children, style } = props;
  const navigate = useNavigate();

  const isActive = (key: "home" | "jobs"): boolean => {
    const path = window.location.pathname;
    return menusConfigs[key] === path;
  };

  const { t } = useTranslation();
  const originalT = (key: string) => t(`home_header.${key}`);

  return (
    <div className={styles.container} style={style}>
      <div className={styles.header}>
        <img src={logo} style={{ width: 220 }} />
        <div className={styles.bannderMenuGroup}>
          <div
            className={classnames({ [styles.active]: isActive("home") })}
            onClick={() => navigate(menusConfigs["home"])}
          >
            {originalT("home")}
          </div>
          <div
            className={classnames({ [styles.active]: isActive("jobs") })}
            onClick={() => navigate(menusConfigs["jobs"])}
          >
            {originalT("jobs")}
          </div>
        </div>
        <div className={styles.joinBtn} onClick={() => navigate("/apply")}>
          <span>Join the waitlist</span>
          <span style={{ marginLeft: 17 }}>→</span>
        </div>
      </div>

      {children}
    </div>
  );
};

export default HomeHeader;
