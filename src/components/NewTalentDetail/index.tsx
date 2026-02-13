import React, { useEffect, useRef, useState } from "react";
import { Button, message, Spin, Tag, Drawer, Modal } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import useTalent from "@/hooks/useTalent";
import { Download, Get, Post } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import { backOrDirect, downloadMarkdownAsPDF, parseJSON } from "@/utils";
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
import Report from "./components/Report";
import Resume from "./components/Resume";
import { TTalentResume } from "./type";
import TalentEvaluateFeedbackWithReasonModal from "../TalentEvaluateFeedbackWithReasonModal";
import TalentEvaluateFeedbackModal from "../TalentEvaluateFeedbackModal";
import EvaluateFeedbackConversation from "../EvaluateFeedbackConversation";

interface IProps {
  isPreview?: boolean;
}
const NewTalentDetail: React.FC<IProps> = (props) => {
  const { job } = usePublicJob();
  const { talent, interviews, fetchTalent } = useTalent();
  const { t: originalT, i18n } = useTranslation();

  const [tabKey, setTabKey] = useState<"resume" | "report">("resume");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const t = (key: string) => originalT(`talent_details.${key}`);
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const { isPreview } = props;

  const [isAIInterviewRecordDrawerOpen, setIsAIInterviewRecordDrawerOpen] =
    useState(false);
  const [talentChatMessages, setTalentChatMessages] = useState<
    TMessageFromApi[]
  >([]);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);

  const [openEvaluateFeedbackReason, setOpenEvaluateFeedbackReason] =
    useState<boolean>(false);
  const [
    openEvaluateFeedbackConversation,
    setOpenEvaluateFeedbackConversation,
  ] = useState<boolean>(false);
  const [
    needConfirmEvaluateFeedbackConversation,
    setNeedConfirmEvaluateFeedbackConversation,
  ] = useState<boolean>(false);

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
  const updateTalentStatus = async (feedback?: string) => {
    const { code } = await Post(`/api/jobs/${job?.id}/talents/${talent?.id}`, {
      status: "rejected",
      feedback,
    });

    if (code === 0) {
      fetchTalent();
      setIsRejectModalOpen(false);
      message.success(t("update_success"));
    }
  };

  const updateTalentEvaluateFeedback = async (feedback: TEvaluateFeedback) => {
    setOpenEvaluateFeedbackReason(true);

    const { code } = await Post(
      `/api/jobs/${job?.id}/talents/${talent?.id}/evaluate_feedback`,
      {
        evaluate_feedback: feedback,
      }
    );

    if (code === 0) {
      fetchTalent();
    }
  };
  const updateTalentEvaluateFeedbackReason = async (reason: string) => {
    if (talent) {
      const { code } = await Post(
        `/api/jobs/${talent?.job_id}/talents/${talent?.id}/evaluate_feedback`,
        {
          evaluate_feedback_reason: reason,
        }
      );

      if (code === 0) {
        fetchTalent();
        setOpenEvaluateFeedbackConversation(true);
        setNeedConfirmEvaluateFeedbackConversation(true);
        message.success("Update success");
      }
    }
  };

  if (!job || !talent) {
    return <Spin />;
  }

  const report = parseJSON(talent.evaluate_json);

  const interviewButtonArea =
    interviews.length === 0 ? (
      <Button
        type="primary"
        onClick={() => setIsInterviewModalOpen(true)}
        size="large"
        block
      >
        {t("schedule_interview")}
      </Button>
    ) : interviews[0].mode === "written" || interviews[0].scheduled_at ? (
      <Button size="large" block onClick={() => setIsInterviewModalOpen(true)}>
        {t("interview_scheduled")}
      </Button>
    ) : (
      <Button size="large" block onClick={() => setIsInterviewModalOpen(true)}>
        {t("awaiting_candidate_confirm")}
      </Button>
    );

  const resumeDetail: TTalentResume | null = talent.resume_detail_json
    ? parseJSON(talent.resume_detail_json)
    : null;

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
                `/app/jobs/${job.id}/standard-board?tab=talents`
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
            {talent?.status === "rejected" ? (
              <Tag color="red">{t("status_rejected")}</Tag>
            ) : (
              <div style={{ display: "flex", gap: 12, flex: "auto" }}>
                {interviewButtonArea}
                {interviews?.length === 0 && (
                  <Button
                    danger
                    type="primary"
                    onClick={() => {
                      if (!talent) return;

                      if (!!talent.evaluate_feedback) {
                        updateTalentStatus();
                      } else {
                        setIsRejectModalOpen(true);
                      }
                    }}
                    style={{ flex: "auto" }}
                    size="large"
                  >
                    {t("action_reject")}
                  </Button>
                )}
              </div>
            )}
            <Button
              icon={<Icon icon={<DownloadIcon />} style={{ fontSize: 18 }} />}
              variant="outlined"
              color="primary"
              onClick={downloadTalentResume}
              size="large"
            />
          </div>
          <div className={styles.markdownContainer}>
            {!!resumeDetail?.contact_information ? (
              <Resume resume={resumeDetail as TTalentResume} />
            ) : (
              <MarkdownContainer content={talent.parsed_content || ""} />
            )}
          </div>
        </div>
        {!talent.evaluate_result.evaluation_summary &&
        talent.raw_evaluate_result ? (
          <div className={styles.evaluateResultContainer}>
            <div className={styles.evaluateResultTitle}>
              {t("candidate_evaluation_report")}
              <div className={styles.evaluateResultTitleButtons}>
                {(talentChatMessages ?? []).length > 0 && (
                  <Button
                    type="primary"
                    onClick={() => setIsAIInterviewRecordDrawerOpen(true)}
                    style={{ height: 40 }}
                  >
                    {t("ai_interview_record")}
                  </Button>
                )}
                <Button
                  icon={
                    <Icon icon={<DownloadIcon />} style={{ fontSize: 18 }} />
                  }
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    if (!reportContainerRef.current) {
                      return;
                    }

                    downloadMarkdownAsPDF({
                      name: `${talent.name}_${t(
                        "candidate_evaluation_report"
                      )}`,
                      element: reportContainerRef.current,
                    });
                  }}
                  style={{ width: 40, height: 40 }}
                />
              </div>
            </div>

            {!!report.result ? (
              <div
                ref={reportContainerRef}
                className={styles.newReportContainer}
              >
                <Report
                  candidateName={talent.name}
                  jobName={job.name}
                  report={report}
                  evaluateFeedback={talent.evaluate_feedback}
                  onChangeEvaluateFeedback={(value) => {
                    updateTalentEvaluateFeedback(value);
                  }}
                  onOpenEvaluateFeedback={() => {
                    setNeedConfirmEvaluateFeedbackConversation(false);
                    setOpenEvaluateFeedbackConversation(true);
                  }}
                />
              </div>
            ) : (
              <div className={styles.reportContainer} ref={reportContainerRef}>
                <MarkdownContainer content={talent.raw_evaluate_result} />
              </div>
            )}
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
            <div className={styles.markdownContainer}>
              {!!resumeDetail?.contact_information ? (
                <Resume resume={resumeDetail} />
              ) : (
                <MarkdownContainer content={talent.parsed_content || ""} />
              )}
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
              {!!report.result ? (
                <div ref={reportContainerRef} style={{ marginTop: 12 }}>
                  <Report
                    candidateName={talent.name}
                    jobName={job.name}
                    report={report}
                    evaluateFeedback={talent.evaluate_feedback}
                    onChangeEvaluateFeedback={(value) => {
                      updateTalentEvaluateFeedback(value);
                    }}
                    onOpenEvaluateFeedback={() => {
                      setNeedConfirmEvaluateFeedbackConversation(false);
                      setOpenEvaluateFeedbackConversation(true);
                    }}
                  />
                </div>
              ) : (
                <div
                  ref={reportContainerRef}
                  className={styles.reportContainer}
                >
                  <MarkdownContainer content={talent.raw_evaluate_result} />
                </div>
              )}
            </div>
          ) : (
            <div>{t("no_report")}</div>
          ))}
        <div className={styles.statusContainer}>
          {talent?.status === "rejected" ? (
            <Tag color="red">{t("status_rejected")}</Tag>
          ) : (
            <>
              {interviewButtonArea}
              <Button
                danger
                type="primary"
                color="danger"
                onClick={() => {
                  if (!!talent?.evaluate_feedback) {
                    updateTalentStatus();
                  } else {
                    setIsRejectModalOpen(true);
                  }
                }}
                style={{ flex: "auto" }}
                size="large"
              >
                {t("action_reject")}
              </Button>
              <Button
                icon={<Icon icon={<DownloadIcon />} style={{ fontSize: 18 }} />}
                variant="outlined"
                color="primary"
                onClick={downloadTalentResume}
                className={classnames(styles.downloadIcon)}
                size="large"
                style={{ flex: "none" }}
              />
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
        footer={null}
      >
        <InterviewForm
          talent={talent}
          jobName={job.name}
          interview={interviews[0]}
          onClose={() => setIsInterviewModalOpen(false)}
          onSubmit={() => {
            if (!!interviews[0]) {
              setIsInterviewModalOpen(false);
            } else {
              fetchTalent();
              setIsInterviewModalOpen(false);
            }
          }}
        />
      </Modal>

      {!!talent && (
        <TalentEvaluateFeedbackWithReasonModal
          jobId={talent?.job_id ?? 0}
          talentId={talent?.id ?? 0}
          open={isRejectModalOpen}
          onOk={() => {
            setIsRejectModalOpen(false);
            setNeedConfirmEvaluateFeedbackConversation(true);
            setOpenEvaluateFeedbackConversation(true);
            fetchTalent();
          }}
          onCancel={() => setIsRejectModalOpen(false)}
        />
      )}

      <TalentEvaluateFeedbackModal
        open={openEvaluateFeedbackReason}
        onOk={(value) => {
          updateTalentEvaluateFeedbackReason(value);
          setOpenEvaluateFeedbackReason(false);
        }}
        onCancel={() => setOpenEvaluateFeedbackReason(false)}
      />

      {!!talent && (
        <EvaluateFeedbackConversation
          open={openEvaluateFeedbackConversation}
          jobId={talent?.job_id ?? 0}
          talentId={talent?.id ?? 0}
          needConfirm={needConfirmEvaluateFeedbackConversation}
          onCancel={() => setOpenEvaluateFeedbackConversation(false)}
        />
      )}
    </div>
  );
};

export default observer(NewTalentDetail);
