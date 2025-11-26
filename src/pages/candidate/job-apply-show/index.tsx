import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { CheckOutlined } from "@ant-design/icons";
import { Button, Drawer, message, Modal, Select, Spin } from "antd";
import classnames from "classnames";
import { Get, Post } from "@/utils/request";
import CandidateChat from "@/components/CandidateChat";
import {
  formatInterviewMode,
  getJobApplyStatus,
  parseJd,
  parseJSON,
} from "@/utils";
import MarkdownContainer from "@/components/MarkdownContainer";

import styles from "./style.module.less";
import CompanyLogo from "../components/CompanyLogo";
import ChatRoom from "@/components/ChatRoom";
import dayjs, { Dayjs } from "dayjs";
import Icon from "@/components/Icon";
import ArrowLeft from "@/assets/icons/arrow-left";
import PhoneWithCountryCode from "@/components/PhoneWithCountryCode";
import WhatsappIcon from "@/assets/icons/whatsapp";
import Empty2 from "@/assets/empty2.png";

type TimeSlot = { from: string; to: string };
const JobApplyShow = () => {
  const [jobApply, setJobApply] = useState<IJobApply>();
  const [candidateSettings, setCandidateSettings] =
    useState<ICandidateSettings>();
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [whatsappModeOpen, setWhatsappModeOpen] = useState(false);
  const [humanModeOpen, setHumanModeOpen] = useState(false);
  const [interviewChatDrawerOpen, setInterviewChatDrawerOpen] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewTimeValueMap, setInterviewTimeValueMap] = useState<
    Record<string, string>
  >({});

  const applyStatus = useMemo(() => {
    return getJobApplyStatus(jobApply);
  }, [jobApply]);

  const { jobApplyId = "" } = useParams();

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();

  const t = (key: string, params?: Record<string, string>) =>
    originalT(`job_apply.${key}`, params);

  useEffect(() => {
    fetchCandidateSettings();
    fetchApplyJob();
    const urlParams = new URLSearchParams(window.location.search);
    const open = urlParams.get("open");
    if (open === "1") {
      setInterviewChatDrawerOpen(true);
    }
  }, []);

  const fetchCandidateSettings = async () => {
    const { code, data } = await Get("/api/candidate/settings");
    if (code === 0) {
      setCandidateSettings(data.candidate);
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
        interviews: data.interviews,
      });
    }
  };

  const splitTimeRanges = (
    ranges: TimeSlot[],
    duration: number
  ): TimeSlot[] => {
    if (!ranges.length) return [];

    const sortedRanges = ranges
      .map((range) => ({
        from: dayjs(range.from),
        to: dayjs(range.to),
      }))
      .sort((a, b) => a.from.diff(b.from));

    const merged: { from: Dayjs; to: Dayjs }[] = [];
    for (const range of sortedRanges) {
      if (merged.length === 0) {
        merged.push(range);
      } else {
        const last = merged[merged.length - 1];
        if (range.from.isBefore(last.to)) {
          // 有重叠，合并
          merged[merged.length - 1] = {
            from: last.from,
            to: range.to.isAfter(last.to) ? range.to : last.to,
          };
        } else {
          merged.push(range);
        }
      }
    }

    const result: TimeSlot[] = [];
    for (const mergedRange of merged) {
      let currentStart = mergedRange.from;

      while (
        currentStart.add(duration, "minute").isBefore(mergedRange.to) ||
        currentStart.add(duration, "minute").isSame(mergedRange.to)
      ) {
        result.push({
          from: currentStart.toISOString(),
          to: currentStart.add(duration, "minute").toISOString(),
        });
        currentStart = currentStart.add(30, "minute"); // 粒度为半小时
      }
    }

    return result;
  };

  const onClickChat = () => {
    if (jobApply?.interview_mode === "whatsapp") {
      setWhatsappModeOpen(true);
    } else if (jobApply?.interview_mode === "human") {
      setHumanModeOpen(true);
    } else {
      setInterviewChatDrawerOpen(true);
    }
  };

  if (!jobApply) {
    return <Spin />;
  }

  const jdJson = jobApply.jdJson;

  const steps: {
    key: string;
    title: string;
    hint?: string;
    status: "done" | "active" | "disabled";
  }[] = [
    {
      key: "apply",
      title: "Apply for Position",
      status: "done",
    },
    {
      key: "chat",
      title:
        jobApply.interview_mode === "human"
          ? "Schedule a call with human recruiter"
          : "Instant chat with AI Recruiter",
      status: applyStatus === "chat" ? "active" : "done",
      hint:
        jobApply.interview_mode === "human"
          ? "The human recruiter consultant will contact you promptly to have a brief conversation, aiming to further understand your background and career intentions."
          : "Before submitting your resume, you will have a short interactive conversation with Viona to help you understand whether the position matches your background and interests, ensuring the position you apply for is the most suitable for you.",
    },
    {
      key: "screening",
      title: "Resume Screening",
      hint: "The recruitment department and the hiring department are screening resumes.",
      status:
        applyStatus === "chat"
          ? "disabled"
          : applyStatus === "screening"
          ? "active"
          : "done",
    },
    {
      key: "processed",
      title:
        applyStatus === "accepted"
          ? "Resume Accepted"
          : applyStatus === "rejected"
          ? "Resume Rejected"
          : "Resume Processed",
      status:
        applyStatus === "accepted" || applyStatus === "rejected"
          ? "done"
          : "disabled",
    },
  ];

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
          onClick={() => navigate("/candidate/jobs?tab=apply")}
        />
        <div>{t("title")}</div>
      </div>
      <div className={styles.main}>
        <div className={styles.left}>
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
                  <Button
                    color="primary"
                    variant="outlined"
                    style={{ fontWeight: "bold" }}
                    onClick={() => setChatDrawerOpen(true)}
                  >
                    {t("chat")}
                  </Button>

                  {(jobApply.interviews ?? []).length > 0 && (
                    <Button
                      type="primary"
                      shape="round"
                      onClick={() => setInterviewModalOpen(true)}
                    >
                      回应面试
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.jd}>
            {!!jdJson.company_introduction && (
              <div className={styles.jobDescriptionSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.greenBar}></div>
                  <span>Company Overview</span>
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
                    <span>Position Overview</span>
                  </div>
                  <div className={styles.sectionContent}>
                    <MarkdownContainer content={jdJson.job_description} />
                  </div>
                </div>

                <div className={styles.jobDescriptionSection}>
                  <div className={styles.sectionTitle}>
                    <div className={styles.greenBar}></div>
                    <span>Basic Requirements</span>
                  </div>
                  <div className={styles.sectionContent}>
                    <MarkdownContainer content={jdJson.basic_requirements} />
                  </div>
                </div>

                <div className={styles.jobDescriptionSection}>
                  <div className={styles.sectionTitle}>
                    <div className={styles.greenBar}></div>
                    <span>Bonus Points</span>
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
        <div className={styles.right}>
          <div className={styles.rightBody}>
            <div className={styles.stepTitle}>Job Application Progress</div>
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
                          Chat
                        </Button>
                      )}
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
          <ChatRoom
            userRole="candidate"
            jobId={jobApply.job_id}
            sessionId={`${jobApply.candidate_id}`}
          />
        </div>
      </Drawer>

      <Drawer
        open={interviewChatDrawerOpen}
        width={1200}
        onClose={() => setInterviewChatDrawerOpen(false)}
        title={t("interview")}
        destroyOnClose
      >
        <div style={{ height: "100%", display: "flex" }}>
          <CandidateChat
            chatType="job_interview"
            jobApplyId={parseInt(jobApplyId)}
            onFinish={() => {
              fetchApplyJob();
              message.success(t("finish_interview_hint"));
            }}
          />
        </div>
      </Drawer>

      <Modal
        title="Let's Chat and Prepare Your Application"
        open={whatsappModeOpen}
        onCancel={() => setWhatsappModeOpen(false)}
        cancelButtonProps={{
          style: {
            display: "none",
          },
        }}
        onOk={async () => {
          if (jobApply?.whatsapp_number_confirmed_at) {
            setWhatsappModeOpen(false);
            return;
          } else {
            const { code } = await Post(
              `/api/candidate/job_applies/${jobApply.id}/confirm_whatsapp_number`
            );
            if (code === 0) {
              fetchApplyJob();
            } else {
              message.success(originalT("submit_failed"));
            }
          }
        }}
        className={styles.whatsappModeModal}
        centered
        width={740}
      >
        {jobApply?.whatsapp_number_confirmed_at ? (
          <div className={styles.whatsappContainer}>
            <div className={styles.whatsappIcon}>
              <Icon icon={<WhatsappIcon />} style={{ fontSize: 90 }} />
            </div>
            <div style={{ maxWidth: 800, padding: "0 20px" }}>
              Thanks! Our AI recruiter <b>Viona</b> has just reached out to you
              on WhatsApp (you’ll see the message from <b>Viona by Persevio</b>
              ).
              <br />
              <br />
              When you have a moment, please reply to her there and complete the
              discovery conversation with her. This helps us prepare your
              application accurately before submitting it to the employer.
            </div>
          </div>
        ) : (
          <div className={styles.whatsappModeContent}>
            <div
              className={styles.hint}
              dangerouslySetInnerHTML={{ __html: originalT("apply_job.hint") }}
            />
            <ul className={styles.list}>
              <li
                className={styles.listItem}
                dangerouslySetInnerHTML={{
                  __html: originalT("apply_job.list_confidentiality"),
                }}
              />
              <li
                className={styles.listItem}
                dangerouslySetInnerHTML={{
                  __html: originalT("apply_job.list_add_contact"),
                }}
              />
            </ul>

            <div style={{ marginBottom: 8 }}>您的 WhatsApp 账号</div>
            <PhoneWithCountryCode
              readonly
              value={{
                countryCode: candidateSettings?.whatsapp_country_code,
                phoneNumber: candidateSettings?.whatsapp_phone_number,
              }}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="Let's Chat and Prepare Your Application"
        open={humanModeOpen}
        onCancel={() => setHumanModeOpen(false)}
        cancelButtonProps={{
          style: {
            display: "none",
          },
        }}
        onOk={() => {
          setHumanModeOpen(false);
        }}
        centered
        width={740}
      >
        <div className={styles.humanModeContent}>
          <img src={Empty2} alt="empty" style={{ width: 140 }} />
          <div className={styles.humanModeContentText}>
            <b>Thank you.</b>
            <br />A consultant will be calling you soon.
          </div>
        </div>
      </Modal>

      <Modal
        title="确认面试时间"
        open={interviewModalOpen}
        onCancel={() => setInterviewModalOpen(false)}
        onOk={async () => {
          const keys = Object.keys(interviewTimeValueMap);
          for (let interviewId of keys) {
            const { code } = await Post(
              `/api/candidate/job_applies/${jobApply.id}/interviews/${interviewId}/confirm_time`,
              {
                start_time: interviewTimeValueMap[interviewId],
              }
            );
            if (code !== 0) {
              message.success(originalT("submit_failed"));
              return;
            }
          }

          message.success("面试时间确认成功");
          setInterviewModalOpen(false);
          fetchApplyJob();
          setInterviewTimeValueMap({});
        }}
      >
        {(jobApply?.interviews ?? []).map((interview) => {
          return (
            <div className={styles.interviewPanel}>
              <div className={styles.interviewItem}>
                <div>面试名称:</div>
                <div>{interview.name}</div>
              </div>
              <div className={styles.interviewItem}>
                <div>面试类型:</div>
                <div>{formatInterviewMode(interview.mode)}</div>
              </div>
              <div className={styles.interviewItem}>
                <div>面试时长:</div>
                <div>{interview.duration} 分钟</div>
              </div>
              <div className={styles.interviewItem}>
                <div>面试官:</div>
                <div>
                  {
                    interview.interview_members.find(
                      (item) => item.interviewer_id != 0
                    )?.interviewer?.name
                  }
                </div>
              </div>
              <div className={styles.interviewItem}>
                <div>面试时间:</div>
                <div style={{ display: "flex", gap: 12 }}>
                  {interview.scheduled_at ? (
                    dayjs(interview.scheduled_at).format("YYYY-MM-DD HH:mm")
                  ) : (
                    <Select
                      value={interviewTimeValueMap[interview.id]}
                      style={{ width: "100%" }}
                      onChange={(v) =>
                        setInterviewTimeValueMap({
                          ...interviewTimeValueMap,
                          [interview.id]: v,
                        })
                      }
                      options={(() => {
                        const timeSlots =
                          interview.interview_members.find(
                            (item) => item.interviewer_id != 0
                          )?.time_slots?.scopes ?? [];

                        const options = splitTimeRanges(
                          timeSlots,
                          interview.duration
                        );

                        return options.map((option) => ({
                          value: option.from,
                          label: `${dayjs(option.from).format(
                            "YYYY-MM-DD HH:mm"
                          )} ~ ${dayjs(option.to).format("YYYY-MM-DD HH:mm")}`,
                        }));
                      })()}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </Modal>
    </div>
  );
};

export default JobApplyShow;
