import {
  Card,
  Input,
  InputNumber,
  Segmented,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  CREDIT_CONFIG_SERVICE_KEYS,
  CREDIT_CONFIG_VALIDITY_MODES,
  CREDIT_CONFIG_VALIDITY_UNITS,
} from "../constants";
import type { ICreditConfigFields, ICreditConfigFieldValue, ICreditConfigValidity } from "../types";
import { formatValidityLabel } from "../utils";
import styles from "../style.module.less";

type ConfigEditFormProps = {
  isCustom: boolean;
  name: string;
  companyIds: number[];
  fields: ICreditConfigFields;
  defaultFields: ICreditConfigFields | null;
  companyOptions: { label: string; value: number }[];
  onNameChange: (value: string) => void;
  onCompanyIdsChange: (value: number[]) => void;
  onFieldsChange: (value: ICreditConfigFields) => void;
};

const ConfigEditForm = ({
  isCustom,
  name,
  companyIds,
  fields,
  defaultFields,
  companyOptions,
  onNameChange,
  onCompanyIdsChange,
  onFieldsChange,
}: ConfigEditFormProps) => {
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`admin_credit_configs.${key}`);

  const updateField = (patch: Partial<ICreditConfigFields>) => {
    onFieldsChange({ ...fields, ...patch });
  };

  const updateRateField = (
    key: "display_rate" | "topup_rate",
    patch: Partial<ICreditConfigFieldValue>,
  ) => {
    updateField({ [key]: { ...fields[key], ...patch } });
  };

  const updatePricingField = (serviceKey: string, patch: Partial<ICreditConfigFieldValue>) => {
    updateField({
      pricing: {
        ...fields.pricing,
        [serviceKey]: { ...fields.pricing[serviceKey as keyof typeof fields.pricing], ...patch },
      },
    });
  };

  const updateValidity = (patch: Partial<ICreditConfigValidity>) => {
    updateField({
      topup_credit_validity: { ...fields.topup_credit_validity, ...patch },
    });
  };

  const renderInheritControl = (
    inherit: boolean,
    onChange: (inherit: boolean) => void,
  ) =>
    isCustom ? (
      <Segmented
        size="small"
        value={inherit ? "inherit" : "override"}
        options={[
          { label: t("inherit"), value: "inherit" },
          { label: t("override"), value: "override" },
        ]}
        onChange={(value) => onChange(value === "inherit")}
      />
    ) : null;

  const renderRateEditor = (
    label: string,
    fieldKey: "display_rate" | "topup_rate",
  ) => {
    const field = fields[fieldKey];
    const defaultValue = defaultFields?.[fieldKey]?.value;
    const inherited = isCustom && field.inherit;

    return (
      <div className={styles.ioCard} key={fieldKey}>
        <div className={styles.ioHead}>
          <Typography.Text strong>{label}</Typography.Text>
          {renderInheritControl(field.inherit, (inherit) =>
            updateRateField(fieldKey, {
              inherit,
              value: inherit ? null : field.value ?? defaultValue ?? 100,
            }),
          )}
        </div>
        {inherited ? (
          <div className={styles.inheritedBox}>
            <span>{defaultValue ?? "—"}</span>
            <Tag className={styles.inheritTag}>{t("inherit")}</Tag>
          </div>
        ) : (
          <InputNumber
            min={1}
            precision={0}
            style={{ width: "100%" }}
            value={field.value ?? undefined}
            onChange={(value) => updateRateField(fieldKey, { value: value ?? null })}
          />
        )}
      </div>
    );
  };

  const validity = fields.topup_credit_validity;
  const resolvedDefaultValidity = defaultFields?.topup_credit_validity;

  const validityPresetOptions = useMemo(
    () =>
      CREDIT_CONFIG_VALIDITY_MODES.map((mode) => ({
        label: t(`validityMode.${mode}`),
        value: mode,
      })),
    [t],
  );

  return (
    <div className={styles.configSections}>
      <Card title={t("sections.metadata")} className={styles.configCard}>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label>{t("fields.name")}</label>
            {isCustom ? (
              <Input value={name} onChange={(e) => onNameChange(e.target.value)} />
            ) : (
              <Input value={name} disabled />
            )}
          </div>
          <div className={`${styles.formField} ${styles.typeField}`}>
            <label>{t("fields.type")}</label>
            <Tag>{isCustom ? t("customType") : t("defaultType")}</Tag>
          </div>
          <div className={styles.formField}>
            <label>{t("fields.currency")}</label>
            <Input value="SGD" disabled />
          </div>
          <div className={`${styles.formField} ${styles.fullWidth}`}>
            <label>{t("fields.appliedEmployers")}</label>
            {isCustom ? (
              <Select
                mode="multiple"
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
                placeholder={t("selectEmployers")}
                value={companyIds}
                options={companyOptions}
                onChange={onCompanyIdsChange}
              />
            ) : (
              <Typography.Text type="secondary">{t("defaultAppliedHint")}</Typography.Text>
            )}
          </div>
        </div>
      </Card>

      <Card title={t("sections.exchangeRates")} className={styles.configCard}>
        <div className={styles.formGrid}>{renderRateEditor(t("fields.displayRate"), "display_rate")}</div>
        <div className={styles.formGrid}>{renderRateEditor(t("fields.topupRate"), "topup_rate")}</div>
      </Card>

      <Card title={t("sections.topupDefaults")} className={styles.configCard}>
        <div className={styles.ioCard}>
          <div className={styles.ioHead}>
            <Typography.Text strong>{t("fields.topupValidity")}</Typography.Text>
            {renderInheritControl(validity.inherit, (inherit) =>
              updateValidity({
                inherit,
                mode: inherit ? undefined : resolvedDefaultValidity?.mode ?? "12_months",
                custom_value: inherit ? undefined : resolvedDefaultValidity?.custom_value,
                custom_unit: inherit ? undefined : resolvedDefaultValidity?.custom_unit,
              }),
            )}
          </div>
          {isCustom && validity.inherit ? (
            <div className={styles.inheritedBox}>
              <span>
                {resolvedDefaultValidity
                  ? formatValidityLabel(resolvedDefaultValidity, t)
                  : "—"}
              </span>
              <Tag className={styles.inheritTag}>{t("inherit")}</Tag>
            </div>
          ) : (
            <div className={styles.validityRow}>
              <Select
                className={styles.validityModeSelect}
                value={validity.mode}
                options={validityPresetOptions}
                onChange={(mode) =>
                  updateValidity({
                    mode,
                    custom_value: mode === "custom" ? validity.custom_value ?? 1 : undefined,
                    custom_unit: mode === "custom" ? validity.custom_unit ?? "months" : undefined,
                  })
                }
              />
              {validity.mode === "custom" ? (
                <>
                  <InputNumber
                    className={styles.validityCustomValue}
                    min={1}
                    precision={0}
                    value={validity.custom_value ?? undefined}
                    onChange={(value) => updateValidity({ custom_value: value ?? null })}
                  />
                  <Select
                    className={styles.validityCustomUnit}
                    value={validity.custom_unit ?? "months"}
                    options={CREDIT_CONFIG_VALIDITY_UNITS.map((unit) => ({
                      label: t(`validityUnit.${unit}`),
                      value: unit,
                    }))}
                    onChange={(custom_unit) => updateValidity({ custom_unit })}
                  />
                </>
              ) : null}
            </div>
          )}
        </div>
      </Card>

      <Card title={t("sections.pricing")} className={styles.configCard}>
        <Table
          pagination={false}
          rowKey="key"
          dataSource={CREDIT_CONFIG_SERVICE_KEYS.map((key) => ({
            key,
            label: t(`services.${key}`),
            field: fields.pricing[key],
            defaultValue: defaultFields?.pricing[key]?.value,
          }))}
          columns={[
            { title: t("fields.service"), dataIndex: "label" },
            {
              title: t("fields.mode"),
              dataIndex: "field",
              width: 220,
              render: (field, record) =>
                isCustom ? (
                  renderInheritControl(field.inherit, (inherit) =>
                    updatePricingField(record.key, {
                      inherit,
                      value: inherit ? null : field.value ?? record.defaultValue ?? 100,
                    }),
                  )
                ) : null,
            },
            {
              title: t("fields.credits"),
              dataIndex: "field",
              render: (field, record) =>
                isCustom && field.inherit ? (
                  <div className={styles.inheritedBox}>
                    <span>{record.defaultValue ?? "—"}</span>
                  </div>
                ) : (
                  <InputNumber
                    min={0}
                    precision={0}
                    value={field.value ?? undefined}
                    onChange={(value) =>
                      updatePricingField(record.key, {
                        value: value == null ? null : Math.max(0, Math.floor(value)),
                        inherit: false,
                      })
                    }
                  />
                ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ConfigEditForm;
