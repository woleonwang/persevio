import React, { useEffect, useState } from "react";
import { Button, message, Spin, Tag, Drawer } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import useTalent from "@/hooks/useTalent";
import { Download, Get, Post } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import { backOrDirect, parseJSON } from "@/utils";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import classnames from "classnames";
import globalStore from "@/store/global";
import { observer } from "mobx-react-lite";
import DownloadIcon from "@/assets/icons/download";

import styles from "./style.module.less";
import usePublicJob from "@/hooks/usePublicJob";
import ChatMessagePreview from "../ChatMessagePreview";
import Tabs from "../Tabs";
import Icon from "../Icon";

interface IProps {
  isPreview?: boolean;
}

const NewTalentDetail: React.FC<IProps> = (props) => {
  const { job } = usePublicJob();
  const { talent, fetchTalent } = useTalent();
  const { t: originalT, i18n } = useTranslation();

  const [tabKey, setTabKey] = useState<"resume" | "report">("resume");
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

  const basicInfo = parseJSON(talent.basic_info_json);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {!isPreview && (
          <ArrowLeftOutlined
            style={{
              fontSize: 20,
              cursor: "pointer",
            }}
            className={styles.desktopVisible}
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
      <div className={classnames(styles.main, styles.desktopVisible)}>
        <div className={styles.resumeContainer}>
          <div className={styles.statusContainer}>
            {talent?.status === "accepted" ? (
              <Tag color="green">{t("status_accepted")}</Tag>
            ) : talent?.status === "rejected" ? (
              <Tag color="red">{t("status_rejected")}</Tag>
            ) : (
              <>
                <Button
                  variant="outlined"
                  color="danger"
                  onClick={() => updateTalentStatus("reject")}
                  style={{ flex: "auto" }}
                  size="large"
                >
                  {t("action_reject")}
                </Button>
                <Button
                  type="primary"
                  onClick={() => updateTalentStatus("accept")}
                  style={{ flex: "auto" }}
                  size="large"
                >
                  {t("action_accept")}
                </Button>
              </>
            )}
          </div>
          <div className={styles.basicInfoContainer}>
            <div>
              <div className={styles.jobTitle}>
                {basicInfo.current_job_title}
              </div>
              <div className={styles.companyName}>
                {basicInfo.current_company}
              </div>
            </div>
            <Button type="primary" onClick={downloadTalentResume} size="large">
              {t("download_resume")}
            </Button>
          </div>
          <div className={styles.markdownContainer}>
            <MarkdownContainer content={talent.parsed_content || ""} />
          </div>
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
            <div className={styles.reportContainer}>
              <MarkdownContainer content={talent.raw_evaluate_result} />
            </div>
          </div>
        ) : null}
      </div>
      <div className={classnames(styles.mobileVisible, styles.main)}>
        <div className={styles.tabsContainer}>
          <Tabs
            tabs={[
              {
                key: "resume",
                label: t("tab_resume"),
              },
              {
                key: "report",
                label: t("tab_report"),
              },
            ]}
            activeKey={tabKey}
            onChange={(key) => setTabKey(key as "resume" | "report")}
          />
        </div>
        {tabKey === "resume" && (
          <div className={styles.resumeContainer}>
            <div className={styles.basicInfoContainer}>
              <div>
                <div className={styles.jobTitle}>
                  {basicInfo.current_job_title}
                </div>
                <div className={styles.companyName}>
                  {basicInfo.current_company}
                </div>
              </div>
              <Button
                type="primary"
                onClick={downloadTalentResume}
                size="large"
                className={styles.desktopVisible}
              >
                {t("download_resume")}
              </Button>
              <Icon
                icon={<DownloadIcon />}
                onClick={downloadTalentResume}
                className={classnames(
                  styles.mobileVisible,
                  styles.downloadIcon
                )}
              />
            </div>
            <div className={styles.markdownContainer}>
              <MarkdownContainer content={talent.parsed_content || ""} />
            </div>
          </div>
        )}
        {tabKey === "report" &&
          (!talent.evaluate_result.evaluation_summary &&
          talent.raw_evaluate_result ? (
            <div className={styles.evaluateResultContainer}>
              <div className={styles.evaluateResultTitle}>
                {t("candidate_evaluation_report")}
              </div>
              <div>
                <Button
                  type="primary"
                  onClick={() => setIsAIInterviewRecordDrawerOpen(true)}
                  className={styles.interviewRecordButton}
                >
                  {t("ai_interview_record")}
                </Button>
              </div>
              <div className={styles.reportContainer}>
                <MarkdownContainer content={talent.raw_evaluate_result} />
              </div>
            </div>
          ) : (
            <div>{t("no_report")}</div>
          ))}
        <div className={styles.statusContainer}>
          {talent?.status === "accepted" ? (
            <Tag color="green">{t("status_accepted")}</Tag>
          ) : talent?.status === "rejected" ? (
            <Tag color="red">{t("status_rejected")}</Tag>
          ) : (
            <>
              <Button
                variant="outlined"
                color="danger"
                onClick={() => updateTalentStatus("reject")}
                style={{ flex: "auto" }}
                size="large"
              >
                {t("action_reject")}
              </Button>
              <Button
                type="primary"
                onClick={() => updateTalentStatus("accept")}
                style={{ flex: "auto" }}
                size="large"
              >
                {t("action_accept")}
              </Button>
            </>
          )}
        </div>
      </div>
      <Drawer
        open={isAIInterviewRecordDrawerOpen}
        onClose={() => setIsAIInterviewRecordDrawerOpen(false)}
        width={1000}
        destroyOnClose
      >
        <div>
          <ChatMessagePreview
            messages={talentChatMessages ?? []}
            talent={talent}
          />
        </div>
      </Drawer>
    </div>
  );
};

export default observer(NewTalentDetail);
