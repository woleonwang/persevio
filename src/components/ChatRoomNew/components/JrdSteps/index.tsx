import classnames from "classnames";
import { CheckOutlined } from "@ant-design/icons";

import styles from "./style.module.less";
const JrdSteps = (props: { current: number }) => {
  const { current } = props;

  const steps = [
    {
      key: "gatherRoleOverview",
      title: "Role Overview",
      time: 5,
    },
    {
      key: "keyResponsibilities",
      title: "Job Scope",
      time: 5,
    },
    {
      key: "dayToDayTasks",
      title: "Ideal Candidate Profile",
      time: 5,
    },
    {
      key: "candidateAssessmentCriteria",
      title: "Other Info",
      time: 5,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.grayLine} />
      <div
        className={styles.blueLine}
        style={{ width: `calc((100% - 320px) / 3 * ${current})` }}
      />
      <div className={styles.gradientLine} />
      <div className={styles.stepsContainer}>
        {steps.map((step, index) => {
          let status = "waiting";
          if (index < current) {
            status = "done";
          } else if (index === current) {
            status = "active";
          }
          return (
            <div key={step.key} className={styles.step}>
              <div className={classnames(styles.stepTitle, styles[status])}>
                {status === "done" ? (
                  <CheckOutlined style={{ fontSize: 14 }} />
                ) : (
                  index + 1
                )}
              </div>
              <div className={styles.stepContentContainer}>
                <div className={styles.stepContent}>{step.title}</div>
                {status === "active" && (
                  <div className={styles.stepTime}>
                    Remining:{`${step.time}min`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JrdSteps;
