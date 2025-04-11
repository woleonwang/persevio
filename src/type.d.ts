interface Window {
  webkitSpeechRecognition: () => void;
  SpeechRecognition: () => void;
}

interface IJob {
  id: number;
  company_id: number;
  staff_id: number;
  name: string;

  basic_info_doc_id: number;
  reference_doc_id: number;
  team_context_doc_id: number;

  role_context_doc_id: number;
  objectives_doc_id: number;
  activities_doc_id: number;
  candidate_requirements_doc_id: number;
  target_companies_doc_id: number;

  requirement_doc_id: number;
  compensation_details_doc_id: number;
  screening_question_doc_id: number;
  interview_plan_doc_id: number;
  jd_doc_id: number;

  jrd_survey_opened_at: string;
  status: number;
  created_at: string;
  updated_at: string;
  candidate_requirements_json: string;
}

interface ISettings {
  staff_name: string;
  email: string;
  prompts: TPrompt[];
  is_admin: number;
  lang: string;
}
