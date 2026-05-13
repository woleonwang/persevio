import React from "react";
import classnames from "classnames";

import styles from "./style.module.less";
import TwoStar from "@/assets/icons/two-star";
import Icon from "@/components/Icon";

export interface IProps {
  title: string;
  icon?: React.ReactNode;
  details: {
    title: string;
    subTitle?: string;
    tag?: string;
  }[];
  layout?: "timeline" | "stack";
}

const ListCard: React.FC<IProps> = (props) => {
  const { title, icon, details, layout = "timeline" } = props;
  const isTimeline = layout === "timeline";
  const isLast = (index: number) => index === details.length - 1;

  return (
    <div className={classnames(styles.card)}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={styles.cardContent}>
        {icon ? (
          <div className={styles.cardIcon}>
            <Icon icon={icon} />
          </div>
        ) : null}
        {details.length > 0 ? (
          <div className={styles.list}>
            {details.map((row, index) => (
              <div
                key={`${row.title}-${index}`}
                className={classnames(
                  styles.item,
                  !isTimeline && styles.itemStack,
                )}
              >
                {icon ? null : isTimeline ? (
                  <div className={styles.rail}>
                    <span className={styles.dot} />
                    {!isLast(index) ? <span className={styles.spine} /> : null}
                  </div>
                ) : (
                  <span className={styles.sparkles}>
                    <Icon icon={<TwoStar />} />
                  </span>
                )}
                <div
                  className={classnames(
                    styles.itemBody,
                    !isTimeline && styles.itemBodyStack,
                  )}
                >
                  <div
                    className={classnames(
                      styles.itemHeader,
                      !isTimeline && styles.itemHeaderStack,
                    )}
                  >
                    <div className={styles.textBlock}>
                      <div className={styles.itemTitle}>{row.title}</div>
                      {row.subTitle ? (
                        <div className={styles.itemSubtitle}>
                          {row.subTitle}
                        </div>
                      ) : null}
                    </div>
                    {row.tag ? (
                      <span className={styles.tag}>{row.tag}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

ListCard.displayName = "ListCard";

export default ListCard;
