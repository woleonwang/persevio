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
  posted_at: string;
  status: number;
  created_at: string;
  updated_at: string;
  candidate_requirements_json: string;
  high_level_responsibility_json: string;
  day_to_day_tasks_json: string;
  icp_json: string;
  interview_plan_json: string;
  success_metrics_json: string;

  chatbot_options: {
    allow_salary: string;
    others: string;
  };

  resume_for_interview_design: string;
  feedback_for_interview_design: string;
  interview_transcript_for_interview_feedback: string;
  interview_design_for_interview_feedback: string;
}

type TPublicJob = {
  id: number;
  name: string;
  interview_plan_json: string;
};

type TJobListStatus = "INITIAL" | "ACCEPTED" | "REJECTED";

interface IJobApplyListItem {
  id: number;
  candidate_id: number;
  job_id: number;
  status: TJobListStatus;
  created_at: string;
  updated_at: string;
  recommend_doc_id: number;
  job_name: string;
  company_logo: string;
  company_name: string;
  interview_finished_at: string;
  deliveried_at: string;
}

// Enums
type OverallPotentialFitLevel =
  | "Strongly Recommend"
  | "Recommend"
  | "Worth Considering";

type CompetencyMatchLevel =
  | "Qualified"
  | "Over Qualified"
  | "Slightly Underqualified";

type CareerAspirationsMatchLevel =
  | "Strong Match"
  | "Largely Match"
  | "Partial Match"
  | "Aspirations Not Yet Fully Defined";

// Interfaces
interface OverallPotentialFit {
  level: OverallPotentialFitLevel;
  summary: string;
}

interface CompetencyMatch {
  level: CompetencyMatchLevel;
  summary: string;
}

interface CareerAspirationsMatch {
  level: CareerAspirationsMatchLevel;
  summary: string;
}

interface DetailedAlignmentAnalysis {
  why_you_might_be_interested: string[];
  potential_gaps_or_considerations: string[];
}

interface RoleOpportunityReport {
  overall_potential_fit: OverallPotentialFit;
  competency_match: CompetencyMatch;
  career_aspirations_match: CareerAspirationsMatch;
  detailed_alignment_analysis: DetailedAlignmentAnalysis;
}

interface IJobApply extends IJobApplyListItem {
  recommend_reason: RoleOpportunityReport;
  jd: string;
  talentStatus:
    | ""
    | "evaluate_succeed"
    | "evaluate_failed"
    | "accepted"
    | "rejected";
  interviews: IInterview[];
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
  career_aspiration_doc_id: number;
  internal_evaluate_doc_id: number;
  career_aspiration_json_doc_id: number;

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
  recommendReason: RoleOpportunityReport;
}

type TMenu = {
  title: string;
  path?: string;
  img: ReactNode;
  requireAdmin?: boolean;
  key?: string;
  children?: {
    title: string;
    path: string;
    active: boolean;
    onRemove?: () => void;
  }[];
};

interface IInterviewer {
  id: number;
  company_id: number;
  name: string;
  email: string;
  created_at: string;
  updateted_at: string;
}

interface IInterview {
  id: number;
  name: string;
  mode: "ONLINE" | "ONSITE";
  duration: number;
  scheduled_at: string;
  interviewer_id: number;
  interview_members: {
    id: number;
    interview_id: number;
    candidate_id: number;
    interviewer_id: number;
    time_slots: {
      scopes: { from: string; to: string }[];
    };
    interviewer?: IInterviewer;
  }[];
}
interface IInterviewRequest {
  name: string;
  mode: "ONLINE" | "ONSITE";
  duration: number;
  interviewer_id: number;
  timeSlots: {
    from: string;
    to: string;
  }[];
}

interface TInterviewDesigner {
  id: number;
  talent: {
    id: number;
    name: string;
  };
  resume: string;
  last_feedback: string;
  round: number;
  interview_game_plan_doc: string;
  created_at: string;
  updated_at: string;
}

interface TInterviewFeedback {
  id: number;
  talent: {
    id: number;
    name: string;
  };
  round: number;
  interview_transcript: string;
  feedback_json: string;
  evaluate_result: string;
  created_at: string;
  updated_at: string;
}

type TTalent = {
  id: number;
  name: string;
  status: string;
  feedback: string;
  parsed_content: string;
};

type TTalentChatType = "interview_designer" | "interview_feedback";

type TInterviewPlanDetail = {
  rounds: {
    interviewer: string;
  }[];
  signals: [
    {
      title: string;
      description: string;
      level: "must_have" | "good_to_have";
    }
  ];
};

type TEvaluation =
  | "exceeds"
  | "meets"
  | "likely_meets"
  | "likely_does_not_meets"
  | "does_not_meets"
  | "uncertain"
  | "not_assessed";

type TPredefinedSignal = {
  title: string;
  evaluation: TEvaluation;
  basis: string;
  evidences: string;
};

type TCustomizeSignal = {
  title: string;
  basis: string;
  evidences: string;
};

type TInterviewFeedbackDetail = {
  result: "recommend" | "pending" | "reject";
  interviewer_name?: string;
  feedback: string;
  next_round_concern: string;

  predefine_signals: TPredefinedSignal[];

  other_signals: TCustomizeSignal[];

  dangers: TCustomizeSignal[];
};

type TJobBasicInfo = {
  team_name: string;
  team_lanugage: string;
  role_type: "onsite" | "hybrid" | "remote";
  location: {
    city: string;
    address: string;
  }[];
  employee_level: (
    | "internship"
    | "no_experience"
    | "junior"
    | "mid_level"
    | "senior"
  )[];
};
