import { useEffect, useState } from "react";
import { parseJSON } from "@/utils";
import { Get } from "@/utils/request";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { Empty } from "antd";

type TWorkExperience = {
  /** Legal employer name from verified sources */
  company_name?: string;
  employer_context?: string;
  /** Validated job title during tenure */
  position?: string;
  /** Employment period in 'MM/YYYY-MM/YYYY' format */
  duration?: string;
  /** Office location (city, country code) */
  location?: string;
  /** Synthesized key responsibilities from transcript/resume */
  core_role_objectives?: string;
  /** Team structure/size if mentioned (omit if unavailable) */
  team_context?: string;
  /** Major projects synthesized from multiple sources */
  projects_involved?: string;
  /** Quantified accomplishments from transcript priority */
  key_achievements?: string;
  reason_for_leaving_or_current_status?: string;
  /** Concise role overview combining objectives/achievements */
  summary?: string;
};

type TEducation = {
  /** Full institutional name from verified sources */
  school_name?: string;
  /** Complete degree title (e.g., 'BSc Computer Science') */
  degree?: string;
  major?: string;
  /** Study period in 'MM/YYYY-MM/YYYY' format */
  duration?: string;
  /** GPA/Honors class if explicitly mentioned */
  grade_or_honors?: string;
  other_relevant_info?: string[];
};

interface TResume {
  /** Full name from resume/transcript (combine first/last name fields) */
  name?: string;
  /** Most recent job title with current employer */
  current_position?: string;
  /** Primary contact email from resume/transcript */
  email?: string;
  /** Primary phone number with international dial code */
  phone?: string;
  /** Combined city and country location (e.g., 'Singapore, SG') */
  current_based_in?: string;
  /** List of work permits/visas (e.g., 'Singapore PR, EU Blue Card') */
  work_authorization?: string;
  /** Candidate highlights from transcript/resume */
  candidate_highlights?: string[];
  /** Validated skills/domain expertise (e.g., 'B2B SaaS Sales: Enterprise Accounts') */
  core_competencies?: { name: string; experiences: string[] }[];
  other_competencies?: { name: string; experiences: string[] }[];
  /** Work experience in reverse chronological order */
  work_experience?: TWorkExperience[];
  /** Education background information */
  education?: TEducation[];
  additional_qualifications?: {
    publications?: string[];
    certifications?: string[];
    awards_and_honors?: string[];
  };
}

type TTabKey = "resume" | "biography";
const CandidateResume = () => {
  const [resume, setResume] = useState<TResume>();
  // const [biography, setBiography] = useState<string>();
  const [status, _] = useState<TTabKey>("resume");
  // const [isEditing, setIsEditing] = useState(false);

  // const [editResumeContent, setEditResumeContent] = useState("");

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`candidate_resume.${key}`);

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    const { code, data } = await Get("/api/candidate/docs/resume_json");
    if (code === 0) {
      setResume(parseJSON(data.content));
    }
  };

  // const handleSave = async () => {
  //   const { code } = await Post("/api/candidate/docs/llm_resume", {
  //     content: editResumeContent,
  //   });
  //   if (code === 0) {
  //     setIsEditing(false);
  //     fetchResume();
  //     message.success(originalT("submit_succeed"));
  //   }
  // };

  if (!resume) {
    return <Empty style={{ marginTop: 200 }} description={t("pending")} />;
  }

  return (
    <div className={styles.container}>
      {/* <Tabs
        style={{ marginTop: 20 }}
        centered
        activeKey={status}
        items={[
          {
            key: "resume",
            label: t("resume"),
          },
          {
            key: "biography",
            label: t("biography"),
          },
        ]}
        onChange={(type) => {
          setStatus(type as TTabKey);
        }}
      /> */}
      {status === "resume" && !!resume && (
        <div className={styles.resumeWrapper}>
          <div className={styles.name}>{resume.name}</div>
          <div className={styles.currentPosition}>
            {resume.current_position}
          </div>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>{t("basic_info")}</div>
            <div className={styles.row}>
              <div className={styles.item}>
                <div className={styles.label}>{t("email")}</div>
                <div>{resume.email || "N/A"}</div>
              </div>
              <div className={styles.item}>
                <div className={styles.label}>{t("phone")}</div>
                <div>{resume.phone}</div>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.item}>
                <div className={styles.label}>{t("base_in")}</div>
                <div>{resume.current_based_in}</div>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.item}>
                <div className={styles.label}>{t("work_authorization")}</div>
                <div>{resume.work_authorization || "N/A"}</div>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>{t("hightlight")}</div>
            <div className={styles.highlightWrapper}>
              {(resume.candidate_highlights ?? []).map((highlight, index) => (
                <div key={highlight} className={styles.highlight}>
                  {index + 1}. {highlight}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>{t("core_competencies")}</div>
            <div className={styles.competenciesWrapper}>
              {Array.isArray(resume.core_competencies) &&
                resume.core_competencies.map((competency) => (
                  <div key={competency.name} className={styles.competency}>
                    <div className={styles.subTitle}>{competency.name}</div>
                    {competency.experiences.map((item, index) => {
                      return (
                        <div key={index} style={{ marginTop: 8 }}>{`${
                          index + 1
                        }. ${item}`}</div>
                      );
                    })}
                  </div>
                ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>{t("other_competencies")}</div>
            <div className={styles.competenciesWrapper}>
              {Array.isArray(resume.other_competencies) &&
                resume.other_competencies.map((competency) => (
                  <div key={competency.name} className={styles.competency}>
                    <div className={styles.subTitle}>{competency.name}</div>
                    {competency.experiences.map((item, index) => {
                      return (
                        <div key={index} style={{ marginTop: 8 }}>{`${
                          index + 1
                        }. ${item}`}</div>
                      );
                    })}
                  </div>
                ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>{t("work_experiences")}</div>
            {resume.work_experience?.map((workExperience, i) => (
              <div key={i} className={styles.workExperience}>
                <div className={styles.subTitle}>
                  {workExperience.company_name}
                </div>
                <div className={styles.companyInfo}>
                  <div className={styles.position}>
                    {workExperience.position}
                  </div>
                  <div>{workExperience.duration}</div>
                  <div>{workExperience.location}</div>
                </div>

                {!!workExperience.employer_context && (
                  <div className={styles.infoRow}>
                    <div>{t("employer_context")}</div>
                    <div>{workExperience.employer_context}</div>
                  </div>
                )}
                {!!workExperience.core_role_objectives && (
                  <div className={styles.infoRow}>
                    <div>{t("core_role_objectives")}</div>
                    <div>{workExperience.core_role_objectives}</div>
                  </div>
                )}
                {!!workExperience.team_context && (
                  <div className={styles.infoRow}>
                    <div>{t("team_context")}</div>
                    <div>{workExperience.team_context}</div>
                  </div>
                )}
                {!!workExperience.projects_involved && (
                  <div className={styles.infoRow}>
                    <div>{t("projects_involved")}</div>
                    <div>{workExperience.projects_involved}</div>
                  </div>
                )}
                {!!workExperience.key_achievements && (
                  <div className={styles.infoRow}>
                    <div>{t("key_achivements")}</div>
                    <div>{workExperience.key_achievements}</div>
                  </div>
                )}
                {!!workExperience.summary && (
                  <div className={styles.infoRow}>
                    <div>{t("summary")}</div>
                    <div>{workExperience.summary}</div>
                  </div>
                )}
                {!!workExperience.reason_for_leaving_or_current_status && (
                  <div className={styles.infoRow}>
                    <div>{t("reason_for_leaving_or_current_status")}</div>
                    <div>
                      {workExperience.reason_for_leaving_or_current_status}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>{t("education")}</div>
            <div>
              {resume.education?.map((education, i) => (
                <div key={i} className={styles.educationExperience}>
                  <div className={styles.school}>{education.school_name}</div>
                  <div className={styles.degree}>
                    {education.major} - {education.degree}
                  </div>
                  <div className={styles.hint}>
                    <div>{education.duration}</div>
                    {!!education.grade_or_honors && (
                      <div className={styles.grade}>
                        {education.grade_or_honors}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    {(education.other_relevant_info ?? []).map(
                      (info, index) => {
                        return (
                          <div key={info}>
                            {index + 1}. {info}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(() => {
            const publications =
              resume.additional_qualifications?.publications ?? [];
            const certifications =
              resume.additional_qualifications?.certifications ?? [];
            const awardsAndHonors =
              resume.additional_qualifications?.awards_and_honors ?? [];
            if (
              !publications.length &&
              !certifications.length &&
              !awardsAndHonors.length
            ) {
              return null;
            }

            return (
              <div className={styles.panel}>
                <div className={styles.panelTitle}>
                  {t("additional_qualifications")}
                </div>
                {publications.length > 0 && (
                  <div className={styles.infoRow}>
                    <div>{t("publications")}</div>
                    <div>{publications.join("、")}</div>
                  </div>
                )}
                {certifications.length > 0 && (
                  <div className={styles.infoRow}>
                    <div>{t("certifications")}</div>
                    <div>{certifications.join("、")}</div>
                  </div>
                )}
                {awardsAndHonors.length > 0 && (
                  <div className={styles.infoRow}>
                    <div>{t("awards_and_honors")}</div>
                    <div>{awardsAndHonors.join("、")}</div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default CandidateResume;
