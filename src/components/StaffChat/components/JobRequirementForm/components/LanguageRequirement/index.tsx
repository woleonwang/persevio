import { Button, Select } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useRef, useState } from "react";
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
  const [languageSearchByRow, setLanguageSearchByRow] = useState<
    Record<string, string>
  >({});

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

  const getLanguageOptions = (rowKey: string, currentLanguage?: string) => {
    const search = (languageSearchByRow[rowKey] ?? "").trim();
    const options: { value: string; label: string }[] = PRESET_LANGUAGES.map(
      (language) => ({
        value: language,
        label: language,
      }),
    );

    const alreadyListed = (name: string) =>
      options.some(
        (item) => item.value.toLowerCase() === name.toLowerCase(),
      );

    if (search && !alreadyListed(search)) {
      options.unshift({
        value: search,
        label: t("language_add_custom", { name: search }),
      });
    }

    if (
      currentLanguage?.trim() &&
      !alreadyListed(currentLanguage.trim()) &&
      currentLanguage.trim().toLowerCase() !== search.toLowerCase()
    ) {
      options.unshift({
        value: currentLanguage.trim(),
        label: currentLanguage.trim(),
      });
    }

    return options;
  };

  return (
    <div>
      {rows.map((item) => (
        <div className={styles.row} key={item.key}>
          <Select
            className={styles.languageSelect}
            showSearch
            allowClear
            options={getLanguageOptions(item.key, item.language)}
            value={item.language}
            disabled={disabled}
            placeholder={t("language_placeholder")}
            filterOption={(inputValue, option) =>
              (option?.value ?? "")
                .toLowerCase()
                .includes(inputValue.toLowerCase()) ||
              String(option?.label ?? "")
                .toLowerCase()
                .includes(inputValue.toLowerCase())
            }
            onSearch={(search) =>
              setLanguageSearchByRow((prev) => ({
                ...prev,
                [item.key]: search,
              }))
            }
            onChange={(language) => {
              onRowChange(item.key, { language });
              setLanguageSearchByRow((prev) => ({
                ...prev,
                [item.key]: "",
              }));
            }}
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
