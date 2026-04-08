import classnames from "classnames";
import styles from "./style.module.less";
import EvaluateResultBadge from "@/components/EvaluateResultBadge";
import { buildTalentDetailUrl, getEvaluateResultLevel } from "@/utils";
import EvaluateFeedback from "@/components/EvaluateFeedback";
import { Button, message, Modal } from "antd";
import { useState } from "react";
import { Post } from "@/utils/request";
import { useTranslation } from "react-i18next";
import Icon from "@/components/Icon";
import Stars from "@/assets/icons/stars";
import Light from "@/assets/icons/light";
import Ghost from "@/assets/icons/ghost";
import dayjs from "dayjs";
import useStaffs from "@/hooks/useStaffs";
import TalentEvaluateFeedbackWithReasonModal from "@/components/TalentEvaluateFeedbackWithReasonModal";
import InterviewForm from "@/components/NewTalentDetail/components/InterviewForm";
import TalentEvaluateFeedbackModal from "@/components/TalentEvaluateFeedbackModal";
import EvaluateFeedbackConversation from "@/components/EvaluateFeedbackConversation";
import { TALENT_DETAIL_FROM } from "@/utils/consts";

interface IProps {
  variant: "pipeline" | "talents";
  talent: TTalentListItem;
  onUpdateTalent: () => void;
}

const TalentPopoverContent = ({
  variant,
  talent: talentProps,
  onUpdateTalent,
}: IProps) => {
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [talent, setTalent] = useState<TTalentListItem>(talentProps);

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

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_talents.${key}`);

  const { staffs } = useStaffs();

  const basicInfo = talent.basicInfo;
  const evaluateResult = talent.parsedEvaluateResult;
  const interview = talent.interviews?.[0];
  const job = talent.job;
  const isPipeline = variant === "pipeline";

  const updateTalentEvaluateFeedback = async (
    jobId: number,
    talentId: number,
    feedback: TEvaluateFeedback,
  ) => {
    setTalent({
      ...talent,
      evaluate_feedback: feedback,
    });

    setOpenEvaluateFeedbackReason(true);

    const { code } = await Post(
      `/api/jobs/${jobId}/talents/${talentId}/evaluate_feedback`,
      {
        evaluate_feedback: feedback,
      },
    );

    if (code === 0) {
      onUpdateTalent();
    } else {
      message.error("Update evaluate feedback failed");
    }
  };

  const updateTalentEvaluateFeedbackReason = async (reason: string) => {
    await Post(
      `/api/jobs/${talent.job_id}/talents/${talent.id}/evaluate_feedback`,
      {
        evaluate_feedback_reason: reason,
      },
    );

    setOpenEvaluateFeedbackConversation(true);
    setNeedConfirmEvaluateFeedbackConversation(true);
    message.success("Update success");
  };

  const updateTalentStatus = async (
    talent: TTalentListItem,
    feedback?: string,
  ) => {
    const { code } = await Post(
      `/api/jobs/${talent.job_id}/talents/${talent.id}`,
      {
        status: "rejected",
        feedback,
      },
    );

    if (code === 0) {
      onUpdateTalent();
      setIsRejectModalOpen(false);
      message.success("Update talent status success");
    }
  };

  const getStatus = (talent: TTalentListItem): string => {
    if (talent.status === "rejected") {
      return "rejected";
    }

    if (!!talent.job_apply?.interview_finished_at) {
      return "screened";
    } else {
      return "not_screened";
    }
  };

  const handleOpenTalentDetail = () => {
    const from =
      variant === "pipeline"
        ? TALENT_DETAIL_FROM.pipeline
        : TALENT_DETAIL_FROM.talents;
    window.open(
      buildTalentDetailUrl(talent.job_id, talent.id, from),
      "_blank",
    );
  };

  return (
    <div
      key={talent.id}
      className={styles.card}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <div
            className={styles.cardTitleName}
            onClick={handleOpenTalentDetail}
          >
            {talent.name || "-"}
          </div>
          {isPipeline && (
            <>
              <div className={styles.cardTitleResult}>
                <EvaluateResultBadge
                  result={getEvaluateResultLevel(evaluateResult)}
                  caveat={evaluateResult?.overall_recommendation?.caveat}
                />
              </div>
              {!!talent && (
                <EvaluateFeedback
                  value={talent.evaluate_feedback}
                  onChange={(value) => {
                    updateTalentEvaluateFeedback(
                      talent.job_id,
                      talent.id,
                      value,
                    );
                  }}
                  onOpen={() => {
                    setNeedConfirmEvaluateFeedbackConversation(false);
                    setOpenEvaluateFeedbackConversation(true);
                  }}
                />
              )}
            </>
          )}
        </div>
        {isPipeline && (
          <div className={styles.cardHeaderActions}>
            {talent && talent.status !== "rejected" && (
              <>
                <Button
                  type="primary"
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!!talent.evaluate_feedback) {
                      updateTalentStatus(
                        talent,
                        talent.evaluate_feedback_reason,
                      );
                    } else {
                      setIsRejectModalOpen(true);
                    }
                  }}
                >
                  Reject
                </Button>

                <Button
                  type="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsInterviewModalOpen(true);
                  }}
                >
                  {interview ? "Interview Information" : "Schedule Interview"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className={styles.cardContent} onClick={handleOpenTalentDetail}>
        <div className={styles.evaluateSummary}>
          <div className={styles.evaluateSummaryTitle}>
            <Icon icon={<Stars />} />
            Viona’s Take
          </div>
          <div style={{ marginLeft: 24 }}>
            {evaluateResult?.thumbnail_summary ||
              (evaluateResult?.summary as unknown as string) ||
              "-"}
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
                <div key={index} className={styles.workExperienceItem}>
                  <div>
                    <span>{workExperience.job_title || "-"}</span>
                    <span className={styles.workExperienceItemSeparator}>
                      {" "}
                      at{" "}
                    </span>
                    <span className={styles.workExperienceItemCompanyName}>
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
        {isPipeline && talent && (
          <div className={styles.evaluateDetails}>
            <div
              className={classnames(
                styles.evaluateDetailsItem,
                styles.strengths,
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
              className={classnames(styles.evaluateDetailsItem, styles.gaps)}
            >
              <div className={styles.evaluateDetailsItemTitle}>
                <Icon
                  icon={<Ghost />}
                  className={styles.evaluateDetailsItemIcon}
                />
                Potential Gaps
              </div>
              {(evaluateResult?.gaps || evaluateResult?.gap || []).map(
                (gap, index) => (
                  <div
                    className={styles.evaluateDetailsItemContent}
                    key={index}
                  >
                    {gap.content}
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        {(() => {
          const status = getStatus(talent);
          const interview = talent.interviews?.[0];
          const createdAt = talent.created_at;
          const tagType =
            status === "rejected"
              ? "rejected"
              : !!interview
                ? interview.mode === "written" || interview.scheduled_at
                  ? "interview_scheduled"
                  : "interview_created"
                : "waiting_for_screening";
          return (
            <>
              <div className={styles.cardFooterContent}>
                <div className={styles.left}>
                  {isPipeline && (
                    <div
                      className={classnames(
                        styles.cardFooterStatus,
                        styles[tagType],
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
                  )}
                </div>
                <div className={styles.right}>
                  {!!job && (
                    <div className={styles.border}>
                      {staffs.find((staff) => staff.id === job.staff_id)?.name}
                    </div>
                  )}
                  <div>{dayjs(createdAt).format("YYYY-MM-DD HH:mm")}</div>
                  <div className={styles.cardFooterSourceChannel}>
                    {talent.source_channel === "customer"
                      ? "Your own channel"
                      : "Persevio"}
                  </div>
                </div>
              </div>
              {isPipeline &&
                (tagType === "interview_scheduled" ||
                  tagType === "interview_created") && (
                  <div className={styles.cardFooterInterviewInfo}>
                    <div className={styles.cardFooterInterviewInfoItem}>
                      <div>Interview Mode:</div>
                      <div>
                        {originalT(`interview_form.mode_${interview?.mode}`)}
                      </div>
                    </div>
                    <div className={styles.cardFooterInterviewInfoItem}>
                      <div>Schedule Time:</div>
                      <div>
                        {interview?.scheduled_at
                          ? dayjs(interview?.scheduled_at).format(
                              "YYYY-MM-DD HH:mm",
                            )
                          : "-"}
                      </div>
                    </div>
                  </div>
                )}
            </>
          );
        })()}
        {isPipeline && talent?.feedback && (
          <div className={styles.cardFooterFeedback}>
            <span>Reason for rejection:</span> {talent.feedback}
          </div>
        )}
      </div>

      <TalentEvaluateFeedbackWithReasonModal
        jobId={talent.job_id ?? 0}
        talentId={talent.id ?? 0}
        open={isRejectModalOpen}
        onOk={() => {
          setIsRejectModalOpen(false);
          setNeedConfirmEvaluateFeedbackConversation(true);
          setOpenEvaluateFeedbackConversation(true);
          onUpdateTalent();
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
        <InterviewForm
          talent={talent}
          jobName={talent.job?.name || ""}
          interview={talent.interviews?.[0]}
          onClose={() => setIsInterviewModalOpen(false)}
          onSubmit={() => {
            if (!!talent.interviews?.[0]) {
              setIsInterviewModalOpen(false);
            } else {
              onUpdateTalent();
              setIsInterviewModalOpen(false);
            }
          }}
        />
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
        jobId={talent.job_id ?? 0}
        talentId={talent.id ?? 0}
        needConfirm={needConfirmEvaluateFeedbackConversation}
        onCancel={() => setOpenEvaluateFeedbackConversation(false)}
      />
    </div>
  );
};

export default TalentPopoverContent;
