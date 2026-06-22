import classnames from "classnames";
import logo from "@/assets/logo.png";
import Icon from "../Icon";
import styles from "./style.module.less";
import { useLocation, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { Badge, Dropdown, Input, Menu, Tooltip } from "antd";
import type { MenuProps } from "antd";
import { useTranslation } from "react-i18next";
import Delete from "@/assets/icons/delete";
import { observer } from "mobx-react-lite";
import Collapse from "@/assets/icons/collapse";
import Search from "@/assets/icons/search";
import StaffSwitch from "@/assets/icons/staff-switch";
import Settings from "@/assets/icons/settings";
import CreditsIcon from "@/assets/icons/credits";
import LogoutIcon from "@/assets/icons/logout";
import Switch from "@/assets/icons/switch";
import Down from "@/assets/icons/down";
import Right from "@/assets/icons/right";
import globalStore from "@/store/global";
import { tokenStorage } from "@/utils/storage";
import CompanyList from "@/assets/icons/company-list";
import { Get } from "@/utils/request";
import CandidateConnectionList from "@/assets/icons/candidate-connection-list";

interface ISidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  menu: TMenu[];
  footer?: TFooter[];
  showProfileMenu?: boolean;
  searchKeyword?: string;
  setSearchKeyword?: (searchKeyword: string) => void;
  onSwitch?: () => void;
  switchTooltip?: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

function formatCreditsAmount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

const Sidebar = (props: ISidebarProps) => {
  const {
    collapsed,
    menu,
    footer = [],
    showProfileMenu = false,
    searchKeyword,
    setCollapsed,
    setSearchKeyword,
    onSwitch,
    switchTooltip,
  } = props;

  const [showSearch, setShowSearch] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showJobs, setShowJobs] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [careerPageEnabled, setCareerPageEnabled] = useState<boolean | null>(
    null,
  );

  const currentPath = useLocation().pathname;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { staffRole, staffName, availableCredits, isAdmin } = globalStore;

  const jobsMenu = useMemo(
    () => menu.find((item) => item.key === "jobs"),
    [menu],
  );
  const primaryMenu = useMemo(
    () => menu.filter((item) => item.key !== "jobs"),
    [menu],
  );

  const isCollapsedView = collapsed && !hovered;

  useEffect(() => {
    const fetchCareerPageStatus = async () => {
      const { code, data } = await Get("/api/career_page");
      if (code === 0) {
        setCareerPageEnabled(data.enabled);
      }
    };

    fetchCareerPageStatus();
  }, [profileOpen]);

  const profileSelectedKeys = useMemo(() => {
    if (currentPath.startsWith("/app/company")) {
      return ["company-info"];
    }
    if (currentPath.startsWith("/app/career-page")) {
      return ["career-page"];
    }
    if (currentPath.startsWith("/app/settings")) {
      return ["settings"];
    }
    if (currentPath.startsWith("/app/credits")) {
      return ["credits"];
    }
    return [];
  }, [currentPath]);

  const profileMenuItems = useMemo(() => {
    const items: MenuProps["items"] = [
      {
        key: "company-info",
        icon: <Icon icon={<CompanyList />} />,
        label: t("menu.company"),
      },
      {
        key: "career-page",
        icon: <Icon icon={<CandidateConnectionList />} />,
        label: (
          <div className={styles.careerPageMenuLabel}>
            <span>{t("menu.career_page")}</span>
            {careerPageEnabled !== null ? (
              <span
                className={classnames(styles.careerPageStatusTag, {
                  [styles.careerPageStatusTagOn]: careerPageEnabled,
                  [styles.careerPageStatusTagOff]: !careerPageEnabled,
                })}
              >
                {careerPageEnabled
                  ? t("career_page.status_on")
                  : t("career_page.status_off")}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: "settings",
        icon: <Icon icon={<Settings />} />,
        label: t("menu.settings"),
      },
    ];

    if (staffRole === "admin" && isAdmin) {
      items.push(
        { type: "divider" },
        {
          key: "credits",
          className: styles.creditsMenuItem,
          icon: <Icon icon={<CreditsIcon />} />,
          label: (
            <div className={styles.creditsMenuLabel}>
              <span>{t("menu.credits")}</span>
              {availableCredits !== null ? (
                <>
                  <span className={styles.creditsMenuValue}>
                    {formatCreditsAmount(availableCredits)}
                  </span>
                  <Icon
                    icon={<Right />}
                    className={styles.creditsMenuChevron}
                  />
                </>
              ) : null}
            </div>
          ),
        },
        { type: "divider" },
      );
    }

    if (onSwitch) {
      items.push({
        key: "switch-accounts",
        icon: <Icon icon={<Switch />} />,
        label: switchTooltip ?? t("menu.switch_to_admin_mode"),
      });
    }

    items.push({
      key: "logout",
      icon: <Icon icon={<LogoutIcon />} />,
      label: t("settings.logout"),
    });

    return items;
  }, [
    availableCredits,
    careerPageEnabled,
    onSwitch,
    staffRole,
    switchTooltip,
    t,
  ]);

  const handleProfileMenuClick: MenuProps["onClick"] = ({ key }) => {
    setProfileOpen(false);
    if (key === "company-info") {
      navigate("/app/company");
      return;
    }
    if (key === "career-page") {
      navigate("/app/career-page");
      return;
    }
    if (key === "settings") {
      navigate("/app/settings");
      return;
    }
    if (key === "credits") {
      navigate("/app/credits");
      return;
    }
    if (key === "switch-accounts") {
      onSwitch?.();
      return;
    }
    if (key === "logout") {
      tokenStorage.removeToken("staff");
      tokenStorage.removeToken("admin");
      navigate("/signin");
    }
  };

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
            [styles.alwaysHighlighted]: item.alwaysHighlighted,
            [styles.active]: isActive,
          })}
          onClick={item.path ? () => navigate(item.path as string) : undefined}
        >
          {isCollapsedView && item.badge ? null : (
            <Icon icon={item.img} style={item.iconStyle} />
          )}
          {isCollapsedView ? null : (
            <span className={styles.menuItemLabel}>{item.title}</span>
          )}
          {item.badge && <Badge count={item.badge} className={styles.badge} />}
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
          [styles.active]: isActive,
        })}
      >
        <div
          className={styles.jobsHeader}
          onClick={() => {
            if (showJobs) {
              setShowJobs(false);
              setShowSearch(false);
            } else {
              setShowJobs(true);
            }
          }}
        >
          <span className={styles.jobsHeaderTitle}>{jobsMenu.title}</span>
          <div
            className={styles.jobsViewAllButton}
            onClick={(e) => {
              e.stopPropagation();
              navigate(jobsMenu.path as string);
            }}
          >
            {t("app_layout.view_all")}
          </div>
          <Icon
            icon={<Search />}
            className={styles.jobsSearchButton}
            onClick={(e) => {
              e.stopPropagation();
              setShowSearch((current) => !current);
              setShowJobs(true);
            }}
          />
        </div>
        {showSearch && (
          <Input
            placeholder={t("app_layout.search_placeholder")}
            onChange={(e) => {
              setSearchKeyword?.(e.target.value);
            }}
            value={searchKeyword}
            allowClear
            size="small"
            className={styles.jobsSearchInput}
          />
        )}
        {showJobs && (
          <div className={styles.jobsListWrap}>
            <div className={styles.jobsList}>
              {jobsMenu.children?.length
                ? renderSubMenuItems(jobsMenu.children)
                : null}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLegacyFooter = () => (
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
              <Icon icon={item.img} />
              {isCollapsedView ? null : (
                <span className={styles.menuItemLabel}>{item.title}</span>
              )}
            </div>
            {onSwitch && (
              <Tooltip title={switchTooltip}>
                <Icon
                  icon={<StaffSwitch />}
                  className={styles.footerSwitch}
                  onClick={onSwitch}
                />
              </Tooltip>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderProfileFooter = () => {
    const initials = getInitials(staffName || "U");
    const profileActive = profileOpen || profileSelectedKeys.length > 0;

    return (
      <div className={styles.profileFooter}>
        <Dropdown
          open={profileOpen}
          onOpenChange={setProfileOpen}
          trigger={["click"]}
          placement="topLeft"
          overlayClassName={styles.profileDropdown}
          dropdownRender={() => (
            <Menu
              className={styles.profileMenu}
              items={profileMenuItems}
              selectedKeys={profileSelectedKeys}
              onClick={handleProfileMenuClick}
            />
          )}
        >
          <button
            type="button"
            className={classnames(styles.profileTrigger, {
              [styles.profileTriggerActive]: profileActive,
            })}
            aria-expanded={profileOpen}
            aria-label={t("menu.profile")}
          >
            <span className={styles.profileAvatar}>{initials}</span>
            {isCollapsedView ? null : (
              <>
                <span className={styles.profileName}>{staffName}</span>
                <Icon icon={<Down />} className={styles.profileChevron} />
              </>
            )}
          </button>
        </Dropdown>
      </div>
    );
  };

  return (
    <div
      className={classnames(styles.menuWrapper, {
        [styles.collapsed]: isCollapsedView,
      })}
    >
      <div
        className={styles.mask}
        onClick={() => {
          setHovered(false);
        }}
      />
      <div
        className={classnames(styles.menu)}
        onMouseEnter={() => collapsed && setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
        }}
      >
        <div className={styles.header}>
          <img src={logo} className={styles.logo} alt="persevio" />
          <Icon
            icon={<Collapse />}
            className={classnames(styles.collapseIcon, styles.mobileVisible)}
            onTouchEnd={() => {
              setHovered((hovered) => !hovered);
            }}
          />
          <Tooltip
            title={
              collapsed
                ? t("app_layout.expand_sidebar")
                : t("app_layout.collapse_sidebar")
            }
          >
            <Icon
              icon={<Collapse />}
              className={classnames(
                styles.collapseIcon,
                styles.desktopVisible,
                {
                  [styles.pined]: !collapsed,
                },
              )}
              onClick={() => {
                setCollapsed(!collapsed);
              }}
            />
          </Tooltip>
        </div>
        <div className={styles.navSection}>
          {primaryMenu.map((item) => renderMenuItem(item))}
        </div>
        {renderJobsSection()}
        {showProfileMenu ? renderProfileFooter() : renderLegacyFooter()}
      </div>
    </div>
  );
};

export default observer(Sidebar);
