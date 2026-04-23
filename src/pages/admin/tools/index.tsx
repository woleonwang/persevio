import { Post } from "@/utils/request";
import { Button, Modal, message } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "../style.module.less";

const AdminTools = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleRunJobApplyReminders = async () => {
    setLoading(true);
    try {
      const res = await Post("/api/admin/job_apply_reminders/run");
      if (res.code === 0) {
        message.success(t("admin_tools.run_reminder_success"));
        return;
      }

      message.error(t("admin_tools.run_reminder_failed"));
    } catch (error) {
      message.error(t("admin_tools.run_reminder_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRunJobApplyReminders = () => {
    Modal.confirm({
      title: t("admin_tools.confirm_title"),
      content: t("admin_tools.confirm_content"),
      okText: t("confirm"),
      cancelText: t("cancel"),
      onOk: handleRunJobApplyReminders,
    });
  };

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPageHeader}>{t("admin_tools.page_title")}</div>
      <div className={styles.adminMain}>
        <Button
          type="primary"
          loading={loading}
          onClick={handleConfirmRunJobApplyReminders}
        >
          {t("admin_tools.run_reminder_button")}
        </Button>
      </div>
    </div>
  );
};

export default AdminTools;
