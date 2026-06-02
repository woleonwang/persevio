import { Modal, notification } from "antd";
import { useEffect, useState } from "react";
import VionaVideo from "@/assets/banner-video.mp4";
import Details from "./components/Details";
import { Post } from "@/utils/request";

import styles from "./style.module.less";

interface IProps {
  open: boolean;
  jobId: string | number;
  talentId: number;
  onCancel: () => void;
  needConfirm?: boolean;
  source?: "reject_calibration" | "evaluate_feedback";
}
const EvaluateFeedbackConversation = (props: IProps) => {
  const {
    open,
    jobId,
    talentId,
    onCancel,
    needConfirm,
    source = "evaluate_feedback",
  } = props;
  const [conformModalOpen, setConformModalOpen] = useState<boolean>(false);
  const [notificationApi, contextHolder] = notification.useNotification();

  useEffect(() => {
    if (open) {
      if (needConfirm) {
        logCalibrationEvent("request_calibration");
        setConformModalOpen(true);
      } else {
        openConversation();
      }
    } else {
      setConformModalOpen(false);
      notificationApi.destroy();
    }
  }, [open]);

  const logCalibrationEvent = (
    eventType: "request_calibration" | "accept_calibration",
  ) => {
    Post(`/api/jobs/${jobId}/talents/${talentId}/manual_event_logs`, {
      event_type: eventType,
      params: JSON.stringify({ source }),
    });
  };

  const openConversation = () => {
    notificationApi.destroy();
    notificationApi.open({
      message: "Refining Job Requirements",
      description: (
        <Details jobId={jobId} talentId={talentId} source={source} />
      ),
      icon: null,
      duration: null,
      placement: "bottomRight",
      style: {
        width: 900,
      },
      onClose: () => {
        onCancel();
      },
    });
  };

  return (
    <div>
      <Modal
        open={conformModalOpen}
        onCancel={onCancel}
        width={600}
        centered
        title={null}
        onOk={() => {
          setConformModalOpen(false);
          openConversation();
          logCalibrationEvent("accept_calibration");
        }}
        zIndex={10000}
        okText="Yes, start chat with Viona"
        cancelText="No, just submit feedback"
        wrapClassName={styles.evaluateFeedbackConversationModal}
        closeIcon={null}
      >
        <div>
          <div className={styles.vionaAvatarContainer}>
            <video
              src={VionaVideo}
              autoPlay
              loop
              muted
              className={styles.vionaVideo}
            />
          </div>
          <div className={styles.vionaDescription}>
            Would you be willing to have a 5-minute conversation with Viona to
            help her better understand the requirements, so that she can more
            accurately screen suitable candidates in the future?
          </div>
        </div>
      </Modal>
      {contextHolder}
    </div>
  );
};

export default EvaluateFeedbackConversation;
