import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Empty,
  Input,
  message,
  Modal,
  Pagination,
  Select,
  Tooltip,
} from "antd";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { SearchOutlined } from "@ant-design/icons";

import { Get, Post } from "@/utils/request";
import {
  getQuery,
  parseJSON,
  parseJSONArray,
  updateQuery,
  getEvaluateResultLevel,
} from "@/utils";

import styles from "./style.module.less";
import EvaluateResultBadge from "../EvaluateResultBadge";
import Icon from "../Icon";
import Stars from "@/assets/icons/stars";
import Light from "@/assets/icons/light";
import Ghost from "@/assets/icons/ghost";
import Tabs from "../Tabs";
import InterviewForm from "../NewTalentDetail/components/InterviewForm";
import globalStore from "@/store/global";
import { observer } from "mobx-react-lite";
import useStaffs from "@/hooks/useStaffs";
import Question from "@/assets/icons/question";
import EvaluateFeedback from "../EvaluateFeedback";
import TalentEvaluateFeedbackModal from "../TalentEvaluateFeedbackModal";
import EvaluateFeedbackConversation from "../EvaluateFeedbackConversation";
import TalentEvaluateFeedbackWithReasonModal from "../TalentEvaluateFeedbackWithReasonModal";

interface IProps {
  jobId?: number;
}

type TDataSourceItem = {
  talent?: TTalentItem;
  linkedinProfile?: TLinkedinProfileItem;
};

type TExtractBasicInfo = {
  years_of_experience: string;
  current_compensation: string;
  expected_compensation: string;
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

type TTalentFromApi = TTalent & {
  job_apply: {
    interview_finished_at?: string;
  };
};

type TTalentItem = TTalentFromApi & {
  basicInfo: TExtractBasicInfo;
  parsedEvaluateResult: TExtractEvaluateResult;
};

type TLinkedinProfileItem = TLinkedinProfile & {
  basicInfo: TExtractBasicInfo;
  parsedEvaluateResult: TExtractEvaluateResult;
};

type TTabKey =
  | "screened"
  | "not_screened"
  | "rejected"
  | "linked_in_profiles"
  | "all";

const PAGE_SIZE = 10;
const TalentCards = (props: IProps) => {
  const { jobId } = props;
  const [talents, setTalents] = useState<TTalentItem[]>([]);
  const [linkedinProfiles, setLinkedinProfiles] = useState<
    TLinkedinProfileItem[]
  >([]);
  const [activeTab, setActiveTab] = useState<TTabKey>("screened");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<TTalentItem>();
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);

  const [searchName, setSearchName] = useState<string>();
  const [selectedJob, setSelectedJob] = useState<number>();
  const [evaluateResultLevel, setEvaluateResultLevel] =
    useState<TEvaluateResultLevel>();
  const [openEvaluateFeedbackReason, setOpenEvaluateFeedbackReason] =
    useState<boolean>(false);
  const [
    openEvaluateFeedbackConversation,
    setOpenEvaluateFeedbackConversation,
  ] = useState<boolean>(false);
  const [
    needConfirmEvaluateFeedbackConversation,
    setNeedConfirmEvaluateFeedbackConversation,
  ] = useState<boolean>(false);

  const { staffs } = useStaffs();

  const { jobs } = globalStore;

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_talents.${key}`);

  useEffect(() => {
    const candidateTab = getQuery("candidate_tab");
    if (candidateTab) {
      setActiveTab(candidateTab as TTabKey);
    }
  }, []);

  useEffect(() => {
    fetchTalents();
  }, [jobId]);

  const fetchTalents = async () => {
    const { code, data } = await Get<{
      talents: TTalentFromApi[];
      linkedin_profiles: TLinkedinProfile[];
    }>(`/api/talents?job_id=${jobId ?? ""}`);

    if (code === 0) {
      setTalents(
        data.talents.map((talent) => {
          return {
            ...talent,
            basicInfo: parseJSON(talent.basic_info_json),
            parsedEvaluateResult: parseJSON(talent.evaluate_json),
            interviews: talent.interviews.map((interview) => {
              return {
                ...interview,
                time_slots: parseJSONArray(
                  interview.time_slots as unknown as string
                ),
              };
            }),
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

  const getStatus = (talentItem: TDataSourceItem): TTabKey => {
    const talent = talentItem.talent;

    if (!talent) {
      return "linked_in_profiles";
    }

    if (talent?.status === "rejected") {
      return "rejected";
    }

    if (!!talent?.job_apply?.interview_finished_at) {
      return "screened";
    } else {
      return "not_screened";
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

  const getJobId = (talentItem: TDataSourceItem): number | undefined => {
    return talentItem.talent?.job_id || talentItem.linkedinProfile?.job_id;
  };

  const updateTalentStatus = async (talent: TTalentItem, feedback?: string) => {
    const { code } = await Post(
      `/api/jobs/${talent.job_id}/talents/${talent.id}`,
      {
        status: "rejected",
        feedback,
      }
    );

    if (code === 0) {
      fetchTalents();
      setIsRejectModalOpen(false);
      message.success("Update talent status success");
    }
  };

  const updateTalentEvaluateFeedback = async (
    jobId: number,
    talentId: number,
    feedback: TEvaluateFeedback
  ) => {
    const newTalents = talents.map((talent) => {
      if (talent.id === talentId) {
        return {
          ...talent,
          evaluate_feedback: feedback,
        };
      }
      return talent;
    });
    setTalents(newTalents);

    setOpenEvaluateFeedbackReason(true);
    setSelectedTalent(newTalents.find((talent) => talent.id === talentId));

    const { code } = await Post(
      `/api/jobs/${jobId}/talents/${talentId}/evaluate_feedback`,
      {
        evaluate_feedback: feedback,
      }
    );

    if (code === 0) {
      fetchTalents();
    }
  };

  const updateTalentEvaluateFeedbackReason = async (reason: string) => {
    if (selectedTalent) {
      const { code } = await Post(
        `/api/jobs/${selectedTalent?.job_id}/talents/${selectedTalent?.id}/evaluate_feedback`,
        {
          evaluate_feedback_reason: reason,
        }
      );

      if (code === 0) {
        fetchTalents();
        setOpenEvaluateFeedbackConversation(true);
        setNeedConfirmEvaluateFeedbackConversation(true);
        message.success("Update success");
      }
    }
  };

  const mergedList: TDataSourceItem[] = useMemo(() => {
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

    return result;
  }, [talents, linkedinProfiles]);

  const dataSource: TDataSourceItem[] = useMemo(() => {
    return mergedList
      .filter((item) => {
        return activeTab === "all" || getStatus(item) === activeTab;
      })
      .filter((item) => {
        return (
          !searchName ||
          getName(item).toLowerCase().includes(searchName.toLowerCase())
        );
      })
      .filter((item) => {
        return !selectedJob || getJobId(item) === selectedJob;
      })
      .filter((item) => {
        return (
          !evaluateResultLevel ||
          getEvaluateResultLevel(
            getEvaluateResult(item)?.overall_recommendation?.result ??
              getEvaluateResult(item)?.result
          ) === evaluateResultLevel
        );
      })
      .sort((a, b) => {
        return dayjs(
          b.talent?.created_at || b.linkedinProfile?.created_at
        ).diff(dayjs(a.talent?.created_at || a.linkedinProfile?.created_at));
      });
  }, [mergedList, activeTab, searchName, selectedJob, evaluateResultLevel]);

  const currentPageDataSource = dataSource.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div
      className={classnames(styles.container, { [styles.noPadding]: !jobId })}
    >
      <div className={styles.pageTitle}>
        <div
          className={classnames(styles.pageTitleText, { [styles.lg]: !jobId })}
        >
          {t("candidate_list")}
        </div>
        <div className={styles.filterSection}>
          <div className={styles.filterItem}>
            <Input
              placeholder={t("search_placeholder")}
              prefix={<SearchOutlined />}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </div>
          <div className={styles.filterItem}>
            <Select
              placeholder={t("level_placeholder")}
              value={evaluateResultLevel}
              onChange={setEvaluateResultLevel}
              style={{ width: 200 }}
              allowClear
              options={[
                "ideal_candidate",
                "ideal_candidate_with_caveat",
                "good_fit",
                "good_fit_with_caveat",
                "maybe",
                "not_a_fit",
              ].map((level) => ({
                label: originalT(
                  `job_talents.evaluate_result_select_options.${level}`
                ),
                value: level,
              }))}
            />
          </div>
          {!jobId && (
            <div className={styles.filterItem}>
              <Select
                placeholder={t("job_placeholder")}
                value={selectedJob}
                onChange={setSelectedJob}
                style={{ width: 200 }}
                allowClear
                options={jobs.map((job) => ({
                  label: job.name,
                  value: job.id,
                }))}
                showSearch
                autoClearSearchValue
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </div>
          )}
        </div>
      </div>
      <div>
        <Tabs
          size="small"
          tabs={[
            {
              key: "screened",
              node: (
                <div className={styles.tabItem}>
                  Interview-Ready
                  <span>
                    (
                    {
                      mergedList.filter(
                        (item) => getStatus(item) === "screened"
                      ).length
                    }
                    )
                  </span>
                  {mergedList.filter(
                    (item) =>
                      getStatus(item) === "screened" && !item.talent?.viewed_at
                  ).length > 0 && <div className={styles.point} />}
                  <Tooltip title="Candidates who have completed the AI prescreening interview.">
                    <Icon icon={<Question />} />
                  </Tooltip>
                </div>
              ),
            },
            {
              key: "not_screened",
              node: (
                <div className={styles.tabItem}>
                  Pending AI Interview
                  <span>
                    (
                    {
                      mergedList.filter(
                        (item) => getStatus(item) === "not_screened"
                      ).length
                    }
                    )
                  </span>
                  {mergedList.filter(
                    (item) =>
                      getStatus(item) === "not_screened" &&
                      !item.talent?.viewed_at
                  ).length > 0 && <div className={styles.point} />}
                  <Tooltip title="Candidates whose resumes have been analyzed and rated, but have not yet completed the AI prescreening interview. You can still reach out to schedule an interview without waiting for them to complete.">
                    <Icon icon={<Question />} />
                  </Tooltip>
                </div>
              ),
            },
            {
              key: "rejected",
              node: (
                <div className={styles.tabItem}>
                  Rejected
                  <span>
                    (
                    {
                      mergedList.filter(
                        (item) => getStatus(item) === "rejected"
                      ).length
                    }
                    )
                  </span>
                  {mergedList.filter(
                    (item) =>
                      getStatus(item) === "rejected" && !item.talent?.viewed_at
                  ).length > 0 && <div className={styles.point} />}
                  <Tooltip title="Candidates the hiring manager has decided not to move forward with.">
                    <Icon icon={<Question />} />
                  </Tooltip>
                </div>
              ),
            },
            {
              key: "linked_in_profiles",
              node: (
                <div className={styles.tabItem}>
                  Outreach Campaign
                  <span>
                    (
                    {
                      mergedList.filter(
                        (item) => getStatus(item) === "linked_in_profiles"
                      ).length
                    }
                    )
                  </span>
                  <Tooltip title="Candidates proactively sourced and contacted by the Persevio team, including their engagement status.">
                    <Icon icon={<Question />} />
                  </Tooltip>
                </div>
              ),
            },
            {
              key: "all",
              node: (
                <div className={styles.tabItem}>
                  All Candidates<span>({mergedList.length})</span>
                  {mergedList.filter(
                    (item) => !!item.talent && !item.talent.viewed_at
                  ).length > 0 && <div className={styles.point} />}
                  <Tooltip title="Complete view of all candidates across all stages">
                    <Icon icon={<Question />} />
                  </Tooltip>
                </div>
              ),
            },
          ]}
          activeKey={activeTab}
          onChange={(key) => {
            setCurrentPage(1);
            setActiveTab(key as TTabKey);
            updateQuery("candidate_tab", key);
          }}
        />
      </div>
      <div className={styles.cardContainer}>
        {currentPageDataSource.length === 0 ? (
          <Empty style={{ margin: "60px 0" }} />
        ) : (
          currentPageDataSource.map((item) => {
            const basicInfo = getBasicInfo(item);
            const evaluateResult = getEvaluateResult(item);
            const talent = item.talent;
            const interview = talent?.interviews?.[0];
            const job = jobs.find(
              (job) =>
                job.id === (talent?.job_id || item.linkedinProfile?.job_id)
            );
            const visa = evaluateResult?.visa || basicInfo?.visa;
            const currentCompensation =
              evaluateResult?.current_compensation ||
              basicInfo?.current_compensation;
            const expectedCompensation =
              evaluateResult?.expected_compensation ||
              basicInfo?.expected_compensation;

            return (
              <div
                key={item.talent?.id || item.linkedinProfile?.id}
                className={styles.card}
                onClick={() => {
                  window.open(
                    item.talent
                      ? `/app/jobs/${item.talent.job_id}/standard-board/talents/${item.talent.id}`
                      : `/app/jobs/${item.linkedinProfile?.job_id}/standard-board/linkedin-profiles/${item.linkedinProfile?.id}`,
                    "_blank"
                  );
                }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <div className={styles.cardTitleName}>
                      {getName(item) || "-"}
                    </div>
                    <div className={styles.cardTitleResult}>
                      <EvaluateResultBadge
                        result={getEvaluateResultLevel(
                          evaluateResult?.overall_recommendation?.result ??
                            evaluateResult?.result
                        )}
                        caveat={evaluateResult?.overall_recommendation?.caveat}
                      />
                    </div>
                    {!!talent && (
                      <EvaluateFeedback
                        value={item.talent?.evaluate_feedback}
                        onChange={(value) => {
                          updateTalentEvaluateFeedback(
                            talent.job_id,
                            talent.id,
                            value
                          );
                        }}
                        onOpen={() => {
                          setSelectedTalent(item.talent);
                          setNeedConfirmEvaluateFeedbackConversation(false);
                          setOpenEvaluateFeedbackConversation(true);
                        }}
                      />
                    )}
                  </div>
                  <div className={styles.cardHeaderActions}>
                    {talent && talent.status !== "rejected" && (
                      <>
                        {talent.interviews?.length === 0 && (
                          <Button
                            type="primary"
                            danger
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!!item.talent?.evaluate_feedback) {
                                updateTalentStatus(
                                  item.talent,
                                  item.talent.evaluate_feedback_reason
                                );
                              } else {
                                setSelectedTalent(item.talent);
                                setIsRejectModalOpen(true);
                              }
                            }}
                          >
                            Reject
                          </Button>
                        )}

                        <Button
                          type="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTalent(item.talent);
                            setIsInterviewModalOpen(true);
                          }}
                        >
                          {interview
                            ? "Interview Information"
                            : "Schedule Interview"}
                        </Button>
                      </>
                    )}
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
                      <div>{t("visa")}</div>
                      <Tooltip title={visa}>
                        <div>{visa || "-"}</div>
                      </Tooltip>
                    </div>
                    <div>
                      <div>{t("current_compensation")}</div>
                      <Tooltip title={currentCompensation}>
                        <div>{currentCompensation || "-"}</div>
                      </Tooltip>
                    </div>
                    <div>
                      <div>{t("expected_compensation")}</div>
                      <Tooltip title={expectedCompensation}>
                        <div>{expectedCompensation || "-"}</div>
                      </Tooltip>
                    </div>
                  </div>

                  <div className={styles.workExperiences}>
                    <div className={styles.workExperiencesTitle}>
                      {t("work_experiences")}
                    </div>
                    {(basicInfo?.work_experiences ?? [])
                      .slice(0, 3)
                      .map((workExperience, index) => {
                        return (
                          <div
                            key={index}
                            className={styles.workExperienceItem}
                          >
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
                      })}
                    {(basicInfo?.work_experiences ?? []).length > 3 && (
                      <div style={{ marginLeft: 20 }}>...</div>
                    )}
                  </div>

                  <div className={styles.evaluateSummary}>
                    <Icon icon={<Stars />} />
                    {evaluateResult?.thumbnail_summary ||
                      evaluateResult?.summary ||
                      "-"}
                  </div>

                  {item.talent && (
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
                          {(
                            evaluateResult?.strengths ||
                            evaluateResult?.strength ||
                            []
                          ).map((strength, index) => (
                            <div
                              className={styles.evaluateDetailsItemContent}
                              key={index}
                            >
                              {strength.content}
                            </div>
                          ))}
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
                        {(
                          evaluateResult?.gaps ||
                          evaluateResult?.gap ||
                          []
                        ).map((gap, index) => (
                          <div
                            className={styles.evaluateDetailsItemContent}
                            key={index}
                          >
                            {gap.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.cardFooterContent}>
                    {(() => {
                      // 候选人已确认面试
                      // 已安排面试、等待候选人确认
                      // 通过筛选、等待安排面试
                      // 拒绝
                      // 等待筛选
                      // 抓取简历、未投递
                      const status = getStatus(item);
                      const interview = item.talent?.interviews?.[0];
                      const createdAt =
                        item.talent?.created_at ||
                        item.linkedinProfile?.created_at;
                      const tagType =
                        status === "rejected"
                          ? "rejected"
                          : !!interview
                          ? interview.mode === "written" ||
                            interview.scheduled_at
                            ? "interview_scheduled"
                            : "interview_created"
                          : "waiting_for_screening";
                      return (
                        <>
                          <div className={styles.left}>
                            {item.talent ? (
                              <div
                                className={classnames(
                                  styles.cardFooterStatus,
                                  styles[tagType]
                                )}
                              >
                                {tagType === "rejected"
                                  ? "Rejected"
                                  : tagType === "interview_scheduled"
                                  ? "Interview Scheduled"
                                  : tagType === "interview_created"
                                  ? "Pending Candidate Interview Confirmation"
                                  : "Pending Resume Review"}
                              </div>
                            ) : (
                              <div
                                className={classnames(
                                  styles.cardFooterStatus,
                                  styles.interview_scheduled
                                )}
                              >
                                {item.linkedinProfile?.message_read_at
                                  ? "Job Information Viewed"
                                  : "Outreach Sent"}
                              </div>
                            )}
                            {(tagType === "interview_scheduled" ||
                              tagType === "interview_created") && (
                              <div className={styles.cardFooterInterviewInfo}>
                                <div
                                  className={styles.cardFooterInterviewInfoItem}
                                >
                                  <div>Interview Mode:</div>
                                  <div>
                                    {originalT(
                                      `interview_form.mode_${interview?.mode}`
                                    )}
                                  </div>
                                </div>
                                <div
                                  className={styles.cardFooterInterviewInfoItem}
                                >
                                  <div>Schedule Time:</div>
                                  <div>
                                    {interview?.scheduled_at
                                      ? dayjs(interview?.scheduled_at).format(
                                          "YYYY-MM-DD HH:mm"
                                        )
                                      : "-"}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className={styles.right}>
                            {!jobId && !!job && (
                              <>
                                <div className={styles.border}>{job.name}</div>
                                <div className={styles.border}>
                                  {
                                    staffs.find(
                                      (staff) => staff.id === job.staff_id
                                    )?.name
                                  }
                                </div>
                              </>
                            )}
                            <div>
                              {dayjs(createdAt).format("YYYY-MM-DD HH:mm")}
                            </div>
                            <div className={styles.cardFooterSourceChannel}>
                              {item.talent?.source_channel === "customer"
                                ? "Your own channel"
                                : "Persevio"}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  {talent?.feedback && (
                    <div className={styles.cardFooterFeedback}>
                      <span>Reason for rejection:</span> {talent.feedback}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {dataSource.length > PAGE_SIZE && (
        <Pagination
          align="end"
          total={dataSource.length}
          pageSize={PAGE_SIZE}
          current={currentPage}
          onChange={(page) => {
            setCurrentPage(page);
          }}
        />
      )}

      <TalentEvaluateFeedbackWithReasonModal
        jobId={selectedTalent?.job_id ?? 0}
        talentId={selectedTalent?.id ?? 0}
        open={isRejectModalOpen}
        onOk={() => {
          setIsRejectModalOpen(false);
          setNeedConfirmEvaluateFeedbackConversation(true);
          setOpenEvaluateFeedbackConversation(true);
          fetchTalents();
        }}
        onCancel={() => setIsRejectModalOpen(false)}
      />

      <Modal
        open={isInterviewModalOpen}
        onCancel={() => setIsInterviewModalOpen(false)}
        width={"fit-content"}
        centered
        title="Schedule Interview"
        footer={null}
      >
        {selectedTalent && (
          <InterviewForm
            talent={selectedTalent}
            jobName={selectedTalent.job?.name || ""}
            interview={selectedTalent.interviews?.[0]}
            onClose={() => setIsInterviewModalOpen(false)}
            onSubmit={() => {
              if (!!selectedTalent.interviews?.[0]) {
                setIsInterviewModalOpen(false);
              } else {
                fetchTalents();
                setIsInterviewModalOpen(false);
              }
            }}
          />
        )}
      </Modal>

      <TalentEvaluateFeedbackModal
        open={openEvaluateFeedbackReason}
        onOk={(value) => {
          updateTalentEvaluateFeedbackReason(value);
          setOpenEvaluateFeedbackReason(false);
        }}
        onCancel={() => setOpenEvaluateFeedbackReason(false)}
      />

      <EvaluateFeedbackConversation
        open={openEvaluateFeedbackConversation}
        jobId={selectedTalent?.job_id ?? 0}
        talentId={selectedTalent?.id ?? 0}
        needConfirm={needConfirmEvaluateFeedbackConversation}
        onCancel={() => setOpenEvaluateFeedbackConversation(false)}
      />
    </div>
  );
};

export default observer(TalentCards);
