import { Select } from "antd";
import { useEffect, useState } from "react";
import { Get } from "../../../../utils/request";
import MarkdownContainer from "../../../../components/MarkdownContainer";
import styles from "./style.module.less";
interface IProps {
  jobId: number;
}

type TJobDocType =
  | "role_context"
  | "objectives"
  | "activities"
  | "candidate_requirements"
  | "target_companies"
  | "requirement"
  | "interview_plan"
  | "jd";
const JobInformation = (props: IProps) => {
  const { jobId } = props;

  const [job, setJob] = useState<IJob>();
  const [jobDocType, setJobDocType] = useState<TJobDocType>();
  const [jobDocContent, setJobDocContent] = useState("");

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId, jobDocType]);

  useEffect(() => {
    if (jobId && jobDocType) {
      fetchDoc();
    }
  }, [jobId, jobDocType]);

  const fetchJob = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}`);
    if (code === 0) {
      setJob(data.job);
    }
  };

  const fetchDoc = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}/docs/${jobDocType}`);
    if (code === 0) {
      setJobDocContent(data.content);
    }
  };

  const docUnfinised = (docType: TJobDocType) =>
    (job?.[`${docType}_doc_id`] ?? 0) === 0;

  const docsOptions: {
    value: TJobDocType;
    label: string;
    disabled: boolean;
  }[] = [
    {
      value: "role_context",
      label: "Role Context",
      disabled: docUnfinised("role_context"),
    },
    {
      value: "objectives",
      label: "Objectives",
      disabled: docUnfinised("objectives"),
    },
    {
      value: "activities",
      label: "Activities",
      disabled: docUnfinised("activities"),
    },
    {
      value: "candidate_requirements",
      label: "Candidate requirements",
      disabled: docUnfinised("candidate_requirements"),
    },
    {
      value: "target_companies",
      label: "Target companies",
      disabled: docUnfinised("target_companies"),
    },
    {
      value: "requirement",
      label: "JRD",
      disabled: docUnfinised("requirement"),
    },
    {
      value: "interview_plan",
      label: "Interview Plan",
      disabled: docUnfinised("interview_plan"),
    },
    {
      value: "jd",
      label: "Job Description",
      disabled: docUnfinised("jd"),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.selectContainer}>
        <Select
          placeholder="Select a document"
          options={docsOptions}
          value={jobDocType}
          onChange={(value) => setJobDocType(value as TJobDocType)}
          style={{ width: 200 }}
        />
      </div>
      {jobDocContent && (
        <div className={styles.docContainer}>
          <MarkdownContainer content={jobDocContent} />
        </div>
      )}
    </div>
  );
};

export default JobInformation;
