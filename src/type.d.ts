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
  status: "approving" | "rejected" | "approved";
  website: string;
  register_info: string;
  created_at: string;
  updated_at: string;
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
  jd_language: "zh-CN" | "en-US";
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

  jrd_context_document_json: string;
}

type TPublicJob = {
  id: number;
  name: string;
  interview_plan_json: string;
  language: string;
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

interface IPreRegisterInfo {
  email: string;
  name: string;
  phone: string;
  resume_path: string;
  mode: "ai" | "human";
  job_id: number;
}

interface ICandidateSettings {
  id: number;
  email: string;
  name: string;
  avatar: string;
  linkedin_profile_url: string;
  resume_path: string;
  work_experience: string;
  interests: string;
  targets: string;
  approve_status: "pending" | "approved" | "rejected" | "init";
  lang: string;
  resume_content: string;

  profile_doc: string;
  goals_doc: string;

  network_profile_finished_at?: string;
  pre_register_info?: string;
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
  requireStaffAdmin?: boolean;
  key?: string;
  badge?: number;
  children?: {
    title: string;
    path: string;
    active: boolean;
    onRemove?: () => void;
    badge?: number;
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

type TMatchLevel =
  | "not_a_match"
  | "recommend_with_reservations"
  | "match_pending_verification"
  | "match"
  | "strong_match"
  | "needs_verification";

type TMeetType = "met" | "not_met" | "not_sure";

type TConfidenceLevel = "VH" | "H" | "N" | "L" | "VL";

type TPriority = "minimum" | "big_plus" | "plus";

type TEvaluationResult = {
  talent: {
    name: string;
  };

  overall_match_level: TMatchLevel;
  competency_match: TMatchLevel;
  logistic_other_match: TMatchLevel;
  suitability_score: number;

  job_requirements_met: {
    minimum_requirements: string;
    big_plus_requirements: string;
    plus_requirements: string;
  };

  evaluation_summary: {
    strengths: string[];
    potential_gaps: string[];
    career_motivations: string[];
  };

  evaluation: {
    criterion: string;
    judgement: TMeetType;
    confidence_level: TConfidenceLevel;
    points_awarded: number;
    reasons: {
      reason: string;
      evidences: string[];
    }[];
    priority: TPriority;
  }[];
};

type TEvaluation =
  // part 2-5
  | "exceeds"
  | "meets"
  | "likely_meets"
  // --- 兼容老数据
  | "likely_does_not_meets"
  | "does_not_meets"
  // --- end
  | "likely_does_not_meet"
  | "does_not_meet"
  | "uncertain"
  | "not_assessed"
  // part 1.1 经验背景适配性评估选项.
  | "over_qualified"
  | "more_senior"
  | "meets_seniority_bar"
  | "slightly_junior"
  | "too_junior"
  | "uncertain_not_assessed"
  // part 1.2 关键职责评估选项
  | "directly_relevant"
  | "highly_transferable"
  | "partially_transferable"
  | "no_relevant"
  // part 1.3 工作环境评估选项
  | "identical_environment"
  | "similar_environment"
  | "different_environment";

type TTalent = {
  id: number;
  name: string;
  status: string;
  feedback: string;
  parsed_content: string;
  evaluate_result: TEvaluationResult;
  raw_evaluate_result: string;
  basic_info_json: string;
};

type TTalentChatType = "resume" | "interview_designer" | "interview_feedback";

type TSignalGroupKey =
  | "experience_contextual_fit"
  | "key_responsibilities"
  | "working_environment"
  | "skills"
  | "domain_knowledges"
  | "personal_traits"
  | "educations_and_certifications"
  | "others";

type TInterviewPlanDetail = {
  rounds: {
    interviewer: string;
  }[];
  signals: [
    {
      title: string;
      level: "must_have" | "good_to_have";
      description?: string;
      groupKey?: TSignalGroupKey;
      key?: string;
    }
  ];
};

type TPredefinedSignal = {
  title: string;
  evaluation: TEvaluation;
  basis: string;
  evidences: string;
  key?: string;
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

interface ITalentListItem {
  id: number;
  name: string;
  job_id: number;
  job_name: string;
  source_channel: "delivery" | "upload";
  evaluate_result: TEvaluationResult;
  status: "accepted" | "rejected" | "pending";
  viewed_at: string;
  created_at: string;
  updated_at: string;
}

interface ITalentListResponse {
  candidates: ITalentListItem[];
}

// Staff 相关类型定义
interface IAccount {
  id: number;
  username: string;
  is_admin: number;
  created_at: string;
  updated_at: string;
}

interface IStaff {
  id: number;
  name: string;
  position: string;
  phone: string;
  role: string;
  account_id: number;
  company_id: number;
  created_at: string;
  updated_at: string;
}

interface IStaffWithAccount extends IStaff {
  account: IAccount;
}

interface IStaffListResponse {
  code: number;
  data: IStaffWithAccount[];
}

interface ICandidateConnection {
  id: number;
  source_candidate_id: number;
  target_candidate_id: number;
  source_status: "pending" | "approved" | "rejected";
  target_status: "pending" | "approved" | "rejected";
  reason: string;
  interview_info: string;
  created_at: string;
  updated_at: string;
}

interface ICandidateTask {
  id: number;
  candidate_id: number;
  task_type: "connection_approved";
  task_params: string;
  finished_at?: string;
  created_at: string;
  updated_at: string;
}

type TDoneTag =
  | "jrd-done"
  | "compensation-details-done"
  | "outreach-done"
  | "intake-done"
  | "jd-done"
  | "interview-plan-done";

type TExtraTagName =
  // 后端生成
  | "copy-link" // 复制链接
  | "jrd-language" // 选择 jrd 语言
  | "jd-language" // 选择 jd 语言
  | "talent-evaluate-result"
  | "huoqujibenxinxi-jindu-one"
  | "upload-jd"
  | "salary-structure-request"
  | "shaixuanbiaozhun"
  | "screening-q-request"
  | "jindu-two"
  // | "jindu-three"
  | "jindu-four"
  | "extract-high-level-responsibility"
  | "extract-day-to-day-tasks"
  | "extract-icp"
  | "success-metric"
  | "current-round-evaluation"
  | "context-done"
  | "realities-done"
  | "responsibilities-done"
  | "icp-done"
  | "env-done"
  | "highlights-done"
  | "summary-draft"
  | "jd-draft"
  | TDoneTag
  // 前端生成
  | "open-link" // 打开新页面
  | "to-compensation-details-btn"
  | "to-jd-btn"
  | "to-post-job-btn"
  | "to-target-companies-btn"
  | "to-screening-questions-btn"
  | "to-interview-plan-btn"
  | "to-outreach-btn"
  | "to-social-post-btn"
  | "to-faq-btn"
  | "to-chatbot-btn"
  | "chatbot-config-btn"
  | "post-job-btn"
  | "interview-feedback-confirm-btn"
  //candiate
  | "interview-done"
  | "conversation-done"
  | "job-interview-done";

type TExtraTag = {
  name: TExtraTagName;
  content: string;
};

type TMessageFromApi = {
  id: number;
  content: {
    content: string;
    thinking?: string;
    role: "user" | "assistant";
    metadata: {
      message_type: "" | "system" | "normal";
      message_sub_type: "" | "error" | "normal";
      extra_tags: {
        name: TExtraTagName;
        content: string;
      }[];
      hide_for_roles?: ("staff" | "coworker" | "candidate" | "trial_user")[];
    };
  };
  updated_at: string;
  payload_id?: number;
};

type TMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
  thinking?: string;
  updated_at: string;
  messageType?: "normal" | "system";
  messageSubType?: "normal" | "error";
  extraTags?: TExtraTag[];
  payloadId?: number;
};

type TEditableDocumentType =
  | "context"
  | "realities"
  | "responsibilities"
  | "icp"
  | "jrd"
  | "jd";

type TSupportTag = {
  key: TExtraTagName;
  title?: React.ReactNode;
  handler?: (tag?: { name: string; content: string }) => void;
  children?: {
    title: React.ReactNode;
    handler: () => void;
  }[];
  autoTrigger?: boolean;
  style?: "inline-button" | "block-button" | "button-with-text";
};
