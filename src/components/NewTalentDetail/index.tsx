import React, { useEffect, useRef, useState } from "react";
import { Button, message, Spin, Tag, Drawer, Modal, Form } from "antd";
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
import InterviewForm from "./components/InterviewForm";
import TextAreaWithVoice from "../TextAreaWithVoice";

interface IProps {
  isPreview?: boolean;
}

const NewTalentDetail: React.FC<IProps> = (props) => {
  const { job } = usePublicJob();
  const { talent, interviews, fetchTalent } = useTalent();
  const { t: originalT, i18n } = useTranslation();

  const [tabKey, setTabKey] = useState<"resume" | "report">("resume");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [form] = Form.useForm<{ reason: string }>();
  const t = (key: string) => originalT(`talent_details.${key}`);

  const { isPreview } = props;

  const [isAIInterviewRecordDrawerOpen, setIsAIInterviewRecordDrawerOpen] =
    useState(false);
  const [talentChatMessages, setTalentChatMessages] = useState<
    TMessageFromApi[]
  >([]);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);

  const handlerRef = useRef<{ submit?: () => Promise<boolean> }>({});

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
  const updateTalentStatus = async (
    action: "accept" | "reject",
    feedback?: string
  ) => {
    if (action === "reject" || confirm(t("confirm_accept"))) {
      const { code } = await Post(
        `/api/jobs/${job?.id}/talents/${talent?.id}`,
        {
          status: action === "accept" ? "accepted" : "rejected",
          feedback,
        }
      );

      if (code === 0) {
        fetchTalent();
        setIsRejectModalOpen(false);
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
              interviews.length === 0 ? (
                <Button
                  type="primary"
                  onClick={() => setIsInterviewModalOpen(true)}
                  size="large"
                  block
                >
                  {t("schedule_interview")}
                </Button>
              ) : interviews[0].scheduled_at ? (
                <Button
                  size="large"
                  block
                  onClick={() => setIsInterviewModalOpen(true)}
                >
                  {t("interview_scheduled")}
                </Button>
              ) : (
                <Button
                  size="large"
                  block
                  onClick={() => setIsInterviewModalOpen(true)}
                >
                  {t("awaiting_candidate_confirm")}
                </Button>
              )
            ) : talent?.status === "rejected" ? (
              <Tag color="red">{t("status_rejected")}</Tag>
            ) : (
              <>
                <Button
                  variant="outlined"
                  color="danger"
                  onClick={() => {
                    form.resetFields();
                    setIsRejectModalOpen(true);
                  }}
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
                onClick={() => {
                  form.resetFields();
                  setIsRejectModalOpen(true);
                }}
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

      <Modal
        open={isInterviewModalOpen}
        onCancel={() => setIsInterviewModalOpen(false)}
        width={"fit-content"}
        centered
        title={t("schedule_interview")}
        onOk={() =>
          !!interviews[0]
            ? setIsInterviewModalOpen(false)
            : handlerRef.current?.submit?.()
        }
        cancelButtonProps={{
          style: interviews[0]
            ? {
                display: "none",
              }
            : undefined,
        }}
      >
        <InterviewForm
          talent={talent}
          jobName={job.name}
          handlerRef={handlerRef}
          interview={interviews[0]}
        />
      </Modal>

      <Modal
        open={isRejectModalOpen}
        onCancel={() => setIsRejectModalOpen(false)}
        onOk={() => {
          form.validateFields().then((values) => {
            updateTalentStatus("reject", values.reason);
          });
        }}
        title={t("reject_candidate_title")}
        width={600}
        centered
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="reason"
            label={t("reject_reason_label")}
            rules={[{ required: true, message: t("reject_reason_required") }]}
          >
            <TextAreaWithVoice />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default observer(NewTalentDetail);
