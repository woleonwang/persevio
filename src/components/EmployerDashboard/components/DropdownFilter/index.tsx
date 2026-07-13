import { Select } from "antd";
import styles from "./style.module.less";
import Icon from "@/components/Icon";
import Calendar from "@/assets/icons/calendar";

type TFilterDropdownProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  showCalendarIcon?: boolean;
};

function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  showCalendarIcon = false,
}: TFilterDropdownProps<T>) {
  return (
    <div className={styles.filterGroup}>
      <span>{label}</span>
      <div className={styles.filterSelectWrap}>
        <Select
          options={options}
          value={value}
          onChange={onChange}
          style={{ width: 170 }}
          suffixIcon={
            showCalendarIcon ? (
              <Icon icon={<Calendar />} style={{ fontSize: 20 }} />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}

export default FilterDropdown;
