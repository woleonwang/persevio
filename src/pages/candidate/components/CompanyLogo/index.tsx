import { getCompanyLogo } from "@/utils";
import styles from "./style.module.less";

interface IProps {
  logo: string;
}
const CompanyLogo = (props: IProps) => {
  const { logo } = props;
  return (
    <div className={styles.companyLogo}>
      <img src={getCompanyLogo(logo)} />
    </div>
  );
};

export default CompanyLogo;
