import classnames from "classnames";
import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";
import logo from "@/assets/logo.png";
import { SearchOutlined, UserSwitchOutlined } from "@ant-design/icons";
import Icon from "../Icon";
import styles from "./style.module.less";
import { useLocation, useNavigate } from "react-router";
import { ReactNode, useState } from "react";
import { Badge, Input, Popover, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import Delete from "@/assets/icons/delete";
import { observer } from "mobx-react-lite";

interface ISidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  menu: TMenu[];
  footer: TFooter[];
  searchKeyword?: string;
  setSearchKeyword?: (searchKeyword: string) => void;
  onSwitch?: () => void;
  switchTooltip?: string;
}
const Sidebar = (props: ISidebarProps) => {
  const {
    collapsed,
    menu,
    footer,
    searchKeyword,
    setCollapsed,
    setSearchKeyword,
    onSwitch,
    switchTooltip,
  } = props;

  const [showSearch, setShowSearch] = useState(false);
  const [hovered, setHovered] = useState(false);
  const currentPath = useLocation().pathname;
  const navigate = useNavigate();
  const { t } = useTranslation();

  return collapsed && !hovered ? (
    <div
      className={classnames(styles.menu, styles.collapse)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={styles.header}>
        <Icon
          icon={<PushpinOutlined />}
          className={classnames(styles.collapseIcon)}
          onClick={() => setCollapsed(!collapsed)}
        />
      </div>
      <div className={styles.menuItemWrapper}>
        {menu.map((item) => {
          const isActive = item.path && currentPath.startsWith(item.path);

          const menuNode: ReactNode = (
            <div className={styles.menuItemContainer} key={item.path}>
              <div
                className={`${styles.menuItem} ${
                  isActive ? styles.active : ""
                }`}
                onClick={
                  item.path ? () => navigate(item.path as string) : undefined
                }
              >
                <Icon icon={item.img} />
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
        {footer.map((item) => {
          const isActive = currentPath.startsWith(item.path);
          return (
            <div className={styles.menuItemContainer} key={item.path}>
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
    <div className={styles.menuWrapper} onMouseLeave={() => setHovered(false)}>
      <div className={styles.menu}>
        <div className={styles.header}>
          <img src={logo} className={styles.logo} />
          <Icon
            icon={!collapsed ? <PushpinFilled /> : <PushpinOutlined />}
            className={classnames(styles.collapseIcon, {
              [styles.pined]: !collapsed,
            })}
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>
        <div className={styles.menuItemWrapper}>
          {menu.map((item) => {
            const isActive = item.path && currentPath.startsWith(item.path);
            return (
              <div className={styles.menuItemContainer} key={item.title}>
                <div
                  className={`${styles.menuItem} ${
                    isActive ? styles.active : ""
                  }`}
                  onClick={
                    item.path ? () => navigate(item.path as string) : undefined
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
                          setSearchKeyword?.("");
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
                            setSearchKeyword?.(e.target.value);
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
                              <Icon icon={<Delete />} />
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
          {footer.map((item) => {
            const isActive = currentPath.startsWith(item.path);
            return (
              <div
                className={styles.menuItemContainer}
                key={item.path}
                style={{ position: "relative" }}
              >
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
                {onSwitch && (
                  <Tooltip title={switchTooltip}>
                    <div
                      style={{
                        position: "absolute",
                        right: 20,
                        top: 16,
                        cursor: "pointer",
                      }}
                    >
                      <UserSwitchOutlined
                        style={{ fontSize: 16 }}
                        onClick={onSwitch}
                      />
                    </div>
                  </Tooltip>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default observer(Sidebar);
