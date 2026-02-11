import Icon from "@/components/Icon";
import styles from "./style.module.less";
import Phone from "@/assets/icons/phone";
import MailCheck from "@/assets/icons/mail-check";
import Link2 from "@/assets/icons/link2";
import Github from "@/assets/icons/github";
import Map from "@/assets/icons/map";
import Experience from "@/assets/icons/experience";
import Education from "@/assets/icons/education";
import classnames from "classnames";
import School from "@/assets/icons/school";
import LocationFilled from "@/assets/icons/location-filled";
import Honors from "@/assets/icons/honors";
import Sword from "@/assets/icons/sword";
import Additional from "@/assets/icons/additional";

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
    <div className={styles.container}>
      <div className={styles.contactInfo}>
        <div className={styles.contactInfoName}>{metadata.candidate_name}</div>
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

      <div className={styles.professionalSummary}>{professional_summary}</div>

      {(experience ?? []).length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Icon
              icon={<Experience />}
              style={{ fontSize: 20, color: "#3682fe" }}
            />{" "}
            Experience
          </div>
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
                    <Icon icon={<Map />} style={{ fontSize: 18 }} />
                    <div>{work.location}</div>
                  </div>
                  <div className={styles.listContentDescription}>
                    {work.company_description}
                  </div>
                  <div className={styles.listContentBullets}>
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
          <div className={styles.sectionTitle}>
            <Icon
              icon={<Education />}
              style={{ fontSize: 20, color: "#26BC5D" }}
            />
            Education
          </div>
          <div className={styles.listContent}>
            {education.map((edu, index) => {
              return (
                <div
                  key={index}
                  className={classnames(styles.listItem, styles.noBorder)}
                >
                  <div className={styles.listTitle}>
                    <div className={styles.listTitleCompany}>{edu.degree}</div>
                    <div>{edu.year}</div>
                  </div>
                  <div className={styles.educationBasicInfo}>
                    <div className={styles.educationInstitution}>
                      <Icon
                        icon={<School />}
                        style={{ color: "rgba(38, 188, 93, 1)", fontSize: 18 }}
                      />
                      {edu.institution}
                    </div>
                    <div className={styles.educationLocation}>
                      <Icon
                        icon={<LocationFilled />}
                        style={{ color: "rgba(38, 188, 173, 1)", fontSize: 18 }}
                      />
                      {edu.location}
                    </div>
                    <div className={styles.educationHonors}>
                      <Icon
                        icon={<Honors />}
                        style={{ color: "rgba(249, 169, 48, 1)", fontSize: 18 }}
                      />
                      Honers:{" "}
                      <span style={{ fontWeight: "normal" }}>{edu.honors}</span>
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
          <div className={styles.sectionTitle}>
            <Icon
              icon={<Sword />}
              style={{ fontSize: 20, color: "rgba(249, 169, 48, 1)" }}
            />{" "}
            Skills
          </div>
          <div>
            {skills.categories.map((skill, index) => {
              return (
                <div
                  key={index}
                  className={classnames(styles.skillItem, styles.bgYellow)}
                >
                  <span className={styles.skillCategory}>
                    •&nbsp;&nbsp;{skill.category}:{" "}
                  </span>
                  <span>{skill.skills.join(",")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(additional ?? []).length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Icon
              icon={<Additional />}
              style={{ fontSize: 20, color: "#3682fe" }}
            />{" "}
            Additional
          </div>
          <div>
            {additional.map((item, index) => {
              return (
                <div key={index} className={styles.skillItem}>
                  <span className={styles.skillCategory}>
                    •&nbsp;&nbsp;{item.type}:{" "}
                  </span>
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
