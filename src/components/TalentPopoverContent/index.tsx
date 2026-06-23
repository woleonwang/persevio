import classnames from "classnames";
import styles from "./style.module.less";
import {
  buildTalentDetailUrl,
  getEvaluateResultLevel,
} from "@/utils";
import EvaluateFeedback from "@/components/EvaluateFeedback";
import { Button, message, Modal, Tooltip } from "antd";
import { useRef, useState } from "react";
import { Post } from "@/utils/request";
import { useTranslation } from "react-i18next";
import Icon from "@/components/Icon";
import Stars from "@/assets/icons/stars";
import Light from "@/assets/icons/light";
import Ghost from "@/assets/icons/ghost";
import TalentEvaluateFeedbackWithReasonModal from "@/components/TalentEvaluateFeedbackWithReasonModal";
import InterviewForm from "@/components/NewTalentDetail/components/InterviewForm";
import TalentEvaluateFeedbackModal from "@/components/TalentEvaluateFeedbackModal";
import AssignedRecruiters from "@/components/TalentPopoverContent/AssignedRecruiters";
import {
  LogisticsFitKnownKeys,
  SkillsFitKnownKeys,
  TALENT_DETAIL_FROM,
} from "@/utils/consts";

interface IProps {
  variant: "pipeline" | "talents";
  mode: "pipeline" | "table";
  talent: TTalentListItem;
  onUpdateTalent: () => void;
  onStartCalibrationConversation: (
    params: TStartCalibrationConversationParams,
  ) => void;
}

const TalentPopoverContent = ({
  variant,
  talent: talentProps,
  onUpdateTalent,
  onStartCalibrationConversation,
  mode,
}: IProps) => {
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [talent, setTalent] = useState<TTalentListItem>(talentProps);
  const cardRef = useRef<HTMLDivElement>(null);

  const [openEvaluateFeedbackReason, setOpenEvaluateFeedbackReason] =
    useState<boolean>(false);

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_talents.${key}`);

  const basicInfo = talent.basicInfo;
  const evaluateResult = talent.parsedEvaluateResult;
  const fitResult = getEvaluateResultLevel(evaluateResult);

  const interview = talent.interviews?.[0];
  const job = talent.job;
  const isPipeline = variant === "pipeline";

  const startCalibrationConversation = (
    source: TCalibrationConversationSource,
    needConfirm: boolean,
  ) => {
    const jobId = talent.job?.invitation_token;
    const talentId = talent.id ?? 0;
    if (!jobId) return;

    onStartCalibrationConversation({ jobId, talentId, source, needConfirm });
  };

  const updateTalentEvaluateFeedback = async (
    jobId: string | number,
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
      `/api/jobs/${talent.job?.invitation_token}/talents/${talent.id}/evaluate_feedback`,
      {
        evaluate_feedback_reason: reason,
      },
    );

    startCalibrationConversation("evaluate_feedback", true);
    message.success("Update success");
  };

  const handleOpenTalentDetail = () => {
    const from =
      variant === "pipeline"
        ? TALENT_DETAIL_FROM.pipeline
        : TALENT_DETAIL_FROM.talents;
    window.open(
      buildTalentDetailUrl(job!.invitation_token, talent.id, from),
      "_blank",
    );
  };

  const getSkillsText = () => {
    const skillsLevel =
      evaluateResult?.overall_recommendation?.skills_fit?.level;
    const skillsText = skillsLevel
      ? SkillsFitKnownKeys.includes(skillsLevel as TSkillsFitKey)
        ? t(`skills_fit_options.${skillsLevel}`)
        : skillsLevel
      : "-";
    return skillsText;
  };

  const getLogisticsText = () => {
    const logisticsRaw =
      evaluateResult?.overall_recommendation?.logistics_fit?.level;
    const logisticsList = Array.isArray(logisticsRaw)
      ? logisticsRaw
      : logisticsRaw
        ? [logisticsRaw]
        : [];
    const logisticsText =
      logisticsList.length > 0
        ? logisticsList
            .map((level) =>
              LogisticsFitKnownKeys.includes(level as TLogisticsFitKey)
                ? t(`logistics_fit_options.${level}`)
                : level,
            )
            .join(", ")
        : "-";
    return logisticsText;
  };

  return (
    <div
      ref={cardRef}
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
        </div>
        {isPipeline && (
          <div className={styles.cardHeaderActions}>
            {talent && talent.status !== "rejected" && (
              <>
                <Button
                  variant="outlined"
                  color="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRejectModalOpen(true);
                  }}
                >
                  Reject
                </Button>

                {false && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsInterviewModalOpen(true);
                    }}
                  >
                    {interview ? "Interview Information" : "Schedule Interview"}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {isPipeline && (
        <div className={styles.signalRowWrap}>
          <div className={styles.cardTitleResult}>
            <div
              className={`${styles.interviewSection} ${styles[`theme-${fitResult}`]}`}
            >
              <div className={styles.interviewRow}>
                <span className={styles.interviewLabel}>Interview?</span>
                <span
                  className={`${styles.interviewValue} ${styles[`label-${fitResult}`]}`}
                >
                  {t(`evaluate_result_options.${fitResult}`)}
                </span>
              </div>
              <div className={styles.secondaryRow}>
                <span className={styles.secondaryLabel}>Skills</span>
                <Tooltip title={getSkillsText()}>
                  <span className={styles.valueEllipsis}>
                    {getSkillsText()}
                  </span>
                </Tooltip>
              </div>
              <div className={styles.secondaryRow}>
                <span className={styles.secondaryLabel}>Logistics</span>
                <Tooltip title={getLogisticsText()}>
                  <span className={styles.valueEllipsis}>
                    {getLogisticsText()}
                  </span>
                </Tooltip>
              </div>
            </div>
          </div>
          {!!talent && (
            <div className={styles.feedbackWrap}>
              <EvaluateFeedback
                value={talent.evaluate_feedback}
                onChange={(value) => {
                  updateTalentEvaluateFeedback(
                    talent.job!.invitation_token,
                    talent.id,
                    value,
                  );
                }}
                onOpen={() => {
                  startCalibrationConversation("evaluate_feedback", false);
                }}
              />
            </div>
          )}
        </div>
      )}
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
                {(evaluateResult?.strengths || []).map((strength, index) => (
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
              {(evaluateResult?.gaps || []).map((gap, index) => (
                <div className={styles.evaluateDetailsItemContent} key={index}>
                  {gap.content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {(isPipeline || talent?.feedback) && (
        <div className={styles.cardFooter}>
          {isPipeline && job && (
            <AssignedRecruiters
              jobInvitationToken={job.invitation_token}
              talentId={talent.id}
              talentRecruiters={talent.talent_recruiters}
              jobCollaborators={job.collaborators}
              popoverContainerRef={cardRef}
              onUpdate={(talentRecruiters) => {
                setTalent((prev) => ({
                  ...prev,
                  talent_recruiters: talentRecruiters,
                }));
                if (mode === "table") {
                  onUpdateTalent();
                }
              }}
            />
          )}
          {talent?.feedback && (
            <div
              className={classnames(styles.cardFooterFeedback, {
                [styles.cardFooterFeedbackWithAssignedRecruiters]: isPipeline,
              })}
            >
              <span>{t("feedback")}:</span> {talent.feedback}
            </div>
          )}
        </div>
      )}

      <TalentEvaluateFeedbackWithReasonModal
        jobId={talent.job!.invitation_token}
        talentId={talent.id ?? 0}
        candidateName={talent.name}
        evaluateResult={evaluateResult}
        open={isRejectModalOpen}
        successMessage="Application Rejected"
        onOk={({ startCalibration }) => {
          setIsRejectModalOpen(false);
          setTalent((prev) => ({ ...prev, status: "rejected" }));
          onUpdateTalent();
          if (startCalibration) {
            startCalibrationConversation("reject_calibration", false);
          }
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
    </div>
  );
};

export default TalentPopoverContent;
