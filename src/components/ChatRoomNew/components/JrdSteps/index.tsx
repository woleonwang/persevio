import classnames from "classnames";

import styles from "./style.module.less";
import { Popover } from "antd";
const JrdSteps = (props: { current: number; collapse: boolean }) => {
  const { current, collapse } = props;

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
      {steps.map((step, index) => {
        let status = "waiting";
        if (index < current) {
          status = "done";
        } else if (index === current) {
          status = "active";
        }
        return (
          <div
            key={step.key}
            className={classnames(styles.step, styles[status])}
          >
            <Popover content={step.title} placement="right">
              <div className={styles.dot}></div>
            </Popover>
            {!collapse && (
              <div className={styles.stepContentContainer}>
                <div className={styles.stepContent}>{step.title}</div>
                {status === "active" && (
                  <div className={styles.stepTime}>
                    Remining:{" "}
                    <span
                      className={styles.stepTimeValue}
                    >{`${step.time}min`}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default JrdSteps;
