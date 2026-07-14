import { Input } from "antd";
import { useTranslation } from "react-i18next";

import styles from "./style.module.less";

export type TVisaRequirementValue = {
  must?: string;
  preferred?: string;
};

export interface IProps {
  value?: TVisaRequirementValue;
  onChange?: (val: TVisaRequirementValue) => void;
  disabled?: boolean;
}

const VisaRequirement = (props: IProps) => {
  const { value = {}, onChange, disabled = false } = props;
  const { must, preferred } = value;

  const { t: originalT } = useTranslation();
  const t = (key: string): string => {
    return originalT(`job_requirement_form.${key}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <div className={styles.label}>{t("visa_must")}</div>
        <Input
          value={must}
          disabled={disabled}
          placeholder={t("visa_must_placeholder")}
          onChange={(e) =>
            onChange?.({
              must: e.target.value,
              preferred,
            })
          }
        />
      </div>
      <div className={styles.row}>
        <div className={styles.label}>{t("visa_preferred")}</div>
        <Input
          value={preferred}
          disabled={disabled}
          placeholder={t("visa_preferred_placeholder")}
          onChange={(e) =>
            onChange?.({
              must,
              preferred: e.target.value,
            })
          }
        />
      </div>
    </div>
  );
};

export default VisaRequirement;
