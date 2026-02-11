import classnames from "classnames";
import styles from "./style.module.less";

export type TInsight = {
  metadata: {
    candidate_name: string;
    generated_date: string;
    last_conversation_date: string;
    version: number;
  };

  professional_identity: {
    career_archetype: string;
    professional_summary: string;
    years_of_experience: string;
    primary_domain: string;
  };

  core_competencies: {
    competency: string;
    level: "expert" | "strong" | "competent";
    summary: string;
  }[];

  career_highlights: {
    company: string;
    title: string;
    period: string;
    summary: string;
  }[];

  career_motivations: {
    job_search_status: string;
    what_youre_looking_for: string;
    what_matters_most: string[];
    what_youre_avoiding: string[];
  };

  preferences: {
    role_type: string | null;
    seniority: string | null;
    ic_or_management: string | null;
    company_stage: string | null;
    company_size: string | null;
    industry: string | null;
    culture: string | null;
    location: string | null;
    remote_flexibility: string | null;
  };

  logistics: {
    current_location: string | null;
    work_authorization: string | null;
    current_compensation: string | null;
    target_compensation: string | null;
    notice_period: string | null;
    availability: string | null;
  };

  dealbreakers: string[];

  areas_for_further_discussion: {
    area: string;
    context: string;
  }[];
};

interface IProps {
  insight: TInsight;
}
const Insight = (props: IProps) => {
  const { insight } = props;

  const {
    metadata,
    professional_identity,
    core_competencies,
    career_highlights,
    career_motivations,
    preferences,
    logistics,
    dealbreakers,
    areas_for_further_discussion,
  } = insight;

  const { generated_date } = metadata;

  const {
    career_archetype,
    professional_summary,
    years_of_experience,
    primary_domain,
  } = professional_identity;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>Viona's Insights Report</div>
        <div className={styles.headerDate}>
          Date: &nbsp;<span>{generated_date}</span>
        </div>
      </div>

      <div className={styles.blocksContainer}>
        <div className={classnames(styles.block, styles.headerCard)}>
          <div className={styles.headerCardHeader}>
            <div>{years_of_experience}</div>
            <div>{primary_domain}</div>
          </div>
          <div className={styles.name}>Professional Identity</div>
          <div className={styles.textContainer}>
            <div className={styles.text}>{career_archetype}</div>
            <div className={styles.text}>{professional_summary}</div>
          </div>
        </div>

        <div className={styles.block}>
          <div className={styles.blockTitle}>Core Competencies</div>
          <div className={styles.coreCompetenciesTable}>
            <div
              className={classnames(
                styles.coreCompetenciesRow,
                styles.coreCompetenciesHeader
              )}
            >
              <div>Competency</div>
              <div>Level</div>
              <div>Summary</div>
            </div>
            {core_competencies.map((item, index) => {
              return (
                <div
                  key={index}
                  className={classnames(
                    styles.coreCompetenciesRow,
                    styles.coreCompetenciesItem
                  )}
                >
                  <div>{item.competency}</div>
                  <div className={styles[item.level]}>{item.level}</div>
                  <div>{item.summary}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.block}>
          <div className={styles.blockTitle}>Career Highlights</div>
          <div className={styles.listContent}>
            {career_highlights.map((item, index) => {
              return (
                <div key={index} className={styles.listItem}>
                  <div
                    className={classnames(
                      styles.listTitle,
                      styles.careerHighlightTitle
                    )}
                  >
                    <div>{item.title}</div>
                    <div>at</div>
                    <div>{item.company}</div>
                    <div>{item.period}</div>
                  </div>
                  <div className={styles.careerHighlightSummary}>
                    {item.summary}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.block}>
          <div className={styles.blockTitle}>Career Motivations</div>
          <div className={styles.careerMotivationContainer}>
            <div className={styles.careerMotivationItem}>
              <div className={styles.careerMotivationItemHeader}>
                <div>{career_motivations.what_youre_looking_for}</div>
                <div className={styles.careerMotivationItemTitleStatus}>
                  {career_motivations.job_search_status}
                </div>
              </div>
              <div className={styles.listContent}>
                <div className={styles.listItem}>
                  <div
                    className={classnames(
                      styles.listTitle,
                      styles.careerMotivationItemTitle
                    )}
                  >
                    What matters most
                  </div>
                  {(career_motivations.what_matters_most ?? []).map((item) => (
                    <div
                      key={item}
                      className={styles.careerMotivationItemContent}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.listContent}>
                <div className={styles.listItem}>
                  <div
                    className={classnames(
                      styles.listTitle,
                      styles.careerMotivationItemTitle
                    )}
                  >
                    What you're avoiding
                  </div>
                  {(career_motivations.what_youre_avoiding ?? []).map(
                    (item) => (
                      <div className={styles.careerMotivationItemContent}>
                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.block}>
          <div className={styles.blockTitle}>Preferences</div>
          <div>
            <div className={styles.simpleListItem}>
              <span>Role Type:</span>
              <span>{preferences.role_type}</span>
            </div>
            <div className={styles.simpleListItem}>
              <span>Seniority:</span>
              <span>{preferences.seniority}</span>
            </div>
            <div className={styles.simpleListItem}>
              <span>IC or Management:</span>
              <span>{preferences.ic_or_management}</span>
            </div>
            <div className={styles.simpleListItem}>
              <span>Company Stage:</span>
              <span>{preferences.company_stage}</span>
            </div>
            <div className={styles.simpleListItem}>
              <span>Company Size:</span>
              <span>{preferences.company_size}</span>
            </div>
            <div className={styles.simpleListItem}>
              <span>Industry:</span>
              <span>{preferences.industry}</span>
            </div>
            <div className={styles.simpleListItem}>
              <span>Culture:</span>
              <span>{preferences.culture}</span>
            </div>
            <div className={styles.simpleListItem}>
              <span>Location:</span>
              <span>{preferences.location}</span>
            </div>
            <div className={styles.simpleListItem}>
              <span>Remote Flexibility:</span>
              <span>{preferences.remote_flexibility}</span>
            </div>
          </div>
        </div>

        <div className={styles.block}>
          <div className={styles.blockTitle}>Logistics</div>
          <div>
            <div className={styles.simpleListItem}>
              <span>Current Location:</span>
              <span>{logistics.current_location}</span>
            </div>
            <div className={styles.simpleListItem}>
              <span>Work Authorization:</span>
              <span>{logistics.work_authorization}</span>
            </div>
            <div className={styles.simpleListItem}>
              <span>Current Compensation:</span>
              <span>{logistics.current_compensation}</span>
            </div>
            <div className={styles.simpleListItem}>
              <span>Target Compensation:</span>
              <span>{logistics.target_compensation}</span>
            </div>
            <div className={styles.simpleListItem}>
              <span>Notice Period:</span>
              <span>{logistics.notice_period}</span>
            </div>
            <div className={styles.simpleListItem}>
              <span>Availability:</span>
              <span>{logistics.availability}</span>
            </div>
          </div>
        </div>

        <div className={styles.block}>
          <div className={styles.blockTitle}>Dealbreakers</div>
          <div>
            {dealbreakers.map((item, index) => {
              return (
                <div key={index} className={styles.simpleListItem}>
                  <span>{item}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.block}>
          <div className={styles.blockTitle}>Areas for Further Discussion</div>
          <div className={styles.areasForFurtherDiscussionTable}>
            <div
              className={classnames(
                styles.areasForFurtherDiscussionRow,
                styles.areasForFurtherDiscussionHeader
              )}
            >
              <div>Area</div>
              <div>Context</div>
            </div>
            {areas_for_further_discussion.map((item, index) => {
              return (
                <div
                  key={index}
                  className={classnames(
                    styles.areasForFurtherDiscussionRow,
                    styles.areasForFurtherDiscussionItem
                  )}
                >
                  <div>{item.area}</div>
                  <div>{item.context}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insight;
