import { Post } from "@/utils/request";
import { Button, Modal, message } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "../style.module.less";

type TPeriodicReportType = "weekly" | "monthly";

const AdminTools = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [periodicReportLoadingType, setPeriodicReportLoadingType] =
    useState<TPeriodicReportType | null>(null);

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

  const handleRunPeriodicStatsReport = async (type: TPeriodicReportType) => {
    setPeriodicReportLoadingType(type);
    try {
      const res = await Post("/api/admin/periodic_stats_reports/run", { type });
      if (res.code === 0) {
        message.success(
          type === "weekly"
            ? t("admin_tools.run_weekly_report_success")
            : t("admin_tools.run_monthly_report_success")
        );
        return;
      }

      message.error(
        type === "weekly"
          ? t("admin_tools.run_weekly_report_failed")
          : t("admin_tools.run_monthly_report_failed")
      );
    } catch (error) {
      message.error(
        type === "weekly"
          ? t("admin_tools.run_weekly_report_failed")
          : t("admin_tools.run_monthly_report_failed")
      );
    } finally {
      setPeriodicReportLoadingType(null);
    }
  };

  const handleConfirmRunPeriodicStatsReport = (type: TPeriodicReportType) => {
    Modal.confirm({
      title:
        type === "weekly"
          ? t("admin_tools.confirm_weekly_report_title")
          : t("admin_tools.confirm_monthly_report_title"),
      content:
        type === "weekly"
          ? t("admin_tools.confirm_weekly_report_content")
          : t("admin_tools.confirm_monthly_report_content"),
      okText: t("confirm"),
      cancelText: t("cancel"),
      onOk: () => handleRunPeriodicStatsReport(type),
    });
  };

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPageHeader}>{t("admin_tools.page_title")}</div>
      <div className={styles.adminMain}>
        <div className={styles.toolsActionGroup}>
          <Button
            type="primary"
            loading={loading}
            onClick={handleConfirmRunJobApplyReminders}
          >
            {t("admin_tools.run_reminder_button")}
          </Button>
          <Button
            type="primary"
            loading={periodicReportLoadingType === "weekly"}
            onClick={() => handleConfirmRunPeriodicStatsReport("weekly")}
          >
            {t("admin_tools.run_weekly_report_button")}
          </Button>
          <Button
            type="primary"
            loading={periodicReportLoadingType === "monthly"}
            onClick={() => handleConfirmRunPeriodicStatsReport("monthly")}
          >
            {t("admin_tools.run_monthly_report_button")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminTools;
