import classnames from "classnames";
import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";
import logo from "@/assets/logo.png";
import { SearchOutlined, UserSwitchOutlined } from "@ant-design/icons";
import Icon from "../Icon";
import styles from "./style.module.less";
import { useLocation, useNavigate } from "react-router";
import { useMemo, useState } from "react";
import { Badge, Input, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import Delete from "@/assets/icons/delete";
import { observer } from "mobx-react-lite";
import Collapse from "@/assets/icons/collapse";

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

const NAV_ICON_SIZE = 20;

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

  const jobsMenu = useMemo(
    () => menu.find((item) => item.key === "jobs"),
    [menu],
  );
  const primaryMenu = useMemo(
    () => menu.filter((item) => item.key !== "jobs"),
    [menu],
  );

  const isCollapsedView = collapsed && !hovered;

  const renderSubMenuItems = (children: NonNullable<TMenu["children"]>) =>
    children.map((child) => (
      <div
        className={classnames(styles.subMenuItem, {
          [styles.active]: child.active,
          [styles.hasStatus]: child.unpublished,
          [styles.hasChange]: child.badge,
        })}
        key={child.path}
        onClick={() => navigate(child.path)}
      >
        <div className={styles.subMenuTitle}>{child.title}</div>
        {child.badge && (
          <span className={styles.jobChangeDot} aria-hidden="true" />
        )}
        {child.unpublished && (
          <span className={styles.jobStatusBadge}>
            {t("job_list.post_status.unpublished")}
          </span>
        )}
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
      </div>
    ));

  const renderMenuItem = (item: TMenu) => {
    const isActive = item.path && currentPath.startsWith(item.path);

    return (
      <div className={styles.menuItemContainer} key={item.title}>
        <div
          className={classnames(styles.menuItem, {
            [styles.active]: isActive,
          })}
          onClick={item.path ? () => navigate(item.path as string) : undefined}
        >
          <Icon icon={item.img} style={{ fontSize: NAV_ICON_SIZE }} />
          {isCollapsedView ? null : (
            <span className={styles.menuItemLabel}>{item.title}</span>
          )}
          {item.badge && <Badge count={item.badge} style={{ marginLeft: 8 }} />}
        </div>
      </div>
    );
  };

  const renderJobsSection = () => {
    if (!jobsMenu) return null;

    const isActive = jobsMenu.path && currentPath.startsWith(jobsMenu.path);

    return (
      <div
        className={classnames(styles.jobsSection, {
          [styles.focused]: isActive,
        })}
      >
        <div
          className={styles.jobsHeader}
          onClick={() => jobsMenu.path && navigate(jobsMenu.path)}
        >
          <span className={styles.jobsHeaderTitle}>{jobsMenu.title}</span>
          <SearchOutlined
            className={styles.jobsSearchButton}
            onClick={(e) => {
              e.stopPropagation();
              setSearchKeyword?.("");
              setShowSearch((current) => !current);
            }}
          />
        </div>
        {showSearch && (
          <div className={styles.jobsSearchInput}>
            <Input
              placeholder={t("app_layout.search_placeholder")}
              onChange={(e) => {
                setSearchKeyword?.(e.target.value);
              }}
              value={searchKeyword}
              allowClear
              size="small"
              style={{ height: 36 }}
            />
          </div>
        )}
        <div className={styles.jobsListWrap}>
          <div className={styles.jobsList}>
            {jobsMenu.children?.length
              ? renderSubMenuItems(jobsMenu.children)
              : null}
          </div>
        </div>
      </div>
    );
  };

  const renderFooter = () => (
    <div className={styles.footerSection}>
      {footer.map((item) => {
        const isActive = currentPath.startsWith(item.path);
        return (
          <div className={styles.footerItemContainer} key={item.path}>
            <div
              className={classnames(styles.menuItem, {
                [styles.active]: isActive,
              })}
              onClick={() => navigate(item.path)}
            >
              <Icon icon={item.img} style={{ fontSize: NAV_ICON_SIZE }} />
              {isCollapsedView ? null : (
                <span className={styles.menuItemLabel}>{item.title}</span>
              )}
            </div>
            {onSwitch && (
              <Tooltip title={switchTooltip}>
                <div className={styles.footerSwitch} onClick={onSwitch}>
                  <UserSwitchOutlined />
                </div>
              </Tooltip>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      className={classnames(styles.menuWrapper, {
        [styles.collapsed]: isCollapsedView,
      })}
      onMouseEnter={() => collapsed && setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
      }}
    >
      <div
        className={styles.mask}
        onClick={() => {
          setHovered(false);
        }}
      />
      <div className={classnames(styles.menu)}>
        <div className={styles.header}>
          <img src={logo} className={styles.logo} alt="persevio" />
          <Icon
            icon={<Collapse />}
            style={{ fontSize: 16, color: "#c1c1c1" }}
            className={classnames(styles.collapseIcon, styles.mobileVisible)}
            onTouchEnd={() => {
              setHovered((hovered) => !hovered);
            }}
          />
          <Icon
            icon={!collapsed ? <PushpinFilled /> : <PushpinOutlined />}
            className={classnames(styles.collapseIcon, styles.desktopVisible, {
              [styles.pined]: !collapsed,
            })}
            onClick={() => {
              setCollapsed(!collapsed);
            }}
          />
        </div>
        <div className={styles.navSection}>
          {primaryMenu.map((item) => renderMenuItem(item))}
        </div>
        {renderJobsSection()}
        {renderFooter()}
      </div>
    </div>
  );
};

export default observer(Sidebar);
