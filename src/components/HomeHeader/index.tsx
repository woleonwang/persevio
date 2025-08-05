import styles from "./style.module.less";
import logo from "../../assets/logo.png";
import classnames from "classnames";
import { useNavigate } from "react-router";

interface IProps {
  children?: React.ReactNode;
}

const menusConfigs = {
  home: "/",
  jobs: "/jobs",
};
const HomeHeader = (props: IProps) => {
  const { children } = props;
  const navigate = useNavigate();

  const isActive = (key: "home" | "jobs"): boolean => {
    const path = window.location.pathname;
    return menusConfigs[key] === path;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src={logo} style={{ width: 220 }} />
        <div className={styles.bannderMenuGroup}>
          <div
            className={classnames({ [styles.active]: isActive("home") })}
            onClick={() => navigate(menusConfigs["home"])}
          >
            首页
          </div>
          <div
            className={classnames({ [styles.active]: isActive("jobs") })}
            onClick={() => navigate(menusConfigs["jobs"])}
          >
            职位
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
