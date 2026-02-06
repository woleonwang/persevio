import classnames from "classnames";
import styles from "./style.module.less";
import Icon from "../Icon";

interface ITabProps {
  tabs: {
    key: string;
    icon?: React.ReactNode;
    label?: string;
    node?: React.ReactNode;
  }[];
  activeKey: string;
  onChange: (key: string) => void;
  size?: "large" | "small";
}

const Tabs = (props: ITabProps) => {
  const { tabs, activeKey, size = "large", onChange } = props;
  return (
    <div className={classnames(styles.tabs, styles[size])}>
      {tabs.map((tab) => (
        <div
          key={tab.key}
          className={classnames(styles.tab, {
            [styles.active]: activeKey === tab.key,
          })}
          onClick={() => onChange(tab.key)}
        >
          <Icon icon={tab.icon} className={styles.tabIcon} />
          {tab.label ? (
            <span className={styles.tabLabel}>{tab.label}</span>
          ) : (
            tab.node
          )}
        </div>
      ))}
    </div>
  );
};

export default Tabs;
