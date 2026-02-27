export type TExtractBasicInfo = {
  years_of_experience: string;
  current_compensation: string;
  visa: string;
  work_experiences: {
    company_name: string;
    job_title: string;
    start_year: string;
    end_year: string;
    is_present: boolean;
  }[];
};

type TExtractEvaluateResult = {
  overall_recommendation: {
    result: TEvaluateResultLevel;
    caveat?: string;
  };
  thumbnail_summary: string;
  current_compensation: string;
  expected_compensation: string;
  visa: string;
  strengths?: {
    content: string;
  }[];
  gaps?: {
    content: string;
  }[];
  // 兼容老数据
  result: TEvaluateResultLevel;
  strength?: {
    content: string;
  }[];
  gap?: {
    content: string;
  }[];

  // 兼容老数据
  summary: string;
};

export type TTalentListItem = TTalent & {
  basicInfo: TExtractBasicInfo;
  parsedEvaluateResult: TExtractEvaluateResult;
  job_apply: { interview_finished_at?: string; interview_started_at?: string };
  interviews: { scheduled_at?: string }[];
  stageKey?: string;
};
