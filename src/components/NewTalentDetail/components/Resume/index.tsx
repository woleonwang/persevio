import classnames from "classnames";
import styles from "./style.module.less";
import { TTalentResume } from "../../type";
import Icon from "@/components/Icon";
import Phone from "@/assets/icons/phone";
import MailCheck from "@/assets/icons/mail-check";
import Link2 from "@/assets/icons/link2";
import MarkdownContainer from "@/components/MarkdownContainer";

interface IProps {
  resume: TTalentResume;
}
const Resume = (props: IProps) => {
  const { resume } = props;
  const {
    contact_information: contact,
    work_experience: workExperience,
    education,
    certifications,
    projects,
    languages,
    other,
  } = resume;

  return (
    <div className={styles.container}>
      <div className={styles.contactInfo}>
        <div className={styles.contactInfoName}>{contact.name}</div>
        <div className={styles.contactInfoItems}>
          {!!contact.phone && (
            <div className={styles.contactInfoItem}>
              <Icon icon={<Phone />} />
              {contact.phone}
            </div>
          )}
          {!!contact.email && (
            <div className={styles.contactInfoItem}>
              <Icon icon={<MailCheck />} />
              {contact.email}
            </div>
          )}
          {!!contact.linkedin && (
            <div className={styles.contactInfoItem}>
              {" "}
              <Icon icon={<Link2 />} />
              <a
                href={contact.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                {contact.linkedin}
              </a>
            </div>
          )}
        </div>
      </div>
      {resume.summary && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>SUMMARY</div>
          <div className={styles.sectionContent}>
            <MarkdownContainer content={resume.summary} />
          </div>
        </div>
      )}
      {resume.skills && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>SKILLS</div>
          <div className={styles.sectionContent}>
            <MarkdownContainer content={resume.skills} />
          </div>
        </div>
      )}
      {resume.patents && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>PATENTS</div>
          <div className={styles.sectionContent}>
            <MarkdownContainer content={resume.patents} />
          </div>
        </div>
      )}
      {resume.professional_affiliations && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>PROFESSIONAL AFFILIATIONS</div>
          <div className={styles.sectionContent}>
            <MarkdownContainer content={resume.professional_affiliations} />
          </div>
        </div>
      )}
      {/* {resume.extraction_notes && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>EXTRACTION NOTES</div>
          <div className={styles.sectionContent}>{resume.extraction_notes}</div>
        </div>
      )} */}
      {(workExperience ?? []).length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>WORK EXPERIENCE</div>
          <div className={styles.listContent}>
            {workExperience.map((work, index) => {
              return (
                <div key={index} className={styles.listItem}>
                  <div className={styles.listTitle}>
                    <div className={styles.listTitleCompany}>
                      {work.company}
                    </div>
                    <div>
                      {work.start_date} ~ {work.end_date}
                    </div>
                  </div>
                  <div className={styles.listContentItem}>
                    <div>{work.title}</div>
                    <div>{work.location}</div>
                  </div>
                  {!!work.description && (
                    <div className={styles.listContentDescription}>
                      <MarkdownContainer content={work.description} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {(education ?? []).length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>EDUCATION</div>
          <div className={styles.listContent}>
            {education.map((education, index) => {
              return (
                <div key={index} className={styles.listItem}>
                  <div className={styles.listTitle}>
                    <div className={styles.listTitleInstitution}>
                      {education.institution}
                    </div>
                    <div className={styles.listTitleDegree}>
                      {education.start_date} ~ {education.end_date}
                    </div>
                  </div>
                  <div className={styles.listContentItem}>
                    <div>{education.field_of_study}</div>
                    <div>{education.degree}</div>
                  </div>
                  {!!education.gpa && (
                    <div
                      className={classnames(
                        styles.listContentDescription,
                        styles.listPoint
                      )}
                    >
                      {education.gpa}
                    </div>
                  )}
                  {!!education.honors && (
                    <div
                      className={classnames(
                        styles.listContentDescription,
                        styles.listPoint
                      )}
                    >
                      {education.honors}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {(certifications ?? []).length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>CERTIFICATIONS</div>
          <div className={styles.listContent}>
            {certifications.map((certification, index) => {
              return (
                <div key={index} className={styles.listItem}>
                  <div className={styles.listTitle}>
                    <div>{certification.name}</div>
                    <div>{certification.date_obtained}</div>
                  </div>
                  <div className={styles.listContentDescription}>
                    {certification.issuing_organization}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {(projects ?? []).length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>PROJECTS</div>
          <div className={styles.listContent}>
            {projects.map((project, index) => {
              return (
                <div key={index} className={styles.listItem}>
                  <div className={styles.listTitle}>
                    <div className={styles.listTitleName}>{project.name}</div>
                    {!!project.start_date && !!project.end_date && (
                      <div>
                        {project.start_date} ~ {project.end_date}
                      </div>
                    )}
                  </div>
                  {!!project.description && (
                    <div className={classnames(styles.listContentDescription)}>
                      <MarkdownContainer content={project.description} />
                    </div>
                  )}
                  {!!project.technologies && (
                    <div
                      className={classnames(
                        styles.listContentDescription,
                        styles.listPoint
                      )}
                    >
                      {project.technologies}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {(languages ?? []).length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>LANGUAGES</div>
          <div className={styles.listContent}>
            {languages.map((language, index) => {
              return (
                <div key={index} className={classnames(styles.listItem)}>
                  <div className={styles.listTitle}>{language.language}</div>
                  <div className={styles.listContentDescription}>
                    {language.proficiency}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {(other ?? []).length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>PUBLICATIONS</div>
          <div className={styles.listContent}>
            {other.map((other, index) => {
              return (
                <div key={index} className={styles.listItem}>
                  <div className={styles.listTitle}>{other.section_title}</div>
                  <div className={styles.listContentDescription}>
                    <MarkdownContainer content={other.content} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Resume;
