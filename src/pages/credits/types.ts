export interface ICreditPackage {
  id: number;
  company_id: number;
  original_amount: number;
  remaining_amount: number;
  valid_from?: string | null;
  expires_at?: string | null;
  description?: string;
  created_at: string;
}

export interface ICreditTransaction {
  id: number;
  uuid: string;
  company_id: number;
  direction: "increase" | "decrease";
  source_type: string;
  amount: number;
  description?: string;
  total_after: number;
  created_at: string;
}

export type TransactionDirectionFilter = "all" | "increase" | "decrease";
export type TransactionSourceFilter =
  | "all"
  | "topup"
  | "gift"
  | "adjustment"
  | "usage";

export interface ICreditConfigFieldValue {
  inherit: boolean;
  value: number | null;
}

export interface ICreditConfigFields {
  display_rate: ICreditConfigFieldValue;
  topup_rate: ICreditConfigFieldValue;
  topup_credit_validity: {
    inherit: boolean;
    mode?: string;
    custom_value?: number | null;
    custom_unit?: string;
  };
  pricing: Record<string, ICreditConfigFieldValue>;
}
