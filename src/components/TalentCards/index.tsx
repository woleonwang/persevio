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
import { useNavigate } from "react-router";
import Tabs from "../Tabs";

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

type TTabKey =
  | "interview_ready"
  | "accepted"
  | "rejected"
  | "linked_in_profiles"
  | "all";

const Talents = (props: IProps) => {
  const { jobId } = props;
  const [talents, setTalents] = useState<TTalentItem[]>([]);
  const [linkedinProfiles, setLinkedinProfiles] = useState<
    TLinkedinProfileItem[]
  >([]);
  const [activeTab, setActiveTab] = useState<TTabKey>("interview_ready");

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_talents.${key}`);

  const navigate = useNavigate();

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

    if (activeTab === "interview_ready") {
      result = result.filter((item) => {
        return item.talent?.status === "pending";
      });
    }

    if (activeTab === "accepted") {
      result = result.filter((item) => {
        return item.talent?.status === "accepted";
      });
    }

    if (activeTab === "rejected") {
      result = result.filter((item) => {
        return item.talent?.status === "rejected";
      });
    }

    if (activeTab === "linked_in_profiles") {
      result = result.filter((item) => {
        return !item.talent;
      });
    }

    return result.sort((a, b) => {
      return dayjs(b.talent?.created_at || b.linkedinProfile?.created_at).diff(
        dayjs(a.talent?.created_at || a.linkedinProfile?.created_at)
      );
    });
  }, [talents, linkedinProfiles, activeTab]);

  return (
    <div
      className={classnames(styles.container, { [styles.noPadding]: !jobId })}
    >
      {jobId && <h3>{t("candidate_list")}</h3>}
      <div>
        <Tabs
          tabs={[
            {
              key: "all",
              label: "All",
            },
            {
              key: "interview_scheduled",
              label: "Interview Scheduled",
            },
          ]}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TTabKey)}
        />
      </div>
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
                  <div
                    className={styles.cardTitleName}
                    onClick={() => {
                      navigate(
                        `/app/jobs/${jobId}/standard-board/talents/${item.talent?.id}`
                      );
                    }}
                  >
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
                    const interview = item.talent?.interviews?.[0];
                    const createdAt =
                      item.talent?.created_at ||
                      item.linkedinProfile?.created_at;
                    return (
                      <>
                        <div className={styles.left}>
                          <div>
                            {status === "interview_confirmed" ||
                            status === "interview_scheduled" ? (
                              <div>Interview Scheduled</div>
                            ) : status === "pending" ? (
                              <div>Waiting for screening</div>
                            ) : status === "staff_rejected" ? (
                              <div>Reject</div>
                            ) : status === "staff_accepted" ? (
                              <div>Accept</div>
                            ) : (
                              <div>Waiting for screening</div>
                            )}
                          </div>
                          {(status === "interview_confirmed" ||
                            status === "interview_scheduled") && (
                            <div>
                              <div>
                                <div>Interview Mode:</div>
                                <div>{interview?.mode}</div>
                              </div>
                              <div>
                                <div>Schedule Time:</div>
                                <div>
                                  {dayjs(createdAt).format("YYYY-MM-DD HH:mm")}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className={styles.right}>
                          <div>
                            {item.talent?.created_at
                              ? dayjs(item.talent.created_at).format(
                                  "YYYY-MM-DD HH:mm"
                                )
                              : ""}
                          </div>
                          <div>
                            {item.talent?.source_channel === "custimer"
                              ? "Your own channel"
                              : "From Viona"}
                          </div>
                        </div>
                      </>
                    );
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
