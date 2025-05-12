type TPrompt = {
  prompt_type: string;
  content: string;
  role: "recruiter" | "candidate";
};

interface Window {
  webkitSpeechRecognition: () => void;
  SpeechRecognition: () => void;
}

interface ICompany {
  id: number;
  name: string;
}
interface IJob {
  id: number;
  company_id: number;
  staff_id: number;
  name: string;

  basic_info_doc_id: number;
  reference_doc_id: number;

  requirement_doc_id: number;
  jd_doc_id: number;
  target_companies_doc_id: number;
  compensation_details_doc_id: number;
  screening_question_doc_id: number;
  interview_plan_doc_id: number;
  outreach_message_doc_id: number;
  social_media_doc_id: number;
  faq_doc_id: number;

  jrd_survey_opened_at: string;
  status: number;
  created_at: string;
  updated_at: string;
  candidate_requirements_json: string;
  chatbot_options: {
    allow_salary: string;
    others: string;
  };
}

interface IJobApplyListItem {
  id: number;
  candidate_id: number;
  job_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  recommend_doc_id: number;
  job_name: string;
  company_logo: string;
  company_name: string;
  interview_finished_at: string;
  deliveried_at: string;
}

interface IJobApply extends IJobApplyListItem {
  recommend_reason: string;
  jd: string;
}

interface ISettings {
  staff_name: string;
  email: string;
  prompts: TPrompt[];
  is_admin: number;
  lang: string;
}

interface ICandidateSettings {
  id: number;
  email: string;
  name: string;
  status: "init" | "extracting" | "extracted";
  phone: string;
  phone_confirmed_at: string;
  resume_confirmed_at: string;
  interview_finished_at: string;

  llm_resume_doc_id: number;
  initial_career_aspiration_doc_id: number;
  internal_evaluate_doc_id: number;
  deep_career_aspiration_doc_id: number;

  lang: string;
}

interface IRecommendedJob {
  id: number;
  job_id: number;
  candidate_id: number;
  job: {
    id: number;
    name: string;
    company_id: number;
    company: {
      id: number;
      name: string;
      logo: string;
    };
  };
  status: "INITIAL" | "ACCEPTED" | "REJECTED";
  created_at: string;
}

type TMenu = {
  title: string;
  path?: string;
  img: ReactNode;
  requireAdmin?: boolean;
  children?: {
    title: string;
    path: string;
    active: boolean;
  }[];
};
