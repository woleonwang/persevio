export type TOnboardingStage = "stage1" | "stage2" | "stage3" | "done";

export type TOnboardingBasics = {
  company_name?: string;
  industry?: string;
  industry_other?: string;
  founded_in?: number;
  company_stage?: string;
  employee_count_range?: string;
  hq_location?: {
    city?: string;
    country?: string;
  };
  primary_business_languages?: string[];
};

export type TOnboardingMaterials = {
  website_url?: string;
  linkedin_url?: string;
  material_text?: string;
};

export type TOnboardingProfile = {
  basics?: TOnboardingBasics;
  materials?: TOnboardingMaterials;
};

export type TOnboardingStatusResponse = {
  onboarding_stage: TOnboardingStage;
  profile: TOnboardingProfile;
};
