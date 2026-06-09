import type { CreditConfigServiceKey } from "./constants";

export type CreditConfigType = "default" | "custom";

export interface ICreditConfigFieldValue {
  inherit: boolean;
  value: number | null;
}

export interface ICreditConfigValidity {
  inherit: boolean;
  mode?: string;
  custom_value?: number | null;
  custom_unit?: string;
}

export interface ICreditConfigFields {
  display_rate: ICreditConfigFieldValue;
  topup_rate: ICreditConfigFieldValue;
  topup_credit_validity: ICreditConfigValidity;
  pricing: Record<CreditConfigServiceKey, ICreditConfigFieldValue>;
}

export interface ICreditConfig {
  id: number;
  type: CreditConfigType;
  name: string;
  currency: string;
  fields_json: string;
  modified_by_staff_id?: number | null;
  created_at: string;
  updated_at: string;
  company_ids: number[];
}

export interface ICompanyOption {
  id: number;
  name: string;
  status?: string;
}

export interface ICreditConfigAuditLog {
  id: number;
  credit_config_id: number;
  log_type: "create" | "duplicate" | "delete" | "update";
  staff_id: number;
  remark?: string;
  extra_info: string;
  created_at: string;
}

export interface IStaffOption {
  id: number;
  name: string;
}

export interface ICreditConfigUpdateAuditExtraInfo {
  before: ICreditConfigAuditSnapshot;
  after: ICreditConfigAuditSnapshot;
  employer_changes: ICreditConfigEmployerChange[];
}

export interface ICreditConfigAuditSnapshot {
  name: string;
  currency: string;
  fields_json: ICreditConfigFields;
  applied_employers: { id: number; name: string }[];
}

export interface ICreditConfigEmployerChange {
  type: "add" | "remove" | "move";
  company_id: number;
  company_name: string;
  from_config_id?: number;
  from_config_name?: string;
}
