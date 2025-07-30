import { InputNumber, Row, Col, Typography } from "antd";
import { useEffect, useState } from "react";

const { Text } = Typography;

interface IProps {
  value?: Record<string, number>;
  onChange?: (val: Record<string, number>) => void;
  options: string[];
}

const PercentageInput = (props: IProps) => {
  const { value = {}, onChange, options } = props;
  // 本地 state 用于显示和校验
  const [percentages, setPercentages] = useState<Record<string, number>>({});

  useEffect(() => {
    setPercentages(value ?? {});
  }, [value]);

  // 输入变化时
  const handleChange = (key: string, val: number | null) => {
    const newVal = Math.max(0, Math.min(100, val ?? 0));
    const newPercentages = { ...percentages, [key]: newVal };
    setPercentages(newPercentages);
    onChange?.(newPercentages);
  };

  return (
    <div>
      {options.map((option) => (
        <Row
          key={option}
          align="middle"
          style={{ marginBottom: 8, flexWrap: "nowrap" }}
        >
          <Col
            style={{ marginRight: 12, display: "flex", alignItems: "center" }}
          >
            <InputNumber
              min={0}
              max={100}
              value={percentages[option] ?? 0}
              onChange={(val) => handleChange(option, val)}
              formatter={(v) => `${v}`.replace(/[^0-9]/g, "")}
              parser={(v) => parseInt(v ?? "0", 10)}
              style={{ width: 80 }}
              step={1}
            />
            <span style={{ marginLeft: 4 }}>%</span>
          </Col>
          <Col>
            <Text>{option}</Text>
          </Col>
        </Row>
      ))}
    </div>
  );
};

export default PercentageInput;
