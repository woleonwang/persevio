import {
  CREDIT_CONFIG_SERVICE_KEYS,
  CREDIT_CONFIG_VALIDITY_MODES,
  CREDIT_CONFIG_VALIDITY_UNITS,
} from "./constants";
import type {
  ICreditConfig,
  ICreditConfigAuditLog,
  ICreditConfigFieldValue,
  ICreditConfigFields,
  ICreditConfigUpdateAuditExtraInfo,
  ICreditConfigValidity,
} from "./types";

export function parseCreditConfigFields(raw: string): ICreditConfigFields {
  const parsed = JSON.parse(raw) as ICreditConfigFields;
  const pricing = {} as ICreditConfigFields["pricing"];
  for (const key of CREDIT_CONFIG_SERVICE_KEYS) {
    pricing[key] = parsed.pricing?.[key] ?? { inherit: true, value: null };
  }
  return {
    display_rate: parsed.display_rate ?? { inherit: true, value: null },
    topup_rate: parsed.topup_rate ?? { inherit: true, value: null },
    topup_credit_validity: parsed.topup_credit_validity ?? { inherit: true },
    pricing,
  };
}

export function stringifyCreditConfigFields(fields: ICreditConfigFields): string {
  return JSON.stringify(fields);
}

export function buildNewCustomFields(): ICreditConfigFields {
  const pricing = Object.fromEntries(
    CREDIT_CONFIG_SERVICE_KEYS.map((key) => [key, { inherit: true, value: null }]),
  ) as ICreditConfigFields["pricing"];
  return {
    display_rate: { inherit: true, value: null },
    topup_rate: { inherit: true, value: null },
    topup_credit_validity: { inherit: true },
    pricing,
  };
}

function resolveFieldValue(
  field: ICreditConfigFieldValue,
  defaultField: ICreditConfigFieldValue,
): ICreditConfigFieldValue {
  if (field.inherit) {
    return { inherit: false, value: defaultField.value };
  }
  return field;
}

function resolveValidity(
  field: ICreditConfigValidity,
  defaultField: ICreditConfigValidity,
): ICreditConfigValidity {
  if (field.inherit) {
    return {
      inherit: false,
      mode: defaultField.mode,
      custom_value: defaultField.custom_value,
      custom_unit: defaultField.custom_unit,
    };
  }
  return field;
}

export function resolveCreditConfigFields(
  fields: ICreditConfigFields,
  defaultFields: ICreditConfigFields,
): ICreditConfigFields {
  const pricing = {} as ICreditConfigFields["pricing"];
  for (const key of CREDIT_CONFIG_SERVICE_KEYS) {
    pricing[key] = resolveFieldValue(fields.pricing[key], defaultFields.pricing[key]);
  }
  return {
    display_rate: resolveFieldValue(fields.display_rate, defaultFields.display_rate),
    topup_rate: resolveFieldValue(fields.topup_rate, defaultFields.topup_rate),
    topup_credit_validity: resolveValidity(
      fields.topup_credit_validity,
      defaultFields.topup_credit_validity,
    ),
    pricing,
  };
}

export function getDefaultFields(configs: ICreditConfig[]): ICreditConfigFields | null {
  const defaultConfig = configs.find((item) => item.type === "default");
  if (!defaultConfig) {
    return null;
  }
  return parseCreditConfigFields(defaultConfig.fields_json);
}

export function getResolvedFields(
  config: ICreditConfig,
  defaultFields: ICreditConfigFields | null,
): ICreditConfigFields {
  const fields = parseCreditConfigFields(config.fields_json);
  if (config.type === "default" || !defaultFields) {
    return fields;
  }
  return resolveCreditConfigFields(fields, defaultFields);
}

export function formatValidityLabel(
  validity: ICreditConfigValidity,
  t: (key: string) => string,
): string {
  if (validity.inherit) {
    return t("inherit");
  }
  if (!validity.mode) {
    return "—";
  }
  if (validity.mode === "custom") {
    return `${validity.custom_value ?? ""} ${t(`validityUnit.${validity.custom_unit ?? "months"}`)}`;
  }
  return t(`validityMode.${validity.mode}`);
}

export function isNameTaken(name: string, configs: ICreditConfig[], excludeId?: number) {
  const normalized = name.trim().toLowerCase();
  return configs.some(
    (item) =>
      item.name.trim().toLowerCase() === normalized && (!excludeId || item.id !== excludeId),
  );
}

function formatRateFieldForHistory(
  field: ICreditConfigFieldValue | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!field || field.inherit) {
    return t("inherit");
  }
  if (field.value == null) {
    return "—";
  }
  return String(field.value);
}

function formatValidityForHistory(
  validity: ICreditConfigValidity | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!validity || validity.inherit) {
    return t("inherit");
  }
  return formatValidityLabel(validity, (key) => t(key));
}

function diffCreditConfigFields(
  before: ICreditConfigFields | undefined,
  after: ICreditConfigFields | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string[] {
  const changes: string[] = [];

  const pushChange = (label: string, beforeValue: string, afterValue: string) => {
    if (beforeValue !== afterValue) {
      changes.push(t("history.fieldChanged", { label, before: beforeValue, after: afterValue }));
    }
  };

  pushChange(
    t("fields.displayRate"),
    formatRateFieldForHistory(before?.display_rate, t),
    formatRateFieldForHistory(after?.display_rate, t),
  );
  pushChange(
    t("fields.topupRate"),
    formatRateFieldForHistory(before?.topup_rate, t),
    formatRateFieldForHistory(after?.topup_rate, t),
  );
  pushChange(
    t("fields.topupValidity"),
    formatValidityForHistory(before?.topup_credit_validity, t),
    formatValidityForHistory(after?.topup_credit_validity, t),
  );

  for (const key of CREDIT_CONFIG_SERVICE_KEYS) {
    pushChange(
      t(`services.${key}`),
      formatRateFieldForHistory(before?.pricing?.[key], t),
      formatRateFieldForHistory(after?.pricing?.[key], t),
    );
  }

  return changes;
}

export function buildHistoryChangeItems(
  log: ICreditConfigAuditLog,
  t: (key: string, options?: Record<string, unknown>) => string,
): string[] {
  if (log.log_type === "create") {
    return [t("history.created")];
  }
  if (log.log_type === "delete") {
    return [t("history.deleted")];
  }
  if (log.log_type === "duplicate") {
    try {
      const extra = JSON.parse(log.extra_info) as { from?: number };
      return [t("history.duplicatedFrom", { id: extra.from ?? "—" })];
    } catch {
      return [t("history.duplicated")];
    }
  }

  try {
    const extra = JSON.parse(log.extra_info) as ICreditConfigUpdateAuditExtraInfo;
    const changes: string[] = [];
    if (extra.before?.name !== extra.after?.name) {
      changes.push(
        t("history.nameChanged", {
          before: extra.before?.name ?? "—",
          after: extra.after?.name ?? "—",
        }),
      );
    }
    changes.push(
      ...diffCreditConfigFields(extra.before?.fields_json, extra.after?.fields_json, t),
    );
    extra.employer_changes?.forEach((item) => {
      if (item.type === "add") {
        changes.push(t("history.addedEmployer", { name: item.company_name }));
      } else if (item.type === "remove") {
        changes.push(t("history.removedEmployer", { name: item.company_name }));
      } else {
        changes.push(
          t("history.movedEmployer", {
            name: item.company_name,
            from: item.from_config_name ?? item.from_config_id ?? "—",
          }),
        );
      }
    });
    return changes.length > 0 ? changes : [t("history.updated")];
  } catch {
    return [t("history.updated")];
  }
}

export function validateCreditConfigFields(fields: ICreditConfigFields, isCustom: boolean): string | null {
  const checkRate = (field: ICreditConfigFieldValue, label: string) => {
    if (isCustom && field.inherit) {
      return null;
    }
    if (field.value == null || field.value <= 0 || !Number.isInteger(field.value)) {
      return `${label} must be a positive integer`;
    }
    return null;
  };

  const checkPricing = (field: ICreditConfigFieldValue, label: string) => {
    if (isCustom && field.inherit) {
      return null;
    }
    if (field.value == null || field.value < 0 || !Number.isInteger(field.value)) {
      return `${label} must be 0 or a positive integer`;
    }
    return null;
  };

  const displayRateError = checkRate(fields.display_rate, "Display Rate");
  if (displayRateError) {
    return displayRateError;
  }
  const topupRateError = checkRate(fields.topup_rate, "Topup Rate");
  if (topupRateError) {
    return topupRateError;
  }

  const validity = fields.topup_credit_validity;
  if (!isCustom || !validity.inherit) {
    if (!validity.mode || !CREDIT_CONFIG_VALIDITY_MODES.includes(validity.mode as never)) {
      return "Invalid validity mode";
    }
    if (validity.mode === "custom") {
      if (
        validity.custom_value == null ||
        validity.custom_value <= 0 ||
        !Number.isInteger(validity.custom_value)
      ) {
        return "Custom validity value must be a positive integer";
      }
      if (!validity.custom_unit || !CREDIT_CONFIG_VALIDITY_UNITS.includes(validity.custom_unit as never)) {
        return "Invalid custom validity unit";
      }
    }
  }

  for (const key of CREDIT_CONFIG_SERVICE_KEYS) {
    const error = checkPricing(fields.pricing[key], key);
    if (error) {
      return error;
    }
  }

  return null;
}
