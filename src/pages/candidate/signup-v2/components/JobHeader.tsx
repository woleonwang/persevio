import { getCompanyLogo } from "@/utils";

import styles from "../style.module.less";

type TJobHeaderProps = {
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
};

const JobHeader: React.FC<TJobHeaderProps> = ({
  jobTitle,
  companyName,
  companyLogo,
}) => {
  const logoMark = companyLogo ? (
    <img
      src={getCompanyLogo(companyLogo)}
      alt={companyName}
      className={styles.jobLogo}
    />
  ) : (
    <div className={styles.jobLogoFallback}>
      {companyName.charAt(0).toUpperCase() || "?"}
    </div>
  );

  return (
    <div className={`${styles.jobHeader} ${styles.jobHeaderCard}`}>
      {logoMark}
      <div className={styles.jobMeta}>
        <div className={styles.jobEyebrow}>Applying for</div>
        <div className={styles.jobTitleRow}>
          <span className={styles.jobTitleText}>{jobTitle}</span>
          <span className={styles.jobCompanyDot}> · </span>
          <span className={styles.variableToken}>{companyName}</span>
        </div>
      </div>
    </div>
  );
};

export default JobHeader;
