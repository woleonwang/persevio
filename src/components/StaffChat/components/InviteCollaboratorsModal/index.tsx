import { useEffect, useState } from "react";
import { Button, Modal, message } from "antd";
import { useTranslation } from "react-i18next";

import { Get, Post } from "@/utils/request";
import { copy } from "@/utils";
import Icon from "@/components/Icon";
import Close from "@/assets/icons/close";
import Refresh from "@/assets/icons/refresh";

import styles from "./style.module.less";

type IProps = {
  open: boolean;
  jobId: string | number;
  onCancel: () => void;
};

const InviteCollaboratorsModal = (props: IProps) => {
  const { open, jobId, onCancel } = props;
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`chat.invite_collaborators.${key}`);

  const [groupChatUuid, setGroupChatUuid] = useState("");

  const inviteUrl = groupChatUuid
    ? `${window.origin}/app/jobs/group-chat/${groupChatUuid}`
    : "";

  const fetchUuid = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}`);
    if (code === 0) {
      const job: IJob = data.job ?? data;
      setGroupChatUuid(job.group_chat_uuid || "");
    } else {
      message.error(originalT("get_job_failed"));
    }
  };

  useEffect(() => {
    if (open) {
      fetchUuid();
    }
  }, [open, jobId]);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await copy(inviteUrl);
    message.success(t("copied"));
  };

  const handleRefresh = async () => {
    const { code, data } = await Post(
      `/api/jobs/${jobId}/refresh_group_chat_uuid`,
      {},
    );
    if (code === 0) {
      setGroupChatUuid(data.group_chat_uuid);
      message.success(t("refreshed"));
    } else {
      message.error(t("refresh_failed"));
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={false}
      destroyOnClose
      width={740}
      centered
      className={styles.modal}
      styles={{
        body: { padding: 0 },
      }}
    >
      <div className={styles.modalInner}>
        <header className={styles.header}>
          <h2 className={styles.title}>{t("title")}</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onCancel}
            aria-label={originalT("close")}
          >
            <Icon icon={<Close />} style={{ fontSize: 20 }} />
          </button>
        </header>

        <div className={styles.body}>
          <p className={styles.description}>{t("hint")}</p>
          <div className={styles.linkField}>
            <span className={styles.linkValue} title={inviteUrl}>
              {inviteUrl}
            </span>
            <span className={styles.linkDivider} aria-hidden />
            <Button
              className={styles.copyBtn}
              onClick={handleCopy}
              disabled={!inviteUrl}
            >
              {t("copy_link")}
            </Button>
          </div>
        </div>

        <footer className={styles.footer}>
          <Button className={styles.refreshBtn} onClick={handleRefresh}>
            <Icon
              icon={<Refresh />}
              className={styles.refreshIcon}
              style={{ fontSize: 20 }}
            />
            <span>{t("refresh_link")}</span>
          </Button>
          <Button className={styles.doneBtn} onClick={onCancel}>
            {t("done")}
          </Button>
        </footer>
      </div>
    </Modal>
  );
};

export default InviteCollaboratorsModal;
