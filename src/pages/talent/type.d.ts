export type TMatchLevel =
  | "not_a_match"
  | "recommend_with_reservations"
  | "match_pending_verification"
  | "match"
  | "strong_match"
  | "needs_verification";

export type TMeetType = "met" | "not_met" | "not_sure";

export type TConfidenceLevel = "VH" | "H" | "N" | "L" | "VL";

export type TPriority = "minimum" | "big_plus" | "plus";

export type TEvaluation = {
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

export type TCandidate = {
  name: string;
};

export type TTalent = {
  id: number;
  candidate_id: number;
  status: "evaluate_succeed" | "evaluate_failed";
  evaluate_result: TEvaluation;
  file_path: string;
  content: string;
  job_id: number;
  created_at: string;
  updated_at: string;
  candidate: TCandidate;
  parsed_content: string;
};
