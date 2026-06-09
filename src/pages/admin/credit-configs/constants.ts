export const CREDIT_CONFIG_SERVICE_KEYS = [
  "unlock_candidate_low_fit",
  "unlock_candidate_medium_fit",
  "unlock_candidate_high_fit",
  "unlock_candidate_hard_to_find_high_fit",
  "ai_screening",
  "agency_placement",
] as const;

export type CreditConfigServiceKey = (typeof CREDIT_CONFIG_SERVICE_KEYS)[number];

export const CREDIT_CONFIG_VALIDITY_MODES = [
  "never",
  "3_months",
  "6_months",
  "12_months",
  "24_months",
  "custom",
] as const;

export const CREDIT_CONFIG_VALIDITY_UNITS = ["days", "months", "years"] as const;

export const CUSTOM_CONFIG_PAGE_SIZE = 10;

export const CREDIT_CONFIG_TABLE_SCROLL_X = 1680;
