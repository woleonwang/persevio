import classNames from "classnames";
import styles from "./style.module.less";
import Icon from "../Icon";

interface ITabProps {
  tabs: {
    key: string;
    icon?: React.ReactNode;
    label: string;
  }[];
  activeKey: string;
  onChange: (key: string) => void;
}

const Tabs = (props: ITabProps) => {
  const { tabs, activeKey, onChange } = props;
  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <div
          key={tab.key}
          className={classNames(styles.tab, {
            [styles.active]: activeKey === tab.key,
          })}
          onClick={() => onChange(tab.key)}
        >
          <Icon icon={tab.icon} className={styles.tabIcon} />
          <span className={styles.tabLabel}>{tab.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Tabs;
