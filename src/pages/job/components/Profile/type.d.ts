export type TMatchLevel =
  | "not_a_match"
  | "recommend_with_reservations"
  | "match_pending_verification"
  | "match"
  | "strong_match";

export type TMeetType = "met" | "not_met" | "not_sure";

export type TConfidenceLevel = "VH" | "H" | "N" | "L" | "VL";

export type TPriority = "minimum" | "big_plus" | "plus";

export type TEvaluation = {
  talent: {
    name: string;
  };
  summary: {
    overall: TMatchLevel;
    competency: TMatchLevel;
    logistics: TMatchLevel;
    reasoning: string;
    suitability_score: {
      minimum: number;
      big_plus: number;
      plus: number;
      bonus: number;
      total: number;
    };
    calculated_rank: string;
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
  bonus: {
    alignment: string[];
    suitability: string[];
    bonus_awarded: {
      target_company: string[];
      prestigious_company: string[];
      bonus_points: number;
    };
    others: string;
  };
};
