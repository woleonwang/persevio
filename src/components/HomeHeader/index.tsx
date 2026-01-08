import styles from "./style.module.less";
import logo from "../../assets/logo.png";
import classnames from "classnames";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "antd";

interface IProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onlyLogo?: boolean;
  isPreview?: boolean;
  rightContent?: React.ReactNode;
}

const menusConfigs = {
  home: "/",
  jobs: "/jobs",
};
const HomeHeader = (props: IProps) => {
  const { children, style, className, onlyLogo, isPreview, rightContent } =
    props;
  const navigate = useNavigate();

  const isActive = (key: "home" | "jobs"): boolean => {
    const path = window.location.pathname;
    return menusConfigs[key] === path;
  };

  const { t } = useTranslation();
  const originalT = (key: string) => t(`home_header.${key}`);

  return (
    <div className={classnames(styles.container, className)} style={style}>
      {!isPreview && (
        <div className={styles.header}>
          <img src={logo} className={styles.logo} />
          {!onlyLogo && (
            <>
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
              {/* <Dropdown
                menu={{
                  items: [
                    {
                      key: "recruit",
                      label: originalT("recruit"),
                      onClick: () => navigate("/signin"),
                    },
                    {
                      key: "jobseeker",
                      label: originalT("jobseeker"),
                      onClick: () => navigate("/signin-candidate"),
                    },
                  ],
                }}
                placement="bottomRight"
                trigger={["hover"]}
              > */}
              <Button
                type="primary"
                className={styles.joinBtn}
                onClick={() => navigate("/signin")}
              >
                <span>{originalT("login_register")}</span>
                <span>→</span>
              </Button>
              {/* </Dropdown> */}
            </>
          )}
          {rightContent && (
            <div className={styles.rightContent}>{rightContent}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default HomeHeader;
