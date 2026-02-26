type TPrompt = {
  prompt_type: string;
  content: string;
  role: "recruiter" | "candidate";
};

interface Window {
  webkitSpeechRecognition: () => void;
  SpeechRecognition: () => void;
}

type TCompanySize =
  | "lte_10"
  | "11_to_50"
  | "51_to_100"
  | "101_to_500"
  | "501_to_1000"
  | "gte_1001";

interface ICompany {
  id: number;
  name: string;
  status: "approving" | "rejected" | "approved";
  website: string;
  register_info: string;
  size: TCompanySize;
  recruitment_requirements_json: string;
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
  initial_posted_at: string;
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
  job_requirement_strategy_doc: string;

  chatbot_options: {
    allow_salary: string;
    others: string;
  };

  resume_for_interview_design: string;
  feedback_for_interview_design: string;
  interview_transcript_for_interview_feedback: string;
  interview_design_for_interview_feedback: string;

  jrd_context_document_json: string;
  jd_version: number;
  bonus_pool: number;
  pipeline_stages: string;

  admin_jobs?: {
    admin: {
      id: number;
      name: string;
    };
  }[];
}

type TPublicJob = {
  id: number;
  name: string;
  interview_plan_json: string;
  language: string;
};

type TJobListStatus = "INITIAL" | "ACCEPTED" | "REJECTED";

interface IJobApply {
  id: number;
  candidate_id: number;
  job_id: number;
  status: TJobListStatus;
  created_at: string;
  interview_finished_at: string;
  interview_mode: "ai" | "human" | "whatsapp";
  whatsapp_number_confirmed_at?: string;
  switch_mode_reason?: string;
}

// 候选人侧
// 接口返回的 + jdJSON
interface IJobApplyListItem extends IJobApply {
  job_name: string;
  job_basic_info: string;
  job_posted_at: string;
  company_logo: string;
  company_name: string;
  jd: string;
  jdJson: Record<string, string>;
  talent_status:
    | ""
    | "evaluate_succeed"
    | "evaluate_failed"
    | "accepted"
    | "rejected";
  interviews?: TInterview[];
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

interface ISettings {
  email: string;
  staff_name: string;
  country_code: string;
  phone: string;
  position: string;
  company_name: string;
  company_website: string;
  company_size: string;
  company_recruitment_requirements_json: string;
  prompts: TPrompt[];
  is_admin: number;
  role: string;
  lang: string;
  company_status: string;
  company_mode: string;
  company_recruitment_requirements?: {
    role_type?: string[];
    headcount_number?: string;
  };
}

interface IPreRegisterInfo {
  email: string;
  name: string;
  phone: string;
  country_code: string;
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
  whatsapp_contact_number?: string;
  whatsapp_country_code?: string;
  whatsapp_phone_number?: string;

  profile_doc: string;
  goals_doc: string;

  network_profile_finished_at?: string;
  pre_register_info?: string;
  job_id?: number;
  interview_finished_at?: string;
  insight_json?: string;
  profile_json?: string;
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
  requireSuperAdmin?: boolean;
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

type TFooter = {
  title: string;
  path: string;
  img: ReactNode;
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
  candidate_id: number;
  name: string;
  status: string;
  feedback: string;
  parsed_content: string;
  evaluate_result: TEvaluationResult;
  raw_evaluate_result: string;
  basic_info_json: string;
  resume_detail_json: string;
  evaluate_json: string;
  evaluate_result_updated_at?: string;
  job_id: number;
  source_channel: string;
  hire_status: "hired" | "not_hired";
  share_token_id?: number;
  interviews: TInterview[];
  job?: {
    id: number;
    name: string;
    staff_id: number;
    bonus_pool: number;
    company?: {
      id: number;
      name: string;
    };
  };
  created_at: string;
  viewed_at: string;
  evaluate_feedback: TEvaluateFeedback;
  evaluate_feedback_reason: string;
};

type TInterview = {
  id: number;
  mode: "written" | "interview";
  written_test_link: string;
  interview_type: "face_to_face" | "online" | "phone";
  duration: number;
  slots_gap: number;
  time_slots: {
    from: string;
    to: string;
  }[];
  interviewers?: string;
  focus?: string;
  contact_person?: string;
  contact_number?: string;
  notes?: string;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
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
  | "realreq"
  | "targetprof"
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
  | "role-essence-done"
  | "cdd-requirement-done"
  | "cdd-profile-done"
  | "sourcing-done"
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
  | "job-interview-done"
  | "discovery-chat-done";

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
  payload?: {
    duration: number;
  };
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
  duration?: number;
};

type TEditableDocumentType =
  | "context"
  | "realities"
  | "responsibilities"
  | "icp"
  | "role-essence"
  | "cdd-requirement"
  | "cdd-profile"
  | "sourcing"
  | "jrd"
  | "jd";

type TSupportTag = {
  key: TExtraTagName;
  title?: React.ReactNode;
  handler?: (tag?: { name: string; content: string }) => void;
  children?: {
    key: string;
    title: React.ReactNode;
    handler: () => void;
  }[];
  autoTrigger?: boolean;
  style?: "inline-button" | "block-button" | "button-with-text";
};

type TLinkedinProfile = {
  id: number;
  job_id: number;
  name: string;
  url: string;
  match_score?: number;
  profile_doc?: string;
  recommendation_doc?: string;
  outreach_message_doc?: string;
  basic_info_json: string;
  created_at: string;
  updated_at: string;
  message_sent_at?: string;
  message_read_at?: string;
  candidate_id?: number;
  evaluate_json?: string;

  job: {
    id: number;
    name: string;
    staff_id: number;
    company: {
      id: number;
      name: string;
    };
  };
};

type TJobCollaborator = {
  id: number;
  job_id: number;
  staff_id: number;
};

type TEvaluateResultLevel =
  | "ideal_candidate"
  | "good_fit"
  | "ideal_candidate_with_caveat"
  | "good_fit_with_caveat"
  | "maybe"
  | "not_a_fit";

type TEvaluateFeedback = "accurate" | "slightly_inaccurate" | "inaccurate";
