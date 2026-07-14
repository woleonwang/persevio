import { AutoComplete, Button, Select } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidV4 } from "uuid";

import styles from "./style.module.less";

export type TLanguageRequirementValue = {
  key: string;
  language?: string;
  proficiency?: string;
};

const PRESET_LANGUAGES = [
  "English",
  "Mandarin Chinese",
  "Malay",
  "Indonesian",
  "Thai",
  "Vietnamese",
  "Tagalog",
  "Cantonese",
  "Tamil",
  "Hindi",
  "Japanese",
  "Korean",
  "Arabic",
  "French",
  "German",
  "Spanish",
  "Portuguese",
  "Russian",
  "Italian",
];

const PROFICIENCY_LEVELS = ["5", "4", "3", "2", "1"] as const;

export interface IProps {
  value?: TLanguageRequirementValue[];
  onChange?: (val: TLanguageRequirementValue[]) => void;
  disabled?: boolean;
}

const LanguageRequirement = (props: IProps) => {
  const { value, onChange, disabled = false } = props;
  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>): string => {
    return originalT(`job_requirement_form.${key}`, params);
  };
  const defaultRowsRef = useRef<TLanguageRequirementValue[]>([
    { key: uuidV4() },
  ]);
  const rows = value && value.length > 0 ? value : defaultRowsRef.current;

  const onRowChange = (
    key: string,
    patch: Partial<TLanguageRequirementValue>,
  ) => {
    onChange?.(
      rows.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  };

  const deleteRow = (key: string) => {
    if (rows.length <= 1) return;
    onChange?.(rows.filter((item) => item.key !== key));
  };

  const languageOptions = PRESET_LANGUAGES.map((language) => ({
    value: language,
  }));

  return (
    <div>
      {rows.map((item) => (
        <div className={styles.row} key={item.key}>
          <AutoComplete
            className={styles.languageSelect}
            options={languageOptions}
            value={item.language}
            disabled={disabled}
            placeholder={t("language")}
            filterOption={(inputValue, option) =>
              (option?.value ?? "")
                .toLowerCase()
                .includes(inputValue.toLowerCase())
            }
            onChange={(language) => onRowChange(item.key, { language })}
            allowClear
          />
          <Select
            className={styles.proficiencySelect}
            value={item.proficiency}
            disabled={disabled}
            placeholder={t("proficiency")}
            options={PROFICIENCY_LEVELS.map((level) => {
              const text = t(`proficiency_level_${level}`);
              return {
                value: level,
                label: (
                  <>
                    <b>{text.split("**")[1]}</b>
                    {text.split("**")[2]}
                  </>
                ),
              };
            })}
            onChange={(proficiency) => onRowChange(item.key, { proficiency })}
            allowClear
          />
          {rows.length > 1 && (
            <Button
              className={styles.deleteBtn}
              icon={<DeleteOutlined />}
              disabled={disabled}
              onClick={() => deleteRow(item.key)}
            />
          )}
        </div>
      ))}
      <Button
        disabled={disabled}
        onClick={() => onChange?.([...rows, { key: uuidV4() }])}
      >
        {t("add", { name: t("language") })}
      </Button>
    </div>
  );
};

export default LanguageRequirement;
