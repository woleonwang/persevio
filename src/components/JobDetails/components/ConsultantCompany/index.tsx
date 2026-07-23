import { useEffect, useState } from "react";
import { Spin } from "antd";

import { Get } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import styles from "./style.module.less";

interface IProps {
  jobId: number;
}

type TCompanyMaterials = {
  company_name: string;
  onboarding_profile_json: string;
  fact_sheet: string;
  candidate_facing_answers: string;
};

const ConsultantCompany = (props: IProps) => {
  const { jobId } = props;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TCompanyMaterials>();

  useEffect(() => {
    fetchMaterials();
  }, [jobId]);

  const fetchMaterials = async () => {
    setLoading(true);
    const { code, data } = await Get(
      `/api/admin/jobs/${jobId}/consultant/company`,
    );
    setLoading(false);
    if (code === 0) {
      setData(data);
    }
  };

  if (loading || !data) {
    return <Spin />;
  }

  const hasAnything =
    !!data.fact_sheet ||
    !!data.candidate_facing_answers ||
    !!data.onboarding_profile_json;

  if (!hasAnything) {
    return (
      <div className={styles.empty}>
        No company materials available for this job yet.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {!!data.fact_sheet && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Company fact sheet</div>
          <MarkdownContainer content={data.fact_sheet} />
        </div>
      )}
      {!!data.onboarding_profile_json && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Onboarding profile</div>
          <pre className={styles.jsonBlock}>{data.onboarding_profile_json}</pre>
        </div>
      )}
      {!!data.candidate_facing_answers && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            Employer candidate-facing answers
          </div>
          <MarkdownContainer content={data.candidate_facing_answers} />
        </div>
      )}
    </div>
  );
};

export default ConsultantCompany;
