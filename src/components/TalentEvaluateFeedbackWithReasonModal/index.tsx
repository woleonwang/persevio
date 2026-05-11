import { Button, message, Modal } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import classnames from "classnames";

import TextAreaWithVoice from "../TextAreaWithVoice";

import styles from "./style.module.less";

import { Post } from "@/utils/request";

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

interface IProps {
  jobId: string | number;
  talentId: number;
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
}

const TalentEvaluateFeedbackWithReasonModal = (props: IProps) => {
  const { jobId, talentId, open, onCancel, onOk } = props;
  const { t } = useTranslation();
  const tDetail = (key: string) => t(`talent_details.${key}`);

  const [rejectReasonType, setRejectReasonType] = useState<
    TTalentRejectReasonType | undefined
  >();
  const [evaluateFeedbackReason, setEvaluateFeedbackReason] =
    useState<string>("");

  useEffect(() => {
    if (open) {
      setRejectReasonType(undefined);
      setEvaluateFeedbackReason("");
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={async () => {
        if (!rejectReasonType) return;

        const { code } = await Post(`/api/jobs/${jobId}/talents/${talentId}`, {
          status: "rejected",
          feedback: evaluateFeedbackReason,
          reject_reason_type: rejectReasonType,
        });

        if (code === 0) {
          message.success(tDetail("update_success"));
          onOk();
        } else {
          message.error(tDetail("reject_submit_failed"));
        }
      }}
      title={tDetail("reject_candidate_title")}
      width={800}
      centered
      okButtonProps={{
        disabled: !rejectReasonType,
      }}
      okText={tDetail("action_reject")}
      cancelButtonProps={{
        style: {
          display: "none",
        },
      }}
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
      <div className={styles.evaluateFeedbackReason}>
        {tDetail("reject_feedback_prompt")}
      </div>
      <TextAreaWithVoice
        value={evaluateFeedbackReason}
        onChange={setEvaluateFeedbackReason}
        placeholder={tDetail("reject_feedback_placeholder")}
      />
    </Modal>
  );
};

export default TalentEvaluateFeedbackWithReasonModal;
