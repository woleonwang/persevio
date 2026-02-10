import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { CheckOutlined } from "@ant-design/icons";
import { Button, Drawer, message, Modal, Spin } from "antd";
import classnames from "classnames";
import { Get, Post } from "@/utils/request";
import CandidateChat from "@/components/CandidateChat";
import {
  deleteQuery,
  getJobApplyStatus,
  getQuery,
  parseJd,
  parseJSON,
  parseJSONArray,
} from "@/utils";
import MarkdownContainer from "@/components/MarkdownContainer";
import VionaAvatar from "@/assets/viona-avatar.png";
import styles from "./style.module.less";
import CompanyLogo from "../components/CompanyLogo";
import JobChatBot from "@/components/JobChatBot";
import dayjs from "dayjs";
import Icon from "@/components/Icon";
import ArrowLeft from "@/assets/icons/arrow-left";
import WhatsappIcon from "@/assets/icons/whatsapp";
import InterviewArrangement from "./components/InterviewArrangement";
import Tabs from "@/components/Tabs";
import useCandidate from "@/hooks/useCandidate";

const JobApplyShow = () => {
  const [jobApply, setJobApply] = useState<IJobApplyListItem>();
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [whatsappModeOpen, setWhatsappModeOpen] = useState(false);
  const [interviewChatDrawerOpen, setInterviewChatDrawerOpen] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [tabKey, setTabKey] = useState<"jd" | "progress">("jd");
  const [isLoading, setIsLoading] = useState(false);

  const handlerRef = useRef<{
    submit?: () => Promise<boolean>;
  }>({});

  const applyStatus = useMemo(() => {
    return getJobApplyStatus(jobApply);
  }, [jobApply]);

  const { jobApplyId = "" } = useParams();

  const navigate = useNavigate();

  const { candidate } = useCandidate();

  const { t: originalT } = useTranslation();

  const t = (key: string, params?: Record<string, string>) =>
    originalT(`job_apply.${key}`, params);

  useEffect(() => {
    fetchApplyJob();

    const switchMode = getQuery("switch_mode");
    if (switchMode === "ai") {
      setInterviewChatDrawerOpen(true);
    }
  }, []);

  useEffect(() => {
    checkQuery();
  }, [jobApply?.id]);

  const checkQuery = async () => {
    if (jobApply?.id) {
      const autoCheck = getQuery("auto_check");
      if (autoCheck === "1") {
        deleteQuery("auto_check");
        await confirmWhatsappNumber();
      }
      const open = getQuery("open");
      if (open === "1") {
        onClickChat();
      }
    }
  };

  const fetchApplyJob = async () => {
    const { code, data } = await Get(
      `/api/candidate/job_applies/${jobApplyId}`
    );
    if (code === 0) {
      setJobApply({
        ...data.job_apply,
        jd: parseJd(data.jd),
        jdJson: parseJSON(data.jd_json),
        talentStatus: data.talent_status,
        interviews: (data.interviews ?? []).map((item: any) => {
          return {
            ...item,
            time_slots: parseJSONArray(item.time_slots),
          };
        }),
      });
    }
  };

  const onClickChat = () => {
    if (jobApply?.interview_mode === "whatsapp") {
      setWhatsappModeOpen(true);
    } else {
      setInterviewChatDrawerOpen(true);
    }
  };

  if (!jobApply) {
    return <Spin />;
  }

  const jdJson = jobApply.jdJson;

  const chatStepTitle = t("steps.chat.title_ai");
  const chatStepHint = t("steps.chat.hint_ai");
  const processedStepTitle =
    applyStatus === "accepted"
      ? t("steps.processed.accepted")
      : applyStatus === "rejected"
      ? t("steps.processed.rejected")
      : t("steps.processed.default");

  const steps: {
    key: string;
    title: string;
    hint?: string;
    status: "done" | "active" | "disabled";
  }[] = [
    {
      key: "apply",
      title: t("steps.apply.title"),
      status: "done",
    },
    {
      key: "chat",
      title: chatStepTitle,
      status: applyStatus === "chat" ? "active" : "done",
      hint: chatStepHint,
    },
    {
      key: "screening",
      title: t("steps.screening.title"),
      hint: t("steps.screening.hint"),
      status:
        applyStatus === "chat"
          ? "disabled"
          : applyStatus === "screening"
          ? "active"
          : "done",
    },
    {
      key: "processed",
      title: processedStepTitle,
      status:
        applyStatus === "interview_created" ||
        applyStatus === "interview_scheduled" ||
        applyStatus === "rejected"
          ? "done"
          : "disabled",
    },
  ];

  const interview = jobApply?.interviews?.[0];

  const confirmWhatsappNumber = async () => {
    setIsLoading(true);
    const { code } = await Post(
      `/api/candidate/job_applies/${jobApply.id}/confirm_whatsapp_number`
    );
    if (code === 0) {
      await fetchApplyJob();
    } else {
      message.success(originalT("submit_failed"));
    }
    setIsLoading(false);
  };

  if (
    applyStatus === "interview_created" ||
    applyStatus === "interview_scheduled"
  ) {
    steps.push({
      key: "interview",
      title: t("first_round_interview"),
      status: !!interview?.scheduled_at ? "done" : "active",
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Icon
          icon={<ArrowLeft />}
          style={{
            color: "rgba(53, 64, 82, 1)",
            cursor: "pointer",
            fontSize: 24,
          }}
          className={styles.desktopVisible}
          onClick={() => navigate("/candidate/jobs?tab=apply")}
        />
        <div>{t("title")}</div>
      </div>
      <div className={classnames(styles.tabsContainer, styles.mobileVisible)}>
        <Tabs
          tabs={[
            {
              key: "jd",
              label: t("jd"),
            },
            {
              key: "progress",
              label: t("progress"),
            },
          ]}
          activeKey={tabKey}
          onChange={(key) => setTabKey(key as "jd" | "progress")}
        />
      </div>
      <div className={styles.main}>
        <div
          className={classnames(styles.left, {
            [styles.desktopVisible]: tabKey !== "jd",
          })}
        >
          <div className={styles.jobApplyCard}>
            <div className={styles.basicInfo}>
              <CompanyLogo logo={jobApply.company_logo} />
              <div>
                <div className={styles.jobName}>{jobApply.job_name}</div>
                <div className={styles.tags}>
                  {jobApply.company_name} -{" "}
                  {t("posted_at", {
                    time: dayjs(jobApply.job_posted_at).format("YYYY.MM.DD"),
                  })}
                </div>
                <div className={styles.operation}>
                  <img src={VionaAvatar} style={{ width: 24, height: 24 }} />
                  <Button
                    color="primary"
                    variant="outlined"
                    style={{
                      fontWeight: "bold",
                      minHeight: "32px",
                      height: "auto",
                      whiteSpace: "normal",
                    }}
                    onClick={() => setChatDrawerOpen(true)}
                  >
                    {t("chat")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.jd}>
            {!!jdJson.company_introduction && (
              <div className={styles.jobDescriptionSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.greenBar}></div>
                  <span>{t("company_overview")}</span>
                </div>
                <div className={styles.sectionContent}>
                  <MarkdownContainer content={jdJson.company_introduction} />
                </div>
              </div>
            )}
            {!!jdJson.job_description ? (
              <>
                <div className={styles.jobDescriptionSection}>
                  <div className={styles.sectionTitle}>
                    <div className={styles.greenBar}></div>
                    <span>{t("position_overview")}</span>
                  </div>
                  <div className={styles.sectionContent}>
                    <MarkdownContainer content={jdJson.job_description} />
                  </div>
                </div>

                <div className={styles.jobDescriptionSection}>
                  <div className={styles.sectionTitle}>
                    <div className={styles.greenBar}></div>
                    <span>{t("basic_requirements")}</span>
                  </div>
                  <div className={styles.sectionContent}>
                    <MarkdownContainer content={jdJson.basic_requirements} />
                  </div>
                </div>

                <div className={styles.jobDescriptionSection}>
                  <div className={styles.sectionTitle}>
                    <div className={styles.greenBar}></div>
                    <span>{t("bonus_points")}</span>
                  </div>
                  <div className={styles.sectionContent}>
                    <MarkdownContainer content={jdJson.bonus_points} />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <MarkdownContainer content={jobApply.jd} />
              </div>
            )}
          </div>
        </div>
        <div
          className={classnames(styles.right, {
            [styles.desktopVisible]: tabKey !== "progress",
          })}
        >
          <div className={styles.rightBody}>
            <div className={styles.stepTitle}>{t("progress_title")}</div>
            <div className={styles.stepContainer}>
              {steps.map((step) => {
                return (
                  <div
                    key={step.key}
                    className={classnames(styles.step, styles[step.status])}
                  >
                    <div className={styles.dot}>
                      {step.status === "done" && <CheckOutlined />}
                    </div>
                    <div className={styles.stepContentContainer}>
                      <div className={styles.stepContent}>{step.title}</div>
                      {step.hint && (
                        <div className={styles.stepHint}>{step.hint}</div>
                      )}
                      {step.key === "chat" && (
                        <Button
                          type="primary"
                          onClick={() => onClickChat()}
                          style={{ marginTop: 20 }}
                        >
                          {t("chat_cta_label")}
                        </Button>
                      )}
                      {step.key === "interview" &&
                        (interview?.scheduled_at ? (
                          <div style={{ marginTop: 20 }}>
                            <div>
                              {t("interview_time")}:{" "}
                              {dayjs(interview.scheduled_at).format(
                                "YYYY-MM-DD HH:mm"
                              )}
                            </div>
                            <Button
                              type="primary"
                              style={{ marginTop: 12 }}
                              onClick={() => setInterviewModalOpen(true)}
                            >
                              Details
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="primary"
                            shape="round"
                            onClick={() => setInterviewModalOpen(true)}
                            style={{ marginTop: 20 }}
                          >
                            {t("respond_interview")}
                          </Button>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={chatDrawerOpen}
        width={1200}
        onClose={() => setChatDrawerOpen(false)}
        title={originalT("chat_with_viona")}
      >
        <div style={{ height: "100%", display: "flex" }}>
          <JobChatBot
            userRole="candidate"
            jobId={jobApply.job_id}
            sessionId={`${jobApply.candidate_id}`}
          />
        </div>
      </Drawer>

      <Drawer
        open={interviewChatDrawerOpen}
        width={"100vw"}
        onClose={() => setInterviewChatDrawerOpen(false)}
        title={`${t("interview")} - ${jobApply?.job_name ?? ""}`}
        destroyOnClose
      >
        <div style={{ height: "100%", display: "flex" }}>
          <CandidateChat
            chatType="job_interview"
            jobApplyId={parseInt(jobApplyId)}
            onFinish={() => {
              if (!jobApply.interview_finished_at) {
                fetchApplyJob();
                message.success(t("finish_interview_hint"));
              }
            }}
          />
        </div>
      </Drawer>

      <Modal
        title={
          jobApply?.whatsapp_number_confirmed_at
            ? originalT("apply_job.title")
            : t("whatsapp_confirm_title")
        }
        open={whatsappModeOpen}
        onCancel={() => setWhatsappModeOpen(false)}
        footer={
          <div>
            {jobApply?.whatsapp_number_confirmed_at && (
              <Button
                onClick={async () => {
                  const { code } = await Post(
                    `/api/candidate/job_applies/${jobApply?.id}/interview_mode`,
                    {
                      mode: "ai",
                    }
                  );
                  if (code === 0) {
                    setWhatsappModeOpen(false);
                    fetchApplyJob();
                  }
                }}
              >
                Chat on Website
              </Button>
            )}
            <Button
              type="primary"
              style={{ marginLeft: 12 }}
              loading={isLoading}
              onClick={async () => {
                if (jobApply?.whatsapp_number_confirmed_at) {
                  setWhatsappModeOpen(false);
                } else {
                  confirmWhatsappNumber();
                }
              }}
            >
              OK
            </Button>
          </div>
        }
        className={styles.whatsappModeModal}
        centered
        width={740}
      >
        {jobApply?.whatsapp_number_confirmed_at ? (
          <div className={styles.whatsappContainer}>
            <div className={styles.whatsappIcon}>
              <Icon icon={<WhatsappIcon />} style={{ fontSize: 90 }} />
            </div>
            <div
              style={{ maxWidth: 800, padding: "0 20px" }}
              dangerouslySetInnerHTML={{
                __html: t("whatsapp_confirmed_hint"),
              }}
            />
          </div>
        ) : (
          <div
            className={styles.whatsappModeContent}
            dangerouslySetInnerHTML={{
              __html: t("whatsapp_confirm_hint", {
                phone: candidate?.whatsapp_contact_number ?? "",
              }),
            }}
          />
        )}
      </Modal>

      <Modal
        title={t("confirm_interview_title")}
        open={interviewModalOpen}
        onCancel={() => setInterviewModalOpen(false)}
        onOk={async () => {
          if (handlerRef.current.submit) {
            const result = await handlerRef.current.submit();
            if (result) {
              setInterviewModalOpen(false);
              fetchApplyJob();
            }
          }
        }}
        width={"fit-content"}
        centered
      >
        {interview && (
          <InterviewArrangement
            interview={interview}
            jobApply={jobApply}
            handlerRef={handlerRef}
          />
        )}
      </Modal>
    </div>
  );
};

export default JobApplyShow;
