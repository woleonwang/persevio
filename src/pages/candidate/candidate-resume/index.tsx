import { useEffect, useState } from "react";
import { parseJSON } from "@/utils";
import { Get } from "@/utils/request";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { Empty } from "antd";

type TWorkExperience = {
  /** Legal employer name from verified sources */
  company_name?: string;
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
  /** Concise role overview combining objectives/achievements */
  summary?: string;
};

type TEducation = {
  /** Full institutional name from verified sources */
  school_name?: string;
  /** Complete degree title (e.g., 'BSc Computer Science') */
  degree?: string;
  /** Study period in 'MM/YYYY-MM/YYYY' format */
  duration?: string;
  /** GPA/Honors class if explicitly mentioned */
  grade?: string;
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
  /** Validated skills/domain expertise (e.g., 'B2B SaaS Sales: Enterprise Accounts') */
  core_competencies?: string[];
  /** Work experience in reverse chronological order */
  work_experience?: TWorkExperience[];
  /** Education background information */
  education?: TEducation[];
}
const CandidateResume = () => {
  const [resume, setResume] = useState<TResume>();
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
      <div className={styles.header}>{t("resume")}</div>
      {!!resume && (
        <div className={styles.resumeWrapper}>
          <div className={styles.name}>{resume.name}</div>
          <div className={styles.currentPosition}>
            {resume.current_position}
          </div>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Basic Info</div>
            <div className={styles.row}>
              <div className={styles.item}>
                <div className={styles.label}>Email:</div>
                <div>{resume.email || "N/A"}</div>
              </div>
              <div className={styles.item}>
                <div className={styles.label}>Phone:</div>
                <div>{resume.phone}</div>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.item}>
                <div className={styles.label}>Currently based in:</div>
                <div>{resume.current_based_in}</div>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.item}>
                <div className={styles.label}>Work Authorization:</div>
                <div>{resume.work_authorization || "N/A"}</div>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>Core Competencies</div>
            <div className={styles.competenciesWrapper}>
              {resume.core_competencies?.map((competency) => (
                <div key={competency} className={styles.competency}>
                  {competency}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>Work Experience</div>
            {resume.work_experience?.map((workExperience, i) => (
              <div key={i} className={styles.workExperience}>
                <div className={styles.companyName}>
                  {workExperience.company_name}
                </div>
                <div className={styles.companyInfo}>
                  <div className={styles.position}>
                    {workExperience.position}
                  </div>
                  <div>{workExperience.duration}</div>
                  <div>{workExperience.location}</div>
                </div>

                <div className={styles.infoRow}>
                  <div>Core role objectives/scopes:</div>
                  <div>{workExperience.core_role_objectives || "N/A"}</div>
                </div>
                <div className={styles.infoRow}>
                  <div>Team Context:</div>
                  <div>{workExperience.team_context || "N/A"}</div>
                </div>
                <div className={styles.infoRow}>
                  <div>Projects involved:</div>
                  <div>{workExperience.projects_involved || "N/A"}</div>
                </div>
                <div className={styles.infoRow}>
                  <div>Key achievements:</div>
                  <div>{workExperience.key_achievements || "N/A"}</div>
                </div>
                <div className={styles.infoRow}>
                  <div>Summary:</div>
                  <div>{workExperience.summary || "N/A"}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>Education</div>
            <div>
              {resume.education?.map((education, i) => (
                <div key={i} className={styles.educationExperience}>
                  <div className={styles.school}>{education.school_name}</div>
                  <div className={styles.degree}>{education.degree}</div>
                  <div className={styles.hint}>
                    <div>{education.duration}</div>
                    {!!education.grade && (
                      <div className={styles.grade}>{education.grade}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateResume;
