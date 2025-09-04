import MarkdownContainer from "@/components/MarkdownContainer";
import styles from "./style.module.less";
import classnames from "classnames";

type TWorkExperience = {
  company_name: string;
  position: string;
  start_date: string;
  end_date: string;
  description: string;
};
const CandidateDrawerContent = (props: { candidate: ICandidateSettings }) => {
  const { candidate } = props;

  const resumeContent = () => {
    if (candidate.work_experience) {
      const workExperiences = JSON.parse(
        candidate.work_experience
      ) as TWorkExperience[];

      return workExperiences.map((workExperience) => (
        <div
          key={workExperience.company_name}
          className={styles.workExperienceItemWrapper}
        >
          <div className={styles.workExperienceItem}>
            <div className={styles.workExperienceItemLabel}>公司:</div>
            <div>{workExperience.company_name}</div>
          </div>
          <div className={styles.workExperienceItem}>
            <div className={styles.workExperienceItemLabel}>职位:</div>
            <div>{workExperience.position}</div>
          </div>
          <div className={styles.workExperienceItem}>
            <div className={styles.workExperienceItemLabel}>工作时间:</div>
            <div>
              {workExperience.start_date} - {workExperience.end_date ?? "至今"}
            </div>
          </div>
          <div
            className={classnames(
              styles.workExperienceItem,
              styles.description
            )}
          >
            <div className={styles.workExperienceItemLabel}>描述:</div>
            <div>{workExperience.description}</div>
          </div>
        </div>
      ));
    } else {
      return <MarkdownContainer content={candidate.resume_content} />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.title}>个人资料</div>
        <div>{resumeContent()}</div>
      </div>
      <div className={styles.right}>
        <div className={styles.title}>连接需求</div>
        <MarkdownContainer content={candidate.net_working_requests} />
      </div>
    </div>
  );
};

export default CandidateDrawerContent;
