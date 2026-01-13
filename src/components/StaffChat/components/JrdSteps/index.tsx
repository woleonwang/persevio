import classnames from "classnames";
import { useTranslation } from "react-i18next";

import styles from "./style.module.less";
import { Popover } from "antd";
const JrdSteps = (props: { current: number; collapse: boolean }) => {
  const { current, collapse } = props;
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`chat.${key}`);

  const steps = [
    {
      key: "understand_role",
      title: t("jrd_step_understand_role"),
      time: 10,
    },
    {
      key: "align_icp",
      title: t("jrd_step_align_icp"),
      time: 6,
    },
    {
      key: "pitch_logistics",
      title: t("jrd_step_pitch_logistics"),
      time: 2,
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
                <div
                  className={styles.stepContent}
                  dangerouslySetInnerHTML={{ __html: step.title }}
                />
                {status === "active" && (
                  <div className={styles.stepTime}>
                    <span
                      className={styles.stepTimeValue}
                    >{`${step.time}min`}</span>{" "}
                    {t("jrd_step_left")}
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
