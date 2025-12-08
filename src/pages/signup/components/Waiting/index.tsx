import { Empty } from "antd";
import CompanyWaiting from "@/assets/company-waiting.png";
import styles from "../../style.module.less";
interface IProps {
  status: string;
}
const Waiting: React.FC<IProps> = (props) => {
  const { status } = props;

  return (
    <div className={styles.waiting}>
      <Empty
        image={
          <img
            src={CompanyWaiting}
            alt="company-waiting"
            className={styles.image}
          />
        }
        description={
          <div>
            <div className={styles[status]}>
              {status === "rejected" ? "Application Rejected" : "Under Review"}
            </div>
            <div>
              {status === "rejected"
                ? "Sorry,your account has not been approved.Please contact admin@persevio.ai for assistance."
                : "Thank you for your interest.We’ll contact you soon."}
            </div>
          </div>
        }
      />
    </div>
  );
};

export default Waiting;
