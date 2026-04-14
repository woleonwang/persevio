import { message } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import JobRequirementForm from "@/components/StaffChat/components/JobRequirementForm";
import { Post } from "@/utils/request";

import styles from "./style.module.less";

type IProps = {
  jobId: number;
  onSuccess: () => void;
};

const RoleBasicsStage = ({ jobId, onSuccess }: IProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_board.${key}`);

  const handleSubmit = async (content: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const { code } = await Post(`/api/jobs/${jobId}/document`, {
      type: "basic_info",
      content,
    });
    setIsSubmitting(false);

    if (code === 0) {
      message.success(originalT("submit_succeed"));
      onSuccess();
    } else {
      message.error(originalT("submit_failed"));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>{t("role_basics_title")}</div>
        <div className={styles.hint}>{t("role_basics_hint")}</div>
      </div>
      <div className={styles.formCard}>
        <JobRequirementForm
          group="basic_info"
          jobId={jobId}
          onOk={handleSubmit}
        />
      </div>
    </div>
  );
};

export default RoleBasicsStage;
