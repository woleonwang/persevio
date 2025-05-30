import { useEffect, useState } from "react";
import { parseJSON } from "@/utils";
import { Get } from "@/utils/request";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { Empty, Tabs } from "antd";
import MarkdownContainer from "@/components/MarkdownContainer";

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
  const [status, setStatus] = useState<TTabKey>("resume");
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
      <Tabs
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
      />
      {status === "biography" && (
        <div style={{ padding: 20, overflow: "auto" }}>
          <MarkdownContainer
            content={`
# Upbringing & Education
Born and raised in China, Gengxin's academic prowess earned him a prestigious full Singapore Ministry of Education Scholarship, a program designed to attract China's top college entrance examination performers to Singapore. He pursued his university education at the National University of Singapore (NUS).
At NUS, Gengxin studied Mechanical Engineering, graduating with an honours degree. However, during his university years, he discovered a stronger inclination towards business-oriented pursuits rather than a traditional engineering career. This burgeoning interest in entrepreneurship manifested when he co-founded Streetgaga, an e-commerce aggregator service. Alongside friends, he aimed to consolidate small "Fashion blog shops," simplifying discovery for consumers. While Streetgaga did not achieve commercial takeoff, it marked Gengxin's valuable first foray into the entrepreneurial world.

# Work Experience
## Evolution Recruitment (October 2013 - April 2016)
Gengxin commenced his professional career at Evolution Recruitment, a UK-based boutique firm specializing in technology recruitment. At the time, Evolution's Singapore office comprised approximately 20 employees, primarily 360-degree recruitment consultants, fostering a diverse environment with professionals from Singapore, Europe, China, India, and Malaysia, with English as the primary working language.
He chose recruitment as his starting point, drawn by the opportunity to connect with a diverse range of interesting individuals and build a robust professional network. The success of a friend already established in the field further solidified his decision.
In his role as a 360 Recruitment Consultant, Gengxin essentially operated his own recruitment desk within Evolution. His responsibilities spanned the entire recruitment lifecycle, from client acquisition and sales cycle management—including prospecting, lead generation, and negotiating service agreements—to candidate sourcing and process management. Once agreements were secured, he sourced candidates through multiple channels, including Evolution's proprietary database, external databases like Monster and eFinancialCareers, LinkedIn, and his personal network. He meticulously managed the recruitment process, encompassing interview scheduling, candidate preparation and debriefing, salary negotiation, and offer closing. Initially focusing on Java Developer positions, he later broadened his scope to include general software engineering roles. His clientele ranged from large multinational corporations like British Petroleum and Singtel to technology companies such as Garena (at the time) and various early-stage startups.
Gengxin excelled at Evolution. He was the only fresh graduate in his cohort of seven to pass the probation period, subsequently earning the "Rookie of the Year" award for 2014. Remarkably, he also became the overall top biller for Evolution Singapore in 2014, with billings around SGD 300,000—a significant validation of his recruitment acumen as a newcomer. His rapid progression saw him promoted from Associate Consultant to Consultant, and then to Senior Consultant within a single year, a record at the time. He remained a consistent top performer throughout his nearly three-year tenure at Evolution.
Reflecting on his success at Evolution, Gengxin attributes it to several factors:
Diligent Work Ethic: As a rookie with no prior recruitment experience, he demonstrated exceptional dedication, consistently exceeding quotas for client and candidate outreach and committing to continuous learning.
Rapid Learning Agility: He quickly assimilated knowledge from company training and independent research, swiftly getting up to speed in a new field.
Strong Fundamental Skills: His well-honed communication skills and his ability to deeply understand client and candidate underlying needs were crucial to his achievements.

## 100Offer (Shanghai Qidian) (May 2016 - September 2017)
Gengxin transitioned from Evolution Recruitment when 100Offer, an online talent marketplace originating from China, approached him to lead and launch their Singapore operations from the ground up. Attracted by 100Offer's innovative platform and the exciting prospects it presented, Gengxin embraced the opportunity. This General Manager role, starting as the first employee in Singapore, aligned perfectly with his entrepreneurial aspirations.
100Offer specialized in connecting employers with top-tier software engineers, meticulously qualifying both candidates and employers to ensure a high-quality marketplace. An early-stage, venture-backed startup, 100Offer had secured over 40 million RMB in two funding rounds and had a global team of approximately 70, with the majority in China (around 55), Singapore (around 10), and a smaller presence in the US (under 5).
The company's expansion into Singapore was prompted by organic interest from Singapore-based employers who discovered the platform without targeted marketing. Recognizing this potential, 100Offer sought an experienced individual with strong local market knowledge to spearhead their Singaporean venture.

### General Manager, Singapore (May 2016 - January 2017)
As the first employee and General Manager for Singapore, Gengxin's primary objective was to establish the Singapore operations from scratch, generate revenue, and manage the P&L. He reported directly to the company's COO.
His initial responsibilities were all-encompassing: registering the Singaporean entity, securing and designing office space, managing office renovations with contractors, hiring the foundational team, acquiring the initial cohorts of employers and candidates, and personally making the first few placements.
The Singapore team grew under his leadership to include a Product Manager (for product localization), a Performance Marketing Manager, a Content Marketing Manager, an Event Marketing Manager, two Sales Managers (client-side acquisition and process management), and two Talent Consultants (candidate-side acquisition and process management). This diverse team, with members from China, Singapore, and the US, operated in English internally, while communication with the China headquarters was in Chinese.
Initial client and candidate acquisition relied on:
The existing networks of Gengxin and his team, many of whom had prior recruitment experience.
Targeted LinkedIn marketing campaigns executed by the Performance Marketing Manager, in collaboration with the China-based team for product and ad material support.
Direct sales outreach by the Sales and Talent Consultant teams.
Gengxin remained deeply involved in the sales and placement processes. For instance, he personally generated the lead for Adnovum, a Swiss software consulting company looking to expand in Singapore, which became 100Offer Singapore's first client. He then worked closely with the sales manager, attending meetings to demo the platform, address concerns, negotiate terms, and ultimately close the deal. He provided similar hands-on support to the Talent Consultants to ensure candidate-side success.
During his tenure as GM, 100Offer Singapore successfully onboarded over 100 employers and attracted more than 1,000 registered candidates, achieving an annualized revenue run rate of SGD 1 million.

### General Manager USA, San Francisco (January 2017 - September 2017)
Following the successful launch in Singapore, Gengxin was tasked with spearheading 100Offer's expansion into San Francisco. The company targeted the Bay Area due to its high concentration of software engineers and its status as a global tech hub.
Preparations for the US launch began in January 2017 while Gengxin was still managing the stabilized Singapore operations. He liaised with US-based agencies to handle administrative setup, including office registration and bank account establishment. He physically relocated to San Francisco in April 2017.
Initially operating solo, Gengxin managed every aspect of setting up the US presence. His first priority was to build a local team. He personally handled the recruitment process for the initial hires – a Sales Manager (to acquire employers) and a Talent Consultant (to source candidates) – from defining role requirements and compensation, to market research for sourcing channels, engaging recruitment agencies, and managing the entire hiring cycle through to onboarding. He successfully filled these roles within a month.
Gengxin then worked closely with this nascent team on all operational fronts: employer and candidate acquisition, process management, and ensuring customer success with the platform. Given the early stage, many processes were manual, requiring his direct involvement to troubleshoot and drive results. He also collaborated with the marketing teams in China and Singapore on targeted candidate campaigns and content generation.
Under his leadership in San Francisco, the team acquired 10 employers, registered 134 candidates, and facilitated 10 placements. However, the US operation was shut down in September 2017 due to insufficient traction, with the company deciding against further investment.
Gengxin reflects that the US venture faced different challenges than Singapore. Key factors included the lack of pre-existing organic demand in the US market for 100Offer's specific model and the company's limited resources and nuanced understanding of the highly competitive San Francisco market dynamics.
`}
          />
        </div>
      )}
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
