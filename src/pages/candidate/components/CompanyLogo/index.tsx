import { getImgSrc } from "@/utils";
import styles from "./style.module.less";

interface IProps {
  logo: string;
}
const CompanyLogo = (props: IProps) => {
  const { logo } = props;
  return (
    <div className={styles.companyLogo}>
      <img src={getImgSrc(logo)} />
    </div>
  );
};

export default CompanyLogo;
