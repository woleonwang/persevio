import { Button, message, Modal } from "antd";
import { useEffect, useState } from "react";
import classnames from "classnames";

import TextAreaWithVoice from "../TextAreaWithVoice";
import Icon from "../Icon";
import GoodFitOutlined from "@/assets/icons/good-fit-outlined";

import styles from "./style.module.less";
import SlightlyOffOutline from "@/assets/icons/slightly-off-outline";
import InaccurateOutline from "@/assets/icons/inaccurate-outline";

import { Post } from "@/utils/request";

interface IProps {
  jobId: number;
  talentId: number;
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
}

type TEvaluateFeedback = "accurate" | "slightly_inaccurate" | "inaccurate";
const TalentEvaluateFeedbackWithReasonModal = (props: IProps) => {
  const { jobId, talentId, open, onCancel, onOk } = props;

  const [evaluateFeedback, setEvaluateFeedback] = useState<TEvaluateFeedback>();
  const [evaluateFeedbackReason, setEvaluateFeedbackReason] =
    useState<string>("");

  useEffect(() => {
    if (open) {
      setEvaluateFeedback(undefined);
      setEvaluateFeedbackReason("");
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={async () => {
        if (evaluateFeedback) {
          const { code } = await Post(
            `/api/jobs/${jobId}/talents/${talentId}`,
            {
              status: "rejected",
              feedback: evaluateFeedbackReason,
            }
          );

          if (code === 0) {
            const { code } = await Post(
              `/api/jobs/${jobId}/talents/${talentId}/evaluate_feedback`,
              {
                evaluate_feedback: evaluateFeedback,
                evaluate_feedback_reason: evaluateFeedbackReason,
              }
            );

            if (code === 0) {
              onOk();
              message.success("Submit success");
            } else {
              message.error("Submit failed");
            }
          } else {
            message.error("Submit failed");
          }
        }
      }}
      title="Reject Candidate"
      width={800}
      centered
      okButtonProps={{
        disabled: !evaluateFeedback,
      }}
      okText="NEXT"
      cancelButtonProps={{
        style: {
          display: "none",
        },
      }}
    >
      <div>
        <div className={styles.evaluateFeedbackTitle}>
          <span>*</span>In order to recommend more suitable candidates for you
          going forward, could you kindly confirm whether the referral report
          for Viona this time is accurate?
        </div>
        <div className={styles.evaluateFeedback}>
          {(
            [
              "accurate",
              "slightly_inaccurate",
              "inaccurate",
            ] as TEvaluateFeedback[]
          ).map((item) => {
            const isActive = evaluateFeedback === item;
            const textMapping = {
              accurate: "Accurate",
              slightly_inaccurate: "Slightly Off",
              inaccurate: "Inaccurate",
            };
            const icon =
              item === "accurate" ? (
                <GoodFitOutlined />
              ) : item === "slightly_inaccurate" ? (
                <SlightlyOffOutline />
              ) : (
                <InaccurateOutline />
              );
            return (
              <Button
                key={item}
                className={styles.evaluateFeedbackItem}
                onClick={() => setEvaluateFeedback(item)}
                variant="outlined"
                color={isActive ? "primary" : "default"}
              >
                <Icon
                  icon={icon}
                  className={classnames(styles[item], styles.icon, {
                    [styles.active]: isActive,
                  })}
                />
                <span>{textMapping[item as keyof typeof textMapping]}</span>
              </Button>
            );
          })}
        </div>
      </div>
      <div className={styles.evaluateFeedbackReason}>
        What should we know to better source/screen candidates for this role?
      </div>
      <TextAreaWithVoice
        value={evaluateFeedbackReason}
        onChange={setEvaluateFeedbackReason}
        placeholder="For example, our assessment is not accurate/the role is evolved and you'd like to adjust or update the job requirements/ or anything at all."
      />
    </Modal>
  );
};

export default TalentEvaluateFeedbackWithReasonModal;
