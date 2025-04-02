interface Window {
  webkitSpeechRecognition: () => void;
  SpeechRecognition: () => void;
}

interface IJob {
  id: number;
  company_id: number;
  staff_id: number;
  name: string;
  context_doc_id: number;
  competency_doc_id: number;
  requirement_doc_id: number;
  jd_doc_id: number;
  interview_plan_doc_id: number;
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
