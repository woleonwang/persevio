import React, { useEffect, useReducer, useState } from "react";
import { Button, Spin, Collapse, Tabs, Modal, Switch, message } from "antd";
import classnames from "classnames";
import { ArrowLeftOutlined } from "@ant-design/icons";
import useTalent from "@/hooks/useTalent";
import usePublicJob from "@/hooks/usePublicJob";
import { Download, Get, Post } from "@/utils/request";
import { backOrDirect, getEvaluateResultLevel, parseJSON } from "@/utils";
import { useNavigate, useParams } from "react-router";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import Icon from "@/components/Icon";
import DownloadIcon from "@/assets/icons/download";
import Phone from "@/assets/icons/phone";
import MailCheck from "@/assets/icons/mail-check";
import Link2 from "@/assets/icons/link2";
import MarkdownContainer from "@/components/MarkdownContainer";
import EvaluateResultBadge from "@/components/EvaluateResultBadge";
import { useTranslation } from "react-i18next";
import Resume from "./components/Resume";
import ChatMessagePreview from "@/components/ChatMessagePreview";
import TextAreaWithVoice from "@/components/TextAreaWithVoice";
import { TTalentResume } from "@/components/NewTalentDetail/type";
import type { TTalentNote } from "./type";
import styles from "./style.module.less";
import StrengthFilled from "@/assets/icons/strength-filled";
import GapsFilled from "@/assets/icons/gaps-filled";

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 1).toUpperCase();
};

const formatLastUpdated = (dateStr?: string) => {
  if (!dateStr) return null;
  return dayjs(dateStr).format("MMM DD, YYYY");
};

const AtsTalentDetail: React.FC = () => {
  const { talentId: talentIdStr, jobId: jobIdStr } = useParams<{
    talentId: string;
    jobId: string;
  }>();

  const [_, forceUpdate] = useReducer((x) => x + 1, 0);
  const [talentsOfCandidate, setTalentsOfCandidate] = useState<TTalent[]>([]);
  const [talentChatMessages, setTalentChatMessages] = useState<
    TMessageFromApi[]
  >([]);
  const [isAddFeedbackModalOpen, setIsAddFeedbackModalOpen] = useState(false);
  const [newFeedbackContent, setNewFeedbackContent] = useState("");
  const [newFeedbackAdvance, setNewFeedbackAdvance] = useState(false);
  const [notes, setNotes] = useState<TTalentNote[]>([]);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");

  const { job } = usePublicJob();
  const { talent, interviews, fetchTalent } = useTalent();
  const navigate = useNavigate();
  const { t: originalT } = useTranslation();

  useEffect(() => {
    fetchTalentsOfCandidate();
    fetchTalentChatMessages();
    fetchTalentNotes();
  }, [talentIdStr, jobIdStr]);

  const fetchTalentsOfCandidate = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobIdStr}/talents/${talentIdStr}/all_talents`,
    );
    if (code === 0) {
      setTalentsOfCandidate(data.talents);
    }
  };

  const fetchTalentChatMessages = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobIdStr}/talents/${talentIdStr}/messages`,
    );
    if (code === 0) {
      setTalentChatMessages(data.messages);
    } else {
      setTalentChatMessages([]);
    }
  };

  const fetchTalentNotes = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobIdStr}/talents/${talentIdStr}/notes`,
    );
    if (code === 0) {
      setNotes(data.talent_notes ?? []);
    } else {
      setNotes([]);
    }
  };

  if (!job || !talent) {
    return <Spin />;
  }

  const resumeDetail: TTalentResume | null = talent.resume_detail_json
    ? (parseJSON(talent.resume_detail_json) as TTalentResume)
    : null;

  const report = parseJSON(talent.evaluate_json) as TReport;

  const contact = resumeDetail?.contact_information;
  const lastUpdated =
    talent.evaluate_result_updated_at ||
    talent.viewed_at ||
    talent.feedback_updated_at;

  const downloadResume = async () => {
    await Download(
      `/api/jobs/${job?.id}/talents/${talent?.id}/download_resume`,
      `${talent.name}_resume`,
    );
  };

  const handleBack = () => {
    backOrDirect(navigate, `/app/jobs/${job.id}/standard-board?tab=talents`);
  };

  const requirementsSummaryMappings: Record<
    "p0" | "p1" | "p2",
    {
      level: "p0" | "p1" | "p2";
      description: string;
      assessment: string;
      reasoning: string;
      assessment_type: string;
    }[]
  > = {
    p0: [],
    p1: [],
    p2: [],
  };

  (report.requirements ?? []).forEach((item) => {
    requirementsSummaryMappings[item.level].push(item as any);
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <ArrowLeftOutlined className={styles.backIcon} onClick={handleBack} />
        <div className={styles.avatar}>{getInitials(talent.name)}</div>
        <div className={styles.headerMain}>
          <h1 className={styles.candidateName}>{talent.name}</h1>
        </div>
        <div className={styles.headerMeta}>
          {lastUpdated && (
            <span className={styles.lastUpdated}>
              Last updated: {formatLastUpdated(lastUpdated)}
            </span>
          )}
        </div>
      </header>

      <div className={styles.contactRow}>
        {contact?.phone && (
          <a href={`tel:${contact.phone}`} className={styles.contactLink}>
            <Icon icon={<Phone />} />
            {contact.phone}
          </a>
        )}
        {contact?.email && (
          <a href={`mailto:${contact.email}`} className={styles.contactLink}>
            <Icon icon={<MailCheck />} />
            {contact.email}
          </a>
        )}
        {contact?.linkedin && (
          <a
            href={
              contact.linkedin.startsWith("http")
                ? contact.linkedin
                : `https://${contact.linkedin}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contactLink}
          >
            <Icon icon={<Link2 />} />
            {contact.linkedin.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>

      <section className={styles.snapshotSection}>
        <div className={styles.snapshotSectionBg} />
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Profile Snapshot</h2>
        </div>
        <div className={styles.snapshotGrid}>
          {(report.profile_snapshot ?? []).map((snapshot) => (
            <div className={styles.snapshotItem}>
              <span className={styles.snapshotLabel}>{snapshot.title}</span>
              <span className={styles.snapshotValue}>{snapshot.details}</span>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.mainRow}>
        <div className={styles.resumeColumn}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Resume</h2>
            <Button
              type="primary"
              icon={<Icon icon={<DownloadIcon />} />}
              onClick={downloadResume}
              className={styles.downloadPdfBtn}
            >
              Download PDF
            </Button>
          </div>
          <div className={styles.resumeContent}>
            {resumeDetail?.contact_information ? (
              <Resume resume={resumeDetail} />
            ) : (
              <MarkdownContainer content={talent.parsed_content || ""} />
            )}
          </div>
        </div>

        <div className={styles.keyInfoColumn}>
          <div className={styles.sectionHead} style={{ height: 49 }}>
            <h2 className={styles.sectionTitle}>Key Information</h2>
          </div>
          <div className={styles.bgWrap}>
            <div className={styles.keyInfoCards}>
              {(report.key_information ?? []).map((information) => (
                <div className={styles.keyInfoCard}>
                  <span className={styles.keyInfoLabel}>
                    {information.title}
                  </span>
                  <span className={styles.keyInfoValue}>
                    {information.details}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.jobApplySection}>
        <h2 className={styles.sectionTitle}>Jobs Applied</h2>
        <Tabs
          items={talentsOfCandidate.map((talent) => ({
            key: talent.id.toString(),
            label: (
              <div className={styles.jobApplyLabel}>
                <div className={styles.jobName}>{talent.job?.name}</div>
                {talent.job?.posted_at ? (
                  <div className={styles.active}>Active</div>
                ) : (
                  <div className={styles.closed}>Closed</div>
                )}
              </div>
            ),
          }))}
          activeKey={talent.id.toString()}
          onChange={(key) => {
            const talent = talentsOfCandidate.find(
              (t) => t.id.toString() === key,
            );

            if (talent?.job) {
              navigate(
                `/app/jobs/${talent.job.id}/standard-board/talents/${talent.id}`,
              );
              forceUpdate();
            }
          }}
        />
        <section className={styles.interviewsSection}>
          <h2 className={styles.sectionTitle}>Interviews</h2>
          <Collapse
            defaultActiveKey={["round0"]}
            expandIconPosition="end"
            ghost
            className={styles.interviewsCollapse}
          >
            <Collapse.Panel
              key="round0"
              header={
                <div className={styles.interviewHeader}>
                  <div className={styles.interviewRound}>
                    Round 0: AI Prescreening
                  </div>
                  <EvaluateResultBadge
                    size="small"
                    result={getEvaluateResultLevel(
                      report?.overall_recommendation?.result ?? report?.result,
                    )}
                  />
                </div>
              }
              className={styles.interviewPanel}
            >
              <div className={styles.evalSummaryCard}>
                <div
                  className={classnames(
                    styles.evalSummaryHeader,
                    styles.bluePoint,
                  )}
                >
                  Evaluation Summary
                </div>
                <div className={styles.evalSummaryContent}>
                  <div className={styles.evalOverallText}>
                    <div className={styles.evalOverallLabel}>
                      <span>Overall Fit</span>
                      <EvaluateResultBadge
                        result={getEvaluateResultLevel(
                          report?.overall_recommendation?.result ??
                            report?.result,
                        )}
                      />
                    </div>
                    <div className={styles.evalOverallDescription}>
                      {report.summary?.description || report.thumbnail_summary}
                    </div>
                  </div>
                  <div className={styles.evalDetailItem}>
                    <div className={styles.evalDetailTitle}>
                      <span>Skills Fit</span>
                      <div className={styles.evalDetailLevel}>
                        {report.overall_recommendation?.skills_fit?.level}
                      </div>
                    </div>

                    <div className={styles.evalDetailDesc}>
                      {report.overall_recommendation?.skills_fit?.explanation}
                    </div>
                  </div>
                  <div className={styles.evalDetailItem}>
                    <div className={styles.evalDetailTitle}>
                      <span>Logistical Fit</span>
                      <div className={styles.evalDetailLevel}>
                        {report.overall_recommendation?.logistics_fit?.level}
                      </div>
                    </div>

                    <div className={styles.evalDetailDesc}>
                      {
                        report.overall_recommendation?.logistics_fit
                          ?.explanation
                      }
                    </div>
                  </div>
                  <div className={styles.evalDetailItem}>
                    <div className={styles.evalDetailTitle}>
                      <span>Interest Level</span>
                      <div className={styles.evalDetailLevel}>
                        {report.summary?.interest_level?.level}
                      </div>
                    </div>

                    <div className={styles.evalDetailDesc}>
                      {report.summary?.interest_level?.explanation}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.candidateEvalSection}>
                <div className={styles.candidateEvalHeader}>
                  <div
                    className={classnames(
                      styles.candidateEvalTitle,
                      styles.bluePoint,
                    )}
                  >
                    Candidate Evaluation Report
                  </div>
                </div>

                <div className={styles.candidateEvalLayout}>
                  <div className={styles.candidateEvalLeft}>
                    <div className={styles.evalBlock}>
                      <div className={styles.evalBlockTitle}>
                        Requirements Summary
                      </div>
                      <div className={styles.requirementsSummary}>
                        {(["p0", "p1", "p2"] as const).map((level) => {
                          const items = requirementsSummaryMappings[level];
                          if (!items.length) return null;

                          const meetCount = items.filter(
                            (item) =>
                              item.assessment === "meets" ||
                              item.assessment_type === "meets",
                          ).length;
                          const partiallyMeetCount = items.filter(
                            (item) =>
                              item.assessment === "partially_meets" ||
                              item.assessment_type === "partially_meets",
                          ).length;

                          return (
                            <div
                              key={level}
                              className={`${styles.requirementSummaryItem} ${styles[level]}`}
                            >
                              <div className={styles.point} />
                              <span>
                                {meetCount} of {items.length}{" "}
                                {level.toUpperCase()}
                              </span>
                              requirements met
                              {partiallyMeetCount > 0 &&
                                ` (${partiallyMeetCount} partially)`}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className={styles.evalBlock}>
                      <div className={styles.evalBlockTitle}>
                        Detailed Requirements Analysis
                      </div>
                      <div className={styles.requirementsSummaryTable}>
                        <div
                          className={`${styles.requirementsSummaryRow} ${styles.requirementsSummaryHeader}`}
                        >
                          <div>Priority</div>
                          <div>Requirement</div>
                          <div>Assessment</div>
                          <div>Reasoning</div>
                        </div>
                        {(report.requirements ?? []).map((item, index) => {
                          return (
                            <div
                              key={index}
                              className={`${styles.requirementsSummaryRow} ${styles.requirementsSummaryItem} ${styles[item.level]}`}
                            >
                              <div>
                                <div
                                  className={classnames(
                                    styles.levelTag,
                                    styles[item.level],
                                  )}
                                >
                                  {item.level.toUpperCase()}
                                </div>
                              </div>
                              <div>{item.description}</div>
                              <div>
                                <div
                                  className={classnames(
                                    styles[item.assessment],
                                    styles.assessmentText,
                                  )}
                                >
                                  {originalT(
                                    `assessment_options.${
                                      item.assessment ?? item.assessment_type
                                    }`,
                                  )}
                                </div>
                              </div>
                              <div>{item.reasoning}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className={styles.candidateEvalRight}>
                    {(report.key_strengths ?? []).length > 0 && (
                      <div
                        className={`${styles.evalBlock} ${styles.strengthsBlock}`}
                      >
                        <div className={styles.evalBlockTitle}>
                          <Icon icon={<StrengthFilled />} />
                          Strengths
                        </div>
                        <div className={styles.evalList}>
                          {(report.key_strengths ?? []).map(
                            (strength, index) => {
                              return (
                                <div key={index} className={styles.listItem}>
                                  <span className={styles.listTitle}>
                                    {strength.title}:
                                  </span>
                                  <span className={styles.snapshotContent}>
                                    {strength.details}
                                  </span>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}

                    {(report.potential_gaps ?? []).length > 0 && (
                      <div
                        className={`${styles.evalBlock} ${styles.gapsBlock}`}
                      >
                        <div className={styles.evalBlockTitle}>
                          <Icon icon={<GapsFilled />} />
                          Potential Gaps
                        </div>
                        <div className={styles.evalList}>
                          {(report.potential_gaps ?? []).map((gap, index) => {
                            return (
                              <div key={index} className={styles.listItem}>
                                <span className={styles.listTitle}>
                                  {gap.title}:
                                </span>
                                <span className={styles.gapContent}>
                                  {gap.details}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(
                      report.areas_to_probe_further ??
                      report.areas_to_probe_futher ??
                      []
                    ).length > 0 && (
                      <div
                        className={`${styles.evalBlock} ${styles.areasBlock}`}
                      >
                        <div className={styles.evalBlockTitle}>
                          Areas to Probe in Next Rounds
                        </div>
                        <div className={styles.evalList}>
                          {(report.areas_to_probe_further ?? []).map(
                            (area, index) => {
                              return (
                                <div key={index} className={styles.listItem}>
                                  <span className={styles.listTitle}>
                                    {area.title}:
                                  </span>
                                  <span className={styles.areaContent}>
                                    {area.details}
                                  </span>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.aiSummarySection}>
                <div className={styles.aiSummaryLayout}>
                  <div className={styles.aiSummaryLeft}>
                    <div className={styles.aiSummaryGrid}>
                      <div
                        className={classnames(
                          styles.aiSummaryTitle,
                          styles.bluePoint,
                        )}
                        style={{ margin: "0 12px" }}
                      >
                        AI Interview Summary
                      </div>

                      <div className={styles.aiSummaryBg}>
                        {report.ai_interview_summary && (
                          <>
                            {(report.ai_interview_summary?.topics_covered ?? [])
                              .length > 0 && (
                              <div className={styles.aiSummaryCard}>
                                <div className={styles.aiSummaryTitle}>
                                  Topics Covered
                                </div>
                                <ul className={styles.aiSummaryList}>
                                  {(
                                    report.ai_interview_summary
                                      ?.topics_covered ?? []
                                  ).map((item, index) => (
                                    <li key={index}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {(
                              report.ai_interview_summary?.key_revelations ?? []
                            ).length > 0 && (
                              <div className={styles.aiSummaryCard}>
                                <div className={styles.aiSummaryTitle}>
                                  Key Revelations
                                </div>
                                <ul className={styles.aiSummaryList}>
                                  {(
                                    report.ai_interview_summary
                                      ?.key_revelations ?? []
                                  ).map((item, index) => (
                                    <li key={index}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {(
                              report.ai_interview_summary
                                ?.interview_observations ?? []
                            ).length > 0 && (
                              <div className={styles.aiSummaryCard}>
                                <div className={styles.aiSummaryTitle}>
                                  Interview Observations
                                </div>
                                <ul className={styles.aiSummaryList}>
                                  {(
                                    report.ai_interview_summary
                                      ?.interview_observations ?? []
                                  ).map((item, index) => (
                                    <li key={index}>
                                      <span
                                        className={styles.aiSummaryItemTitle}
                                      >
                                        {item.title}:
                                      </span>{" "}
                                      {item.details}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.aiSummaryRight}>
                    <div className={styles.aiTranscriptHeader}>
                      AI Interview Transcript
                    </div>
                    <div className={styles.aiTranscriptBody}>
                      <ChatMessagePreview
                        messages={talentChatMessages}
                        job={job as any}
                        talent={talent}
                        fontSize={14}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Collapse.Panel>
          </Collapse>

          {interviews.length > 0 && (
            <Collapse
              defaultActiveKey={["round1"]}
              expandIconPosition="end"
              ghost
              className={styles.interviewsCollapse}
            >
              <Collapse.Panel
                key="round1"
                header={
                  <div className={styles.interviewHeader}>
                    <div className={styles.interviewRound}>
                      Round 1: Interview
                    </div>
                    <div className={styles.interviewMeta}>
                      {dayjs(interviews[0].created_at).format("MMM DD, YYYY")}
                    </div>
                  </div>
                }
                className={styles.interviewPanel}
              >
                <div className={styles.roundFeedbackSection}>
                  <div className={styles.roundFeedbackList}>
                    {interviews[0].feedback_records.map((record) => (
                      <div key={record.id} className={styles.roundFeedbackItem}>
                        <div className={styles.roundFeedbackHeader}>
                          <span className={styles.roundFeedbackInterviewer}>
                            {record.staff?.name || "-"}
                          </span>
                          <span className={styles.roundFeedbackDate}>
                            {dayjs(record.created_at).format("MMM DD, YYYY")}
                          </span>
                        </div>
                        <div className={styles.roundFeedbackContent}>
                          {record.content}
                        </div>
                        <div className={styles.roundFeedbackFooter}>
                          <span
                            className={classnames(
                              styles.advanceBadge,
                              record.is_advance
                                ? styles.advanceYes
                                : styles.advanceNo,
                            )}
                          >
                            {record.is_advance ? "Advance: Yes" : "Advance: No"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.roundFeedbackActions}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setIsAddFeedbackModalOpen(true)}
                    >
                      + Add Feedback
                    </Button>
                  </div>
                </div>
              </Collapse.Panel>
            </Collapse>
          )}
        </section>
      </div>

      <div className={styles.notesSection}>
        <h2 className={styles.sectionTitle}>Notes</h2>
        <div className={styles.notesContainer}>
          <div className={styles.notesList}>
            {notes.map((note) => (
              <div key={note.id} className={styles.noteItem}>
                <div className={styles.noteHeader}>
                  <span className={styles.noteAuthor}>
                    {note.staff?.name || "-"}
                  </span>
                  <span className={styles.noteDate}>
                    {dayjs(note.created_at).format("MMM DD, YYYY")}
                  </span>
                </div>
                <div className={styles.noteContent}>{note.content}</div>
              </div>
            ))}
          </div>
          <div className={styles.notesActions}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setIsAddNoteModalOpen(true)}
            >
              + Add Note
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.activitiesSection}>
        <h2 className={styles.sectionTitle}>Activity Log</h2>
      </div>

      <Modal
        title="Add Feedback"
        open={isAddFeedbackModalOpen}
        centered
        onCancel={() => {
          setIsAddFeedbackModalOpen(false);
          setNewFeedbackContent("");
          setNewFeedbackAdvance(false);
        }}
        onOk={async () => {
          if (!newFeedbackContent.trim()) {
            message.error("Please enter feedback.");
            return;
          }
          if (!interviews.length) return;
          const interview = interviews[0];

          const { code } = await Post(
            `/api/jobs/${jobIdStr}/talents/${talentIdStr}/interviews/${interview.id}/feedback_records`,
            {
              content: newFeedbackContent.trim(),
              is_advance: newFeedbackAdvance,
            },
          );
          if (code === 0) {
            message.success("Feedback added");
            setIsAddFeedbackModalOpen(false);
            setNewFeedbackContent("");
            setNewFeedbackAdvance(false);
            fetchTalent();
          }
        }}
        okText="Save"
      >
        <div className={styles.addFeedbackModal}>
          <div className={styles.addFeedbackField}>
            <div className={styles.addFeedbackLabel}>Feedback</div>
            <div className={styles.addFeedbackContent}>
              <TextAreaWithVoice
                value={newFeedbackContent}
                onChange={setNewFeedbackContent}
                placeholder="Write feedback or use voice input..."
              />
            </div>
          </div>
          <div className={styles.addFeedbackField}>
            <div className={styles.addFeedbackLabel}>Advance</div>
            <div className={styles.addFeedbackContent}>
              <Switch
                checked={newFeedbackAdvance}
                onChange={setNewFeedbackAdvance}
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title="Add Note"
        open={isAddNoteModalOpen}
        centered
        onCancel={() => {
          setIsAddNoteModalOpen(false);
          setNewNoteContent("");
        }}
        onOk={async () => {
          if (!newNoteContent.trim()) {
            message.error("Please enter note.");
            return;
          }
          const { code } = await Post(
            `/api/jobs/${jobIdStr}/talents/${talentIdStr}/notes`,
            { content: newNoteContent.trim() },
          );
          if (code === 0) {
            message.success("Note added");
            setIsAddNoteModalOpen(false);
            setNewNoteContent("");
            await fetchTalentNotes();
          }
        }}
        okText="Save"
      >
        <div className={styles.addFeedbackModal}>
          <div className={styles.addFeedbackField}>
            <div className={styles.addFeedbackLabel}>Note</div>
            <div className={styles.addFeedbackContent}>
              <TextAreaWithVoice
                value={newNoteContent}
                onChange={setNewNoteContent}
                placeholder="Write note or use voice input..."
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default observer(AtsTalentDetail);
