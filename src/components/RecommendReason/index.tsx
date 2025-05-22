import classnames from "classnames";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import MarkdownContainer from "../MarkdownContainer";

interface IProps {
  result: RoleOpportunityReport;
}
const RecommendReason = (props: IProps) => {
  const { result } = props;
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`recommend_reason.${key}`);

  return (
    <div className={styles.recommendReason}>
      <div className={styles.recommendReasonTitle}>{t("recommend_reason")}</div>
      <div className={styles.recommendReasonContent}>
        <div className={styles.summaryMatch}>
          <div className={styles.summaryMatchTitle}>
            <div>{t("overall")}</div>
            <div
              className={classnames(
                styles.summaryMatchTitleHint,
                styles[result.overall_potential_fit.level]
              )}
            >
              {result.overall_potential_fit.level}
            </div>
          </div>
          <div className={styles.summaryMeet}>
            <div className={styles.summaryMeetItem}>
              <div className={styles.summaryMeetItemName}>
                {t("competency_match")}
              </div>
              <div className={styles.summaryMeetItemValue}>
                {result.competency_match.level}
              </div>
            </div>
            <div className={styles.summaryMeetItem}>
              <div className={styles.summaryMeetItemName}>
                {t("career_aspirations_match")}
              </div>
              <div className={styles.summaryMeetItemValue}>
                {result.career_aspirations_match.level}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.blockTitle}>{t("summary")}</div>
        <div className={styles.summary}>
          <MarkdownContainer content={result.overall_potential_fit.summary} />
        </div>

        <div className={styles.blockTitle}>
          {"Potential gaps or considerations"}
        </div>
        <div>
          <div style={{ paddingLeft: 12 }}>
            {result.detailed_alignment_analysis.potential_gaps_or_considerations.map(
              (item) => {
                return (
                  <div className={classnames(styles.criterionTitle)} key={item}>
                    <MarkdownContainer content={item} />
                  </div>
                );
              }
            )}
          </div>
        </div>

        <div className={styles.blockTitle}>{"Why you might be interested"}</div>
        <div style={{ paddingLeft: 12 }}>
          {result.detailed_alignment_analysis.why_you_might_be_interested.map(
            (item) => {
              return (
                <div className={classnames(styles.criterionTitle)} key={item}>
                  <MarkdownContainer content={item} />
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendReason;
