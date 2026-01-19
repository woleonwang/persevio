import { useEffect, useMemo, useState } from "react";
import { Button, Tooltip } from "antd";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import { Get } from "@/utils/request";
import { parseJSON } from "@/utils";

import styles from "./style.module.less";
import EvaluateResultBadge from "../EvaluateResultBadge";
import Icon from "../Icon";
import Stars from "@/assets/icons/stars";
import Light from "@/assets/icons/light";
import Ghost from "@/assets/icons/ghost";

export type TApproveStatus =
  | "message_read"
  | "message_sent"
  | "pending"
  | "staff_rejected"
  | "staff_accepted"
  | "interview_scheduled"
  | "interview_confirmed";

interface IProps {
  jobId?: number;
  filterParams?: {
    talentName?: string;
    jobId?: number;
    approveStatus?: TApproveStatus;
    creatorId?: number;
  };
}

type TDataSourceItem = {
  talent?: TTalentItem;
  linkedinProfile?: TLinkedinProfileItem;
};

type TExtractBasicInfo = {
  current_job_title: string;
  current_company: string;
  current_compensation: string;
  visa: string;
  years_of_experience: string;
  work_experiences: {
    company_name: string;
    job_title: string;
    start_year: string;
    end_year: string;
    is_present: boolean;
  }[];
  summary: string;
};

type TExtractEvaluateResult = {
  result:
    | "ideal_candidate"
    | "good_fit"
    | "recommend_with_reservations"
    | "not_a_fit";
  summary: string;
  strength?: {
    content: "string";
  }[];
  gap?: {
    content: string;
  }[];
};

type TTalentItem = TTalent & {
  basicInfo: TExtractBasicInfo;
  parsedEvaluateResult: TExtractEvaluateResult;
};

type TLinkedinProfileItem = TLinkedinProfile & {
  basicInfo: TExtractBasicInfo;
  parsedEvaluateResult: TExtractEvaluateResult;
};

const Talents = (props: IProps) => {
  const { jobId, filterParams } = props;
  const [talents, setTalents] = useState<TTalentItem[]>([]);
  const [linkedinProfiles, setLinkedinProfiles] = useState<
    TLinkedinProfileItem[]
  >([]);

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_talents.${key}`);

  useEffect(() => {
    fetchTalents();
  }, [jobId]);

  const fetchTalents = async () => {
    const { code, data } = await Get<{
      talents: TTalent[];
      linkedin_profiles: TLinkedinProfile[];
    }>(`/api/talents?job_id=${jobId ?? ""}`);

    if (code === 0) {
      setTalents(
        data.talents.map((talent) => {
          return {
            ...talent,
            basicInfo: parseJSON(talent.basic_info_json),
            parsedEvaluateResult: parseJSON(talent.evaluate_json),
          };
        })
      );
      setLinkedinProfiles(
        (data.linkedin_profiles ?? []).map((linkedinProfile) => {
          return {
            ...linkedinProfile,
            basicInfo: parseJSON(linkedinProfile.basic_info_json),
            parsedEvaluateResult: parseJSON(linkedinProfile.evaluate_json),
          };
        })
      );
    }
  };

  const getApproveStatus = (talentItem: TDataSourceItem): TApproveStatus => {
    const talent = talentItem.talent;
    const interview = talent?.interviews?.[0];
    const linkedinProfile = talentItem.linkedinProfile;

    if (interview) {
      if (interview.scheduled_at) {
        return "interview_confirmed";
      } else {
        return "interview_scheduled";
      }
    }

    if (talent) {
      if (talent.status === "accepted") {
        return "staff_accepted";
      } else if (talent.status === "rejected") {
        return "staff_rejected";
      } else {
        return "pending";
      }
    }

    if (linkedinProfile?.message_read_at) {
      return "message_read";
    } else {
      return "message_sent";
    }
  };

  const getName = (talentItem: TDataSourceItem): string => {
    return talentItem.talent?.name || talentItem.linkedinProfile?.name || "";
  };

  const getEvaluateResult = (
    talentItem: TDataSourceItem
  ): TExtractEvaluateResult | undefined => {
    return (
      talentItem.talent?.parsedEvaluateResult ||
      talentItem.linkedinProfile?.parsedEvaluateResult
    );
  };

  const getBasicInfo = (
    talentItem: TDataSourceItem
  ): TExtractBasicInfo | undefined => {
    return (
      talentItem.talent?.basicInfo || talentItem.linkedinProfile?.basicInfo
    );
  };

  const dataSource: TDataSourceItem[] = useMemo(() => {
    let result: TDataSourceItem[] = [];
    linkedinProfiles.forEach((linkedinProfile) => {
      // 1. 只有 profile，没有 talent
      // 2. 有 profile + talent, 刚注册
      // 3. 只有 talent 没有 profile
      if (linkedinProfile.candidate_id) {
        // 2
        const talent = talents.find(
          (talent) => talent.candidate_id === linkedinProfile.candidate_id
        );
        result.push({
          linkedinProfile,
          talent,
        });
      } else {
        // 1
        result.push({
          linkedinProfile: linkedinProfile,
        });
      }
    });

    talents
      .filter(
        (talent) =>
          !linkedinProfiles.find(
            (linkedinProfile) =>
              linkedinProfile.candidate_id !== 0 &&
              linkedinProfile.candidate_id === talent.candidate_id
          )
      )
      .forEach((talent) => {
        result.push({
          talent,
        });
      });

    if (filterParams?.talentName) {
      result = result.filter((item) => {
        return getName(item).includes(filterParams.talentName ?? "");
      });
    }

    if (filterParams?.approveStatus) {
      result = result.filter((item) => {
        return getApproveStatus(item) === filterParams.approveStatus;
      });
    }

    if (filterParams?.jobId) {
      result = result.filter((item) => {
        return item.talent
          ? item.talent?.job_id === filterParams.jobId
          : item.linkedinProfile?.job_id === filterParams.jobId;
      });
    }

    if (filterParams?.creatorId) {
      result = result.filter((item) => {
        return (
          item.talent?.job?.staff_id === filterParams.creatorId ||
          item.linkedinProfile?.job?.staff_id === filterParams.creatorId
        );
      });
    }

    return result.sort((a, b) => {
      return dayjs(b.talent?.created_at || b.linkedinProfile?.created_at).diff(
        dayjs(a.talent?.created_at || a.linkedinProfile?.created_at)
      );
    });
  }, [talents, linkedinProfiles, filterParams]);

  return (
    <div
      className={classnames(styles.container, { [styles.noPadding]: !jobId })}
    >
      {jobId && <h3>{t("candidate_list")}</h3>}
      <div className={styles.cardContainer}>
        {dataSource.map((item) => {
          const basicInfo = getBasicInfo(item);
          const evaluateResult = getEvaluateResult(item);
          return (
            <div
              key={item.talent?.id || item.linkedinProfile?.id}
              className={styles.card}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <div className={styles.cardTitleName}>
                    {getName(item) || "-"}
                  </div>
                  <div className={styles.cardTitleResult}>
                    <EvaluateResultBadge result={evaluateResult?.result} />
                  </div>
                </div>
                <div>
                  <Button type="primary">Schedule Interview</Button>
                </div>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.basicInfo}>
                  <div>
                    <div>{t("years_of_experience")}</div>
                    <Tooltip title={basicInfo?.years_of_experience}>
                      <div>{basicInfo?.years_of_experience || "-"}</div>
                    </Tooltip>
                  </div>
                  <div>
                    <div>{t("current_job_title")}</div>
                    <Tooltip title={basicInfo?.current_job_title}>
                      <div>{basicInfo?.current_job_title || "-"}</div>
                    </Tooltip>
                  </div>
                  <div>
                    <div>{t("visa")}</div>
                    <Tooltip title={basicInfo?.visa}>
                      <div>{basicInfo?.visa || "-"}</div>
                    </Tooltip>
                  </div>
                  <div>
                    <div>{t("current_compensation")}</div>
                    <Tooltip title={basicInfo?.current_compensation}>
                      <div>{basicInfo?.current_compensation || "-"}</div>
                    </Tooltip>
                  </div>
                </div>

                <div className={styles.workExperiences}>
                  <div className={styles.workExperiencesTitle}>
                    {t("work_experiences")}
                  </div>
                  {(basicInfo?.work_experiences ?? []).map(
                    (workExperience, index) => {
                      return (
                        <div key={index} className={styles.workExperienceItem}>
                          <div>
                            <span>{workExperience.job_title || "-"}</span>
                            <span
                              className={styles.workExperienceItemSeparator}
                            >
                              {" "}
                              at{" "}
                            </span>
                            <span
                              className={styles.workExperienceItemCompanyName}
                            >
                              {workExperience.company_name || "-"}
                            </span>
                          </div>
                          <div className={styles.workExperienceItemDuration}>
                            {workExperience.start_year || "-"} -{" "}
                            {workExperience.is_present
                              ? "Present"
                              : workExperience.end_year || "-"}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className={styles.evaluateSummary}>
                  <Icon icon={<Stars />} />
                  {evaluateResult?.summary || "-"}
                </div>

                <div className={styles.evaluateDetails}>
                  <div
                    className={classnames(
                      styles.evaluateDetailsItem,
                      styles.strengths
                    )}
                  >
                    <div className={styles.evaluateDetailsItemTitle}>
                      <Icon
                        icon={<Light />}
                        className={styles.evaluateDetailsItemIcon}
                      />
                      Strengths
                    </div>
                    <div>
                      {(evaluateResult?.strength ?? []).map(
                        (strength, index) => (
                          <div
                            className={styles.evaluateDetailsItemContent}
                            key={index}
                          >
                            {strength.content}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <div
                    className={classnames(
                      styles.evaluateDetailsItem,
                      styles.gaps
                    )}
                  >
                    <div className={styles.evaluateDetailsItemTitle}>
                      <Icon
                        icon={<Ghost />}
                        className={styles.evaluateDetailsItemIcon}
                      />
                      Potential Gaps
                    </div>
                    {(evaluateResult?.gap ?? []).map((gap, index) => (
                      <div
                        className={styles.evaluateDetailsItemContent}
                        key={index}
                      >
                        {gap.content}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div>
                  {(() => {
                    // 候选人已确认面试
                    // 已安排面试、等待候选人确认
                    // 通过筛选、等待安排面试
                    // 拒绝
                    // 等待筛选
                    // 抓取简历、未投递
                    const status = getApproveStatus(item);
                    if (
                      status === "interview_confirmed" ||
                      status === "interview_scheduled"
                    ) {
                      const interview = item.talent?.interviews?.[0];
                      return (
                        <>
                          <div>
                            <div>Interview Scheduled</div>
                            <div>
                              <div>
                                <div>Interview Mode:</div>
                                <div>{interview?.mode}</div>
                              </div>
                              <div>
                                <div>Schedule Time:</div>
                                <div>{interview?.created_at}</div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div>
                              {interview?.scheduled_at
                                ? dayjs(interview.scheduled_at).format(
                                    "YYYY-MM-DD HH:mm"
                                  )
                                : ""}
                            </div>
                            {/* <div>{item.talent?.source_channel}</div> */}
                          </div>
                        </>
                      );
                    } else if (status === "pending") {
                      return <div>Pending</div>;
                    } else if (status === "staff_rejected") {
                      return <div>Staff Rejected</div>;
                    } else if (status === "staff_accepted") {
                      return <div>Staff Accepted</div>;
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Talents;
