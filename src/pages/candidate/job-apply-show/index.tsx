import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Button, Drawer, message, Modal, Select, Spin, Steps } from "antd";
import { LeftCircleOutlined } from "@ant-design/icons";
import { Get, Post } from "@/utils/request";
import CandidateChat from "@/components/CandidateChat";
import { formatInterviewMode, parseJd } from "@/utils";
import MarkdownContainer from "@/components/MarkdownContainer";

import styles from "./style.module.less";
import CompanyLogo from "../components/CompanyLogo";
import ChatRoom from "@/components/ChatRoom";
import dayjs, { Dayjs } from "dayjs";

type TimeSlot = { from: string; to: string };
const JobApplyShow = () => {
  const [jobApply, setJobApply] = useState<IJobApply>();
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [interviewChatDrawerOpen, setInterviewChatDrawerOpen] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewTimeValueMap, setInterviewTimeValueMap] = useState<
    Record<string, string>
  >({});

  const applyStatus = ((): number => {
    if (!jobApply) {
      return 0;
    }

    if (
      jobApply.talentStatus === "accepted" ||
      jobApply.talentStatus === "rejected"
    ) {
      return 2;
    }

    if (!!jobApply.deliveried_at) {
      return 1;
    }

    return 0;
  })();

  const { jobApplyId = "" } = useParams();

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();

  const t = (key: string) => originalT(`job_apply.${key}`);

  useEffect(() => {
    fetchApplyJob();
    const urlParams = new URLSearchParams(window.location.search);
    const open = urlParams.get("open");
    if (open === "1") {
      setInterviewChatDrawerOpen(true);
    }
  }, []);
  const fetchApplyJob = async () => {
    const { code, data } = await Get(
      `/api/candidate/job_applies/${jobApplyId}`
    );
    if (code === 0) {
      setJobApply({
        ...data.job_apply,
        jd: parseJd(data.jd),
        talentStatus: data.talent_status,
        interviews: data.interviews,
      });
    }
  };

  const delivery = async () => {
    const { code } = await Post(
      `/api/candidate/job_applies/${jobApplyId}/delivery`
    );
    if (code === 0) {
      message.success(originalT("submit_succeed"));
      fetchApplyJob();
    } else {
      message.error(originalT("submit_failed"));
    }
  };

  function splitTimeRanges(ranges: TimeSlot[], duration: number): TimeSlot[] {
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
  }

  if (!jobApply) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>{originalT("job_applies.jobs")}</div>
        <LeftCircleOutlined
          style={{ color: "#1FAC6A", cursor: "pointer" }}
          onClick={() => navigate("/candidate/job-applies")}
        />
      </div>
      <div className={styles.main}>
        <div className={styles.left}>
          <div className={styles.jobApplyCard}>
            <div className={styles.basicInfo}>
              <CompanyLogo logo={jobApply.company_logo} />
              <div>
                <div className={styles.jobName}>{jobApply.job_name}</div>
                <div className={styles.tags}>
                  <div className={styles.companyName}>
                    {jobApply.company_name}
                  </div>
                </div>
              </div>
            </div>
            <div>
              {!jobApply.deliveried_at && (
                <Button
                  type="primary"
                  shape="round"
                  disabled={!!jobApply.deliveried_at}
                  onClick={() => {
                    if (jobApply.interview_finished_at) {
                      delivery();
                    } else {
                      setInterviewChatDrawerOpen(true);
                    }
                  }}
                >
                  {t("apply_now")}
                </Button>
              )}

              <Button
                style={{ marginLeft: 10 }}
                type="primary"
                shape="round"
                onClick={() => setChatDrawerOpen(true)}
              >
                {originalT("chat_with_viona")}
              </Button>

              {(jobApply.interviews ?? []).length > 0 && (
                <Button
                  style={{ marginLeft: 10 }}
                  type="primary"
                  shape="round"
                  onClick={() => setInterviewModalOpen(true)}
                >
                  回应面试
                </Button>
              )}
            </div>
          </div>
          <div className={styles.jd}>
            <MarkdownContainer content={jobApply.jd} />
          </div>
        </div>
        <div className={styles.right}>
          <Steps
            progressDot
            direction="vertical"
            size="small"
            current={applyStatus}
            items={[
              { title: "Interview" },
              { title: "Resume Submitted" },
              { title: "Resume Processed" },
            ]}
          />
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
