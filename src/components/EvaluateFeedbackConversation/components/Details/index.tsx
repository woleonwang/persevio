import StaffChat from "@/components/StaffChat";

import styles from "./style.module.less";

interface IProps {
  jobId: number;
  talentId: number;
}
const Details = (props: IProps) => {
  const { jobId, talentId } = props;

  return (
    <div className={styles.container}>
      <StaffChat
        chatType="jobTalentEvaluateFeedback"
        jobId={jobId}
        talentId={talentId}
        hidePredefinedButtons
      />
    </div>
  );
};

export default Details;
