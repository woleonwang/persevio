import { InputNumber, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./index.module.less";

const { Text } = Typography;

interface NumberRangeValue {
  min?: number;
  max?: number;
}

interface IProps {
  value?: NumberRangeValue;
  onChange?: (val: NumberRangeValue) => void;
  suffix?: string;
}

const NumberRange = (props: IProps) => {
  const { value = {}, onChange, suffix = "years" } = props;
  const { t } = useTranslation();

  // 本地 state 用于显示和校验
  const [rangeValue, setRangeValue] = useState<NumberRangeValue>({});

  useEffect(() => {
    setRangeValue(value ?? {});
  }, [value]);

  // 输入变化时
  const handleChange = (key: "min" | "max", val: number | null) => {
    const newValue = { ...rangeValue, [key]: val ?? undefined };

    // 验证范围逻辑：最小值不能大于最大值
    if (
      key === "min" &&
      newValue.max !== undefined &&
      val !== null &&
      val > newValue.max
    ) {
      return; // 不更新，保持原值
    }
    if (
      key === "max" &&
      newValue.min !== undefined &&
      val !== null &&
      val < newValue.min
    ) {
      return; // 不更新，保持原值
    }

    setRangeValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className={styles.numberRangeWrap}>
      <Space align="center">
        <InputNumber
          value={rangeValue.min}
          onChange={(val) => handleChange("min", val)}
          placeholder={t("numberRange.min")}
          style={{ width: 80 }}
          className={styles.numberRangeInput}
          min={0}
        />
        <span className={styles.numberRangeLabel}>-</span>
        <InputNumber
          value={rangeValue.max}
          onChange={(val) => handleChange("max", val)}
          placeholder={t("numberRange.max")}
          style={{ width: 80 }}
          className={styles.numberRangeInput}
          min={0}
        />
        <Text className={styles.numberRangeSuffix}>{suffix}</Text>
      </Space>
    </div>
  );
};

export default NumberRange;
