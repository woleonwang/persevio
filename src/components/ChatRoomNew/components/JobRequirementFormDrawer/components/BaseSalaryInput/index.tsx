import { InputNumber } from "antd";
import { useTranslation } from "react-i18next";

export type TSalaryValue = {
  salaryMin: number | null | undefined;
  salaryMax: number | null | undefined;
  months: number | null | undefined;
};
interface IProps {
  value?: TSalaryValue;
  onChange?: (value: TSalaryValue) => void;
}

const BaseSalaryInput = (props: IProps) => {
  const { value, onChange } = props ?? {};
  const { salaryMin, salaryMax, months } = value ?? {};

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_requirement_form.${key}`);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <InputNumber
        value={salaryMin}
        placeholder={t("salary")}
        onChange={(val) => onChange?.({ salaryMin: val, salaryMax, months })}
        style={{ width: 150 }}
      />
      ~
      <InputNumber
        value={salaryMax}
        placeholder={t("salary")}
        onChange={(val) => onChange?.({ salaryMin, salaryMax: val, months })}
        style={{ width: 150 }}
      />
      <span>*</span>
      <InputNumber
        value={months}
        placeholder={t("months")}
        onChange={(val) => onChange?.({ salaryMin, salaryMax, months: val })}
        style={{ width: 150 }}
      />
      <div>
        {" "}
        ={" "}
        {salaryMin && salaryMax && months
          ? `${(salaryMin * months).toLocaleString()} / ${t("year")} ~ ${(
              salaryMax * months
            ).toLocaleString()} / ${t("year")}`
          : 0}
      </div>
    </div>
  );
};

export default BaseSalaryInput;
