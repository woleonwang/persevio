import { InputNumber } from "antd";
import { useTranslation } from "react-i18next";

type TValue = {
  salary: number | null | undefined;
  months: number | null | undefined;
};
interface IProps {
  value?: TValue;
  onChange?: (value: TValue) => void;
}

const BaseSalaryInput = (props: IProps) => {
  const { value, onChange } = props ?? {};
  const { salary, months } = value ?? {};

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_requirement_form.${key}`);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <InputNumber
        value={salary}
        placeholder={t("salary")}
        onChange={(val) => onChange?.({ salary: val, months })}
        style={{ width: 200 }}
      />
      <span>*</span>
      <InputNumber
        value={months}
        placeholder={t("months")}
        onChange={(val) => onChange?.({ salary, months: val })}
        style={{ width: 150 }}
      />
      <div> = {salary && months ? salary * months : 0}</div>
    </div>
  );
};

export default BaseSalaryInput;
