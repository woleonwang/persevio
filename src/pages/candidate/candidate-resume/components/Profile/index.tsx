import Icon from "@/components/Icon";
import styles from "./style.module.less";
import Phone from "@/assets/icons/phone";
import MailCheck from "@/assets/icons/mail-check";
import Link2 from "@/assets/icons/link2";
import Github from "@/assets/icons/github";

export type TProfile = {
  metadata: {
    candidate_name: string;
    generated_date: string;
    version: number;
  };

  contact: {
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedin: string | null;
    website: string | null;
  };

  professional_summary: string;

  experience: [
    {
      title: string;
      company: string;
      company_description: string | null;
      start_date: string;
      end_date: string;
      location: string | null;
      bullets: string[];
    }
  ];

  education: {
    degree: string;
    institution: string;
    year: string | null;
    location: string | null;
    honors: string | null;
  }[];

  skills: {
    categories: {
      category: string;
      skills: string[];
    }[];
  };

  additional: {
    type: string;
    description: string;
  }[];
};

interface IProfileProps {
  profile: TProfile;
}

const Profile = (props: IProfileProps) => {
  const { profile } = props;
  const {
    metadata,
    contact,
    professional_summary,
    experience,
    education,
    skills,
    additional,
  } = profile;

  return (
    <div>
      <div>
        <div>{metadata.candidate_name}</div>
        <div>
          <div className={styles.contactInfoItems}>
            <div className={styles.contactInfoItem}>
              <Icon icon={<Phone />} />
              {contact.phone}
            </div>
            <div className={styles.contactInfoItem}>
              <Icon icon={<MailCheck />} />
              {contact.email}
            </div>
            <div className={styles.contactInfoItem}>
              {" "}
              <Icon icon={<Link2 />} />
              <a
                href={contact.linkedin ?? ""}
                target="_blank"
                rel="noopener noreferrer"
              >
                {contact.linkedin}
              </a>
            </div>
            <div className={styles.contactInfoItem}>
              {" "}
              <Icon icon={<Github />} />
              <a
                href={contact.website ?? ""}
                target="_blank"
                rel="noopener noreferrer"
              >
                {contact.website ?? ""}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div>{professional_summary}</div>

      {(experience ?? []).length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>WORK EXPERIENCE</div>
          <div className={styles.listContent}>
            {experience.map((work, index) => {
              return (
                <div key={index} className={styles.listItem}>
                  <div className={styles.listTitle}>
                    <div className={styles.listTitleCompany}>
                      {work.title} in {work.company}
                    </div>
                    <div>
                      {work.start_date} ~ {work.end_date}
                    </div>
                  </div>
                  <div className={styles.listContentItem}>
                    <div>{work.location}</div>
                  </div>
                  <div className={styles.listContentDescription}>
                    {work.company_description}
                  </div>
                  <div>
                    {work.bullets.map((bullet, index) => {
                      return (
                        <div key={index} className={styles.listContentBullet}>
                          {bullet}
                        </div>
                      );
                    })}
                  </div>
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
            {education.map((edu, index) => {
              return (
                <div key={index} className={styles.listItem}>
                  <div className={styles.listTitle}>
                    <div className={styles.listTitleCompany}>{edu.degree}</div>
                    <div>{edu.year}</div>
                  </div>
                  <div>
                    <div>{edu.institution}</div>
                    <div>{edu.location}</div>
                    <div className={styles.listContentDescription}>
                      Honers: {edu.honors}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(skills?.categories ?? []).length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>SKILLS</div>
          <div className={styles.listContent}>
            {skills.categories.map((skill, index) => {
              return (
                <div key={index} className={styles.listItem}>
                  <span>{skill.category}: </span>
                  <span>{skill.skills.join(",")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(additional ?? []).length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>ADDITIONAL</div>
          <div className={styles.listContent}>
            {additional.map((item, index) => {
              return (
                <div key={index} className={styles.listItem}>
                  <span>{item.type}: </span>
                  <span>{item.description}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
