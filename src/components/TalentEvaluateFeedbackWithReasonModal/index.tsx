import { Button, message, Modal } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import classnames from "classnames";
import VionaVideo from "@/assets/banner-video.mp4";

import TextAreaWithVoice from "../TextAreaWithVoice";

import styles from "./style.module.less";

import { Post } from "@/utils/request";
import { shouldOpenRejectCalibrationConversation } from "@/utils";

const REJECT_REASON_OPTIONS: {
  value: TTalentRejectReasonType;
  labelKey: string;
}[] = [
  { value: "not_shortlisted", labelKey: "reject_reason_not_shortlisted" },
  {
    value: "did_not_pass_interview",
    labelKey: "reject_reason_failed_interview",
  },
  { value: "headcount_freeze", labelKey: "reject_reason_headcount_freeze" },
  {
    value: "candidate_withdrew",
    labelKey: "reject_reason_candidate_withdrew",
  },
  { value: "other", labelKey: "reject_reason_others" },
];

const ADMINISTRATIVE_REJECT_REASONS: TTalentRejectReasonType[] = [
  "did_not_pass_interview",
  "headcount_freeze",
  "candidate_withdrew",
];

type TBatchTalentOperationResult = {
  success_count: number;
  skipped_count: number;
  failed_count: number;
};

type TRejectCandidateModalOkResult = {
  startCalibration: boolean;
};

interface IProps {
  jobId: string | number;
  talentId?: number;
  talentIds?: number[];
  candidateName?: string;
  evaluateResult?: TReport;
  open: boolean;
  onCancel: () => void;
  onOk: (result: TRejectCandidateModalOkResult) => void;
  /** 若传入则替代默认的 update_success 提示（例如拒绝成功后） */
  successMessage?: string;
}

const TalentEvaluateFeedbackWithReasonModal = (props: IProps) => {
  const {
    jobId,
    talentId,
    talentIds,
    candidateName,
    evaluateResult,
    open,
    onCancel,
    onOk,
    successMessage,
  } = props;
  const { t } = useTranslation();
  const tDetail = (key: string, options?: Record<string, unknown>) =>
    t(`talent_details.${key}`, options);

  const [rejectReasonType, setRejectReasonType] = useState<
    TTalentRejectReasonType | undefined
  >();
  const [evaluateFeedbackReason, setEvaluateFeedbackReason] =
    useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const isBatch = !!talentIds?.length;
  const calibrationEligible =
    !isBatch && shouldOpenRejectCalibrationConversation({ evaluateResult });
  const isAdministrativeReason =
    !!rejectReasonType &&
    ADMINISTRATIVE_REJECT_REASONS.includes(rejectReasonType);
  const showCalibrationUI = calibrationEligible && !isAdministrativeReason;

  useEffect(() => {
    if (open) {
      setRejectReasonType(undefined);
      setEvaluateFeedbackReason("");
      setSubmitting(false);
    }
  }, [open]);

  const isSubmitDisabled =
    !rejectReasonType ||
    (rejectReasonType === "other" && !evaluateFeedbackReason.trim());

  const modalTitle = isBatch
    ? tDetail("reject_candidates_batch_title")
    : candidateName
      ? tDetail("reject_candidate_title_with_name", { name: candidateName })
      : tDetail("reject_candidate_title");

  const textareaPlaceholder = (() => {
    if (showCalibrationUI) {
      if (rejectReasonType === "other") {
        return tDetail("reject_reason_details_placeholder");
      }
      return tDetail("reject_calibration_placeholder");
    }
    if (isBatch) {
      return tDetail("reject_batch_notes_placeholder");
    }
    return tDetail("reject_notes_placeholder");
  })();

  const showBatchRejectFeedback = (result: TBatchTalentOperationResult) => {
    const { success_count, skipped_count, failed_count } = result;

    if (skipped_count === 0 && failed_count === 0) {
      message.success(
        tDetail("batch_reject_success", { count: success_count }),
      );
      return;
    }

    const parts = [
      tDetail("batch_reject_result_rejected", { count: success_count }),
    ];
    if (skipped_count > 0) {
      parts.push(
        tDetail("batch_reject_result_skipped", { count: skipped_count }),
      );
    }
    if (failed_count > 0) {
      parts.push(
        tDetail("batch_reject_result_failed", { count: failed_count }),
      );
    }
    message.warning(parts.join(", "));
  };

  const logAcceptCalibration = () => {
    if (!talentId) return;
    Post(`/api/jobs/${jobId}/talents/${talentId}/manual_event_logs`, {
      event_type: "accept_calibration",
      params: JSON.stringify({ source: "reject_calibration" }),
    });
  };

  const submitReject = async (startCalibration: boolean) => {
    if (!rejectReasonType || isSubmitDisabled || submitting) return;

    setSubmitting(true);
    const { code, data } = isBatch
      ? await Post<TBatchTalentOperationResult>(
          `/api/jobs/${jobId}/talents/batch/reject`,
          {
            talent_ids: talentIds,
            feedback: evaluateFeedbackReason,
            reject_reason_type: rejectReasonType,
          },
        )
      : await Post(`/api/jobs/${jobId}/talents/${talentId}`, {
          status: "rejected",
          feedback: evaluateFeedbackReason,
          reject_reason_type: rejectReasonType,
        });

    setSubmitting(false);

    if (code === 0) {
      if (isBatch) {
        showBatchRejectFeedback({
          success_count: data?.success_count ?? 0,
          skipped_count: data?.skipped_count ?? 0,
          failed_count: data?.failed_count ?? 0,
        });
      } else {
        message.success(successMessage ?? tDetail("update_success"));
      }
      if (startCalibration) {
        logAcceptCalibration();
      }
      onOk({ startCalibration });
    } else {
      message.error(tDetail("reject_submit_failed"));
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={modalTitle}
      width={850}
      centered
      footer={
        <div className={styles.footer}>
          {showCalibrationUI ? (
            <>
              <Button
                disabled={isSubmitDisabled || submitting}
                loading={submitting}
                onClick={() => void submitReject(false)}
              >
                {tDetail("action_reject_only")}
              </Button>
              <Button
                type="primary"
                disabled={isSubmitDisabled || submitting}
                loading={submitting}
                onClick={() => void submitReject(true)}
              >
                {tDetail("action_reject_and_chat")}
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              disabled={isSubmitDisabled || submitting}
              loading={submitting}
              onClick={() => void submitReject(false)}
            >
              {isBatch
                ? tDetail("action_reject_all")
                : tDetail("action_reject")}
            </Button>
          )}
        </div>
      }
    >
      <div>
        <div className={styles.reasonFieldLabel}>
          <span className={styles.requiredStar} aria-hidden>
            *
          </span>
          {tDetail("reject_reason_type_label")}
        </div>
        <div
          className={styles.reasonPillsRow}
          role="radiogroup"
          aria-label={tDetail("reject_reason_type_label")}
        >
          {REJECT_REASON_OPTIONS.map(({ value, labelKey }) => {
            const selected = rejectReasonType === value;
            return (
              <Button
                key={value}
                role="radio"
                className={classnames(styles.reasonPill, {
                  [styles.selected]: selected,
                })}
                variant={selected ? "filled" : "outlined"}
                color={selected ? "primary" : "default"}
                onClick={() => setRejectReasonType(value)}
              >
                {tDetail(labelKey)}
              </Button>
            );
          })}
        </div>
      </div>

      {showCalibrationUI && (
        <>
          <div className={styles.calibrationDivider} />
          <div className={styles.vionaBlock}>
            <div className={styles.vionaAvatarContainer}>
              <video
                src={VionaVideo}
                autoPlay
                loop
                muted
                className={styles.vionaVideo}
              />
            </div>
            <div className={styles.vionaGuidance}>
              {tDetail("reject_calibration_guidance")}
            </div>
          </div>
        </>
      )}

      {!showCalibrationUI && (
        <div className={styles.fieldLabel}>
          {rejectReasonType === "other" ? (
            <>
              <span className={styles.requiredStar} aria-hidden>
                *
              </span>
              {tDetail("reject_reason_details_label")}
            </>
          ) : (
            tDetail("reject_notes_optional_label")
          )}
        </div>
      )}

      {showCalibrationUI && rejectReasonType === "other" && (
        <div className={styles.fieldLabel}>
          <span className={styles.requiredStar} aria-hidden>
            *
          </span>
          {tDetail("reject_reason_details_label")}
        </div>
      )}

      <TextAreaWithVoice
        value={evaluateFeedbackReason}
        onChange={setEvaluateFeedbackReason}
        placeholder={textareaPlaceholder}
      />
    </Modal>
  );
};

export default TalentEvaluateFeedbackWithReasonModal;
