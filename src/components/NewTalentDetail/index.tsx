import React, { useEffect, useState } from "react";
import { Button, message, Spin, Tag, Drawer } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import useTalent from "@/hooks/useTalent";
import { Download, Get, Post } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import { backOrDirect } from "@/utils";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import globalStore from "@/store/global";

import styles from "./style.module.less";
import usePublicJob from "@/hooks/usePublicJob";
import { observer } from "mobx-react-lite";
import ChatMessagePreview from "../ChatMessagePreview";

interface IProps {
  isPreview?: boolean;
}

const NewTalentDetail: React.FC<IProps> = (props) => {
  const { job } = usePublicJob();
  const { talent, fetchTalent } = useTalent();
  const { t: originalT, i18n } = useTranslation();
  const t = (key: string) => originalT(`talent_details.${key}`);

  const { isPreview } = props;

  const [isAIInterviewRecordDrawerOpen, setIsAIInterviewRecordDrawerOpen] =
    useState(false);
  const [talentChatMessages, setTalentChatMessages] = useState<
    TMessageFromApi[]
  >([]);

  const navigate = useNavigate();

  useEffect(() => {
    // 初始化
    if (job && talent) {
      if (isPreview) {
        i18n.changeLanguage(job.language);
      }

      // 刷新未读候选人状态
      globalStore.refreshUnreadTalentsCount();

      fetchTalentChatMessages();
    }
  }, [job, talent]);
  const fetchTalentChatMessages = async () => {
    if (!job || !talent) return;

    const { code, data } = await Get(
      `/api/jobs/${job.id}/talents/${talent.id}/messages`
    );
    if (code === 0) {
      setTalentChatMessages(data.messages);
    }
  };

  const downloadTalentResume = async () => {
    if (!talent) return;

    await Download(
      `/api/jobs/${job?.id}/talents/${talent?.id}/download_resume`,
      `${talent.name}_resume`
    );
  };
  const updateTalentStatus = async (action: "accept" | "reject") => {
    if (
      confirm(action === "accept" ? t("confirm_accept") : t("confirm_reject"))
    ) {
      const { code } = await Post(
        `/api/jobs/${job?.id}/talents/${talent?.id}`,
        {
          status: action === "accept" ? "accepted" : "rejected",
        }
      );

      if (code === 0) {
        fetchTalent();
        message.success(t("update_success"));
      }
    }
  };

  if (!job || !talent) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {!isPreview && (
          <ArrowLeftOutlined
            style={{
              fontSize: 20,
              cursor: "pointer",
            }}
            onClick={async () => {
              backOrDirect(
                navigate,
                `/app/jobs/${job.id}/standard-board?tab=talent`
              );
            }}
          />
        )}
        <div>
          {talent.name} - {job.name}
        </div>
      </div>
      <div className={styles.main}>
        <div className={styles.resumeContainer}>
          <div className={styles.statusContainer}>
            <div>
              {talent?.status === "accepted" ? (
                <Tag color="green">{t("status_accepted")}</Tag>
              ) : talent?.status === "rejected" ? (
                <Tag color="red">{t("status_rejected")}</Tag>
              ) : (
                <div style={{ display: "flex", gap: 12 }}>
                  <Button
                    type="primary"
                    onClick={() => updateTalentStatus("accept")}
                  >
                    {t("action_accept")}
                  </Button>
                  <Button
                    type="primary"
                    danger
                    onClick={() => updateTalentStatus("reject")}
                  >
                    {t("action_reject")}
                  </Button>
                </div>
              )}
            </div>

            <Button type="primary" onClick={downloadTalentResume}>
              {t("download_resume")}
            </Button>
          </div>
          <MarkdownContainer content={talent.parsed_content || ""} />
        </div>
        {!talent.evaluate_result.evaluation_summary &&
        talent.raw_evaluate_result ? (
          <div className={styles.evaluateResultContainer}>
            <div className={styles.evaluateResultTitle}>
              {t("candidate_evaluation_report")}
              <Button
                type="primary"
                onClick={() => setIsAIInterviewRecordDrawerOpen(true)}
              >
                {t("ai_interview_record")}
              </Button>
            </div>
            <div className={styles.markdownContainer}>
              <MarkdownContainer content={talent.raw_evaluate_result} />
            </div>
          </div>
        ) : null}
      </div>
      <Drawer
        open={isAIInterviewRecordDrawerOpen}
        onClose={() => setIsAIInterviewRecordDrawerOpen(false)}
        width={1000}
      >
        <div>
          <ChatMessagePreview messages={talentChatMessages ?? []} />
        </div>
      </Drawer>
    </div>
  );
};

export default observer(NewTalentDetail);
