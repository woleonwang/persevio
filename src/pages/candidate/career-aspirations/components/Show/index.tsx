import styles from "./style.module.less";

import { useTranslation } from "react-i18next";
export interface TAspirations {
  metadata?: {
    transcript_date?: string;
    profile_date?: string;
  };
  career_context_and_status?: {
    current_career_situation_summary?: string;
    overall_career_trajectory_goal?: string;
    job_search_status?: string;
    search_urgency_and_timeline_details?: string;
  };
  motivators_and_values?: {
    primary_motivators_for_next_role?: string[];
    key_values_sought_in_work_environment?: string[];
  };
  target_opportunity_profile?: {
    desired_role_title?: string;
    ideal_role_characteristics?: {
      target_function_or_work_type?: string[];
      desired_scope_and_impact_summary?: string;
      desired_seniority_level_summary?: string;
      skills_to_utilize?: string[];
      skills_to_develop?: string[];
      strategic_vs_execution_focus_preference?: string;
    };
    ideal_company_characteristics?: {
      preferred_industries?: string[];
      excluded_industries?: string[];
      preferred_company_size_stage_summary?: string;
      desired_company_culture_summary?: string;
      public_private_company_preference?: string;
    };
    desired_overall_contribution_summary?: string;
  };
  boundaries_and_firm_preferences?: {
    non_negotiables_deal_breakers?: string[];
    strong_preferences_flexible?: string[];
  };
  practical_considerations?: {
    compensation_expectations?: {
      minimum_base_salary_expectation?: string;
      target_base_salary_expectation?: string;
      target_total_compensation_expectation?: string;
      other_compensation_components_sought?: string;
      compensation_context_or_flexibility?: string;
    };
    notice_period_details?: string;
    availability_to_start_details?: string;
    location_and_mobility?: {
      preferred_locations?: string[];
      willingness_to_relocate_details?: string;
    };
    work_mode_preference_validated?: string;
    work_mode_details?: string;
    preferred_work_environment_language?: string;
  };
}

const Aspirations = (props: { aspirations: TAspirations }) => {
  const aspirations = props.aspirations;
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`career_aspirations.${key}`);

  const genRow = (key: string, value: string | string[] = "") => {
    return (
      <div className={styles.infoRow}>
        <div>{t(key)}</div>
        <div>
          {(typeof value === "string" ? value : value.join(",")) || "N/A"}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Metadata */}
      {/* <div className={styles.panel}>
        <div className={styles.panelTitle}>{t("metadata")}</div>
        <div className={styles.infoRow}>
          <div className={styles.item}>
            <div >{t("transcript_date")}</div>
            <div>{aspirations.metadata?.transcript_date || "N/A"}</div>
          </div>
          <div className={styles.item}>
            <div >{t("profile_date")}</div>
            <div>{aspirations.metadata?.profile_date || "N/A"}</div>
          </div>
        </div>
      </div> */}

      {/* Career Context and Status */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>
          {t("career_context_and_status")}
        </div>
        {genRow(
          "current_career_situation_summary",
          aspirations.career_context_and_status
            ?.current_career_situation_summary
        )}
        {genRow(
          "overall_career_trajectory_goal",
          aspirations.career_context_and_status?.overall_career_trajectory_goal
        )}
        {genRow(
          "job_search_status",
          aspirations.career_context_and_status?.job_search_status
        )}
        {genRow(
          "search_urgency_and_timeline_details",
          aspirations.career_context_and_status
            ?.search_urgency_and_timeline_details
        )}
      </div>

      <div className={styles.panel}>
        <div className={styles.panelTitle}>{t("motivators_and_values")}</div>
        {genRow(
          "primary_motivators_for_next_role",
          aspirations.motivators_and_values?.primary_motivators_for_next_role
        )}
        {genRow(
          "key_values_sought_in_work_environment",
          aspirations.motivators_and_values
            ?.key_values_sought_in_work_environment
        )}
      </div>

      {/* Target Opportunity Profile */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>
          {t("target_opportunity_profile")}
        </div>
        {genRow(
          "desired_role_title",
          aspirations.target_opportunity_profile?.desired_role_title
        )}
        {genRow(
          "public_private_company_preference",
          aspirations.target_opportunity_profile
            ?.desired_overall_contribution_summary
        )}
        {genRow(
          "target_function_or_work_type",
          aspirations.target_opportunity_profile?.ideal_role_characteristics
            ?.target_function_or_work_type
        )}
        {genRow(
          "desired_scope_and_impact_summary",
          aspirations.target_opportunity_profile?.ideal_role_characteristics
            ?.desired_scope_and_impact_summary
        )}
        {genRow(
          "desired_seniority_level_summary",
          aspirations.target_opportunity_profile?.ideal_role_characteristics
            ?.desired_seniority_level_summary
        )}
        {genRow(
          "skills_to_utilize",
          aspirations.target_opportunity_profile?.ideal_role_characteristics
            ?.skills_to_utilize
        )}
        {genRow(
          "skills_to_develop",
          aspirations.target_opportunity_profile?.ideal_role_characteristics
            ?.skills_to_develop
        )}
        {genRow(
          "strategic_vs_execution_focus_preference",
          aspirations.target_opportunity_profile?.ideal_role_characteristics
            ?.strategic_vs_execution_focus_preference
        )}

        {genRow(
          "preferred_industries",
          aspirations.target_opportunity_profile?.ideal_company_characteristics
            ?.preferred_industries
        )}
        {genRow(
          "excluded_industries",
          aspirations.target_opportunity_profile?.ideal_company_characteristics
            ?.excluded_industries
        )}
        {genRow(
          "preferred_company_size_stage_summary",
          aspirations.target_opportunity_profile?.ideal_company_characteristics
            ?.preferred_company_size_stage_summary
        )}
        {genRow(
          "desired_company_culture_summary",
          aspirations.target_opportunity_profile?.ideal_company_characteristics
            ?.desired_company_culture_summary
        )}
        {genRow(
          "public_private_company_preference",
          aspirations.target_opportunity_profile?.ideal_company_characteristics
            ?.public_private_company_preference
        )}
      </div>

      {/* Boundaries and Firm Preferences */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>
          {t("boundaries_and_firm_preferences")}
        </div>
        {genRow(
          "non_negotiables_deal_breakers",
          aspirations.boundaries_and_firm_preferences
            ?.non_negotiables_deal_breakers
        )}
        {genRow(
          "strong_preferences_flexible",
          aspirations.boundaries_and_firm_preferences
            ?.strong_preferences_flexible
        )}
      </div>

      {/* Practical Considerations */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>{t("practical_considerations")}</div>
        {genRow(
          "minimum_base_salary_expectation",
          aspirations.practical_considerations?.compensation_expectations
            ?.minimum_base_salary_expectation
        )}
        {genRow(
          "target_base_salary_expectation",
          aspirations.practical_considerations?.compensation_expectations
            ?.target_base_salary_expectation
        )}
        {genRow(
          "target_total_compensation_expectation",
          aspirations.practical_considerations?.compensation_expectations
            ?.target_total_compensation_expectation
        )}
        {genRow(
          "other_compensation_components_sought",
          aspirations.practical_considerations?.compensation_expectations
            ?.other_compensation_components_sought
        )}
        {genRow(
          "compensation_context_or_flexibility",
          aspirations.practical_considerations?.compensation_expectations
            ?.compensation_context_or_flexibility
        )}

        {genRow(
          "notice_period_details",
          aspirations.practical_considerations?.notice_period_details
        )}
        {genRow(
          "availability_to_start_details",
          aspirations.practical_considerations?.availability_to_start_details
        )}
        {genRow(
          "preferred_locations",
          aspirations.practical_considerations?.location_and_mobility
            ?.preferred_locations
        )}
        {genRow(
          "willingness_to_relocate_details",
          aspirations.practical_considerations?.location_and_mobility
            ?.willingness_to_relocate_details
        )}
        {genRow(
          "work_mode_preference_validated",
          aspirations.practical_considerations?.work_mode_preference_validated
        )}
        {genRow(
          "work_mode_details",
          aspirations.practical_considerations?.work_mode_details
        )}
        {genRow(
          "preferred_work_environment_language",
          aspirations.practical_considerations
            ?.preferred_work_environment_language
        )}
      </div>
    </div>
  );
};

export default Aspirations;
