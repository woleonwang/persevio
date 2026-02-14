import classnames from "classnames";
import styles from "./style.module.less";
import dayjs from "dayjs";
import EvaluateResultBadge from "@/components/EvaluateResultBadge";
import Icon from "@/components/Icon";
import TwoStar from "@/assets/icons/two-star";
import Stars from "@/assets/icons/stars";
import OneStar from "@/assets/icons/one-star";
import { useTranslation } from "react-i18next";
import EvaluateFeedback from "@/components/EvaluateFeedback";

type TReport = {
  thumbnail_summary: string;
  created_at: string;

  overall_recommendation: {
    result: string;
    skills_fit: {
      level: string;
      explanation: string;
    };
    logistics_fit: {
      level: string;
      explanation: string;
    };
    recruiter_note: string;
  };

  summary: {
    description: string;
    interest_level: {
      level: string;
      explanation: string;
    };
  };

  requirements: {
    level: "p0" | "p1" | "p2";
    description: string;
    assessment: string;
    reasoning: string;

    // 兼容老数据
    assessment_type: string;
  }[];

  profile_snapshot: {
    title: string;
    details: string;
  }[];

  key_information: {
    title: string;
    details: string;
  }[];

  ai_interview_summary: {
    topics_covered: string[];
    key_revelations: string[];
    interview_observations: { title: string; details: string }[];
  };
  key_strengths: {
    title: string;
    details: string;
  }[];
  potential_gaps: {
    title: string;
    details: string;
  }[];
  areas_to_probe_further: {
    title: string;
    details: string;
  }[];

  // 兼容老数据
  snapshots: {
    title: string;
    content: string;
  }[];
  areas_to_probe_futher: {
    title: string;
    details: string;
  }[];
};

interface IProps {
  candidateName: string;
  jobName: string;
  report: TReport;
  evaluateFeedback: TEvaluateFeedback;
  onChangeEvaluateFeedback: (value: TEvaluateFeedback) => void;
  onOpenEvaluateFeedback: () => void;
}

const Report: React.FC<IProps> = (props) => {
  const {
    report,
    candidateName,
    jobName,
    evaluateFeedback,
    onChangeEvaluateFeedback,
    onOpenEvaluateFeedback,
  } = props;

  const { t: originalT } = useTranslation();

  const requirementsSummaryMappings: Record<
    "p0" | "p1" | "p2",
    {
      level: "p0" | "p1" | "p2";
      description: string;
      assessment: string;
      reasoning: string;

      // 兼容老数据
      assessment_type: string;
    }[]
  > = {
    p0: [],
    p1: [],
    p2: [],
  };

  (report.requirements ?? []).forEach((item) => {
    requirementsSummaryMappings[item.level].push(item);
  });

  return (
    <div className={styles.reportContainer}>
      <div className={classnames(styles.block, styles.headerCard)}>
        <div className={styles.headerCardHeader}>
          <div className={styles.headerCardHeaderTitle}>
            Candidate Recommendation Report:
          </div>
          <div>
            Date:{" "}
            <span>
              {report.created_at
                ? dayjs(report.created_at).format("YYYY-MM-DD")
                : "N.A."}
            </span>
          </div>
        </div>
        <div className={styles.name}>
          {candidateName} for {jobName}
        </div>
        <div className={styles.overallRecommendation}>
          <div>Overall Recommendation</div>
          <div>
            <EvaluateResultBadge result={"good_fit"} />
          </div>
        </div>
      </div>

      <div className={styles.block}>
        <div
          className={styles.blockTitle}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Here's my feedback
          <EvaluateFeedback
            value={evaluateFeedback}
            onChange={onChangeEvaluateFeedback}
            onOpen={onOpenEvaluateFeedback}
          />
        </div>
      </div>

      <div className={styles.block}>
        <div className={styles.blockTitle}>Summary</div>
        <div className={styles.summary}>
          {report.summary.description ?? report.summary}
        </div>
      </div>

      <div className={styles.block}>
        <div className={styles.blockTitle}>Requirements Summary</div>
        <div className={styles.requirementsSummary}>
          {Object.keys(requirementsSummaryMappings).map((level) => {
            const items =
              requirementsSummaryMappings[level as "p0" | "p1" | "p2"];
            const meetCount = items.filter(
              (item) =>
                item.assessment === "meets" || item.assessment_type === "meets"
            ).length;
            const partiallyMeetCount = items.filter(
              (item) =>
                item.assessment === "partially_meets" ||
                item.assessment_type === "partially_meets"
            ).length;
            return (
              <div
                className={classnames(styles[level], styles.requirementItem)}
              >
                <Icon
                  icon={
                    {
                      p0: <Stars />,
                      p1: <TwoStar />,
                      p2: <OneStar />,
                    }[level]
                  }
                />
                <span className={styles.bold}>
                  {meetCount} of {items.length} {level}{" "}
                </span>{" "}
                requirements met
                {partiallyMeetCount > 0 && `(${partiallyMeetCount} partially)`}
              </div>
            );
          })}
        </div>
        <div className={styles.requirementsSummaryTable}>
          <div
            className={classnames(
              styles.requirementsSummaryRow,
              styles.requirementsSummaryHeader
            )}
          >
            <div>Priority</div>
            <div>Job Requirements</div>
            <div>Assessment</div>
            <div>Reasoning</div>
          </div>
          {Object.values(requirementsSummaryMappings)
            .flat()
            .map((item, index) => {
              return (
                <div
                  key={index}
                  className={classnames(
                    styles.requirementsSummaryRow,
                    styles.requirementsSummaryItem,
                    styles[item.level]
                  )}
                >
                  <div>{item.level}</div>
                  <div>{item.description}</div>
                  <div className={styles[item.assessment]}>
                    {originalT(
                      `assessment_options.${
                        item.assessment ?? item.assessment_type
                      }`
                    )}
                  </div>
                  <div>{item.reasoning}</div>
                </div>
              );
            })}
        </div>
      </div>
      <div className={styles.block}>
        <div className={styles.blockTitle}>Profile Snapshot</div>
        <div>
          {(report.profile_snapshot ?? []).map((snapshot, index) => {
            return (
              <div key={index} className={styles.listItem}>
                <span className={styles.listTitle}>{snapshot.title}:</span>
                <span className={classnames(styles.snapshotContent, "bgNone")}>
                  {snapshot.details}
                </span>
              </div>
            );
          })}
          {(report.snapshots ?? []).map((snapshot, index) => {
            return (
              <div key={index} className={styles.listItem}>
                <span className={styles.listTitle}>{snapshot.title}:</span>
                <span className={classnames(styles.snapshotContent, "bgNone")}>
                  {snapshot.content}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.block}>
        <div className={styles.blockTitle}>Key Information</div>
        <div className={styles.keyInformationTable}>
          <div
            className={classnames(
              styles.keyInformationRow,
              styles.keyInformationHeader
            )}
          >
            <div>Item</div>
            <div>Details</div>
          </div>
          {(report.key_information ?? []).map((information, index) => {
            return (
              <div
                key={index}
                className={classnames(
                  styles.keyInformationRow,
                  styles.keyInformationItem
                )}
              >
                <div>{information.title}</div>
                <div>{information.details}</div>
              </div>
            );
          })}
        </div>
      </div>
      {(report.potential_gaps ?? []).length > 0 && (
        <div className={styles.block}>
          <div className={styles.blockTitle}>Potential Gaps</div>
          <div>
            {(report.potential_gaps ?? []).map((gap, index) => {
              return (
                <div key={index} className={styles.listItem}>
                  <span className={styles.listTitle}>{gap.title}:</span>
                  <span className={classnames(styles.gapContent, "bgNone")}>
                    {gap.details}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {(report.areas_to_probe_further ?? report.areas_to_probe_futher ?? [])
        .length > 0 && (
        <div className={styles.block}>
          <div className={styles.blockTitle}>Areas to Probe Further</div>
          <div>
            {(report.areas_to_probe_further ?? []).map((area, index) => {
              return (
                <div key={index} className={styles.listItem}>
                  <span className={styles.listTitle}>{area.title}:</span>
                  <span className={classnames(styles.areaContent, "bgNone")}>
                    {area.details}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
export default Report;
