import { message, notification } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import StaffChat from "@/components/StaffChat";
import { Get, Post } from "@/utils/request";

import styles from "./style.module.less";

async function resolveJrdEditConversationId(
  jobId: string | number,
): Promise<number | null> {
  const incompleteRes = await Get(
    `/api/jobs/${jobId}/jrd-edit-conversations/incomplete`,
  );
  if (incompleteRes.code === 0 && incompleteRes.data?.id) {
    return incompleteRes.data.id as number;
  }
  const createRes = await Post(`/api/jobs/${jobId}/jrd-edit-conversations`, {});
  if (createRes.code === 0 && createRes.data?.id) {
    return createRes.data.id as number;
  }

  return null;
}

interface IProps {
  open: boolean;
  jobId: string | number;
  onClose: () => void;
}

const JobJrdEditVionaNotifier = (props: IProps) => {
  const { open, jobId, onClose } = props;
  const [notificationApi, contextHolder] = notification.useNotification();
  const [conversationId, setConversationId] = useState<number | null>(null);

  const { t: originalT } = useTranslation();

  useEffect(() => {
    if (!open) {
      notificationApi.destroy();
      setConversationId(null);
      return;
    }

    (async () => {
      const id = await resolveJrdEditConversationId(jobId);
      if (id) {
        setConversationId(id);
      } else {
        message.error(originalT("job_details.jrd_edit_chat_failed"));
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open || conversationId == null) {
      return;
    }

    notificationApi.destroy();
    notificationApi.open({
      message: originalT("job_details.refining_job_requirements"),
      description: (
        <div className={styles.chatWrap}>
          <StaffChat
            chatType="jobJrdEdit"
            jobId={jobId}
            jrdEditConversationId={conversationId}
            hidePredefinedButtons
            hideRetry
          />
        </div>
      ),
      icon: null,
      duration: null,
      placement: "bottomRight",
      style: {
        width: 900,
      },
      onClose: () => {
        onClose();
      },
    });

    return () => {
      notificationApi.destroy();
    };
  }, [conversationId]);

  return <>{contextHolder}</>;
};

export default JobJrdEditVionaNotifier;
