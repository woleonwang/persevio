import { Collapse, CollapseProps, Spin } from "antd";
import { useEffect, useState } from "react";
import { Get } from "../../../../utils/request";
import MarkdownContainer from "../../../../components/MarkdownContainer";
import styles from "./style.module.less";
interface IProps {
  jobId: number;
  activeDocType?: TJobDocType;
  role?: "staff" | "coworker";
}

export type TJobDocType =
  | "basic_info"
  | "role_context"
  | "objectives"
  | "activities"
  | "candidate_requirements"
  | "target_companies"
  | "requirement";
// | "interview_plan"
// | "jd";

const formatUrl = (url: string, role: "staff" | "coworker") => {
  if (role === "staff") return url;
  return url.replace("/api", "/api/coworker");
};

const JobDocPanel = (props: {
  jobId: number;
  docType: TJobDocType;
  role: "staff" | "coworker";
}) => {
  const { jobId, docType, role } = props;

  const [jobDocContent, setJobDocContent] = useState("");

  useEffect(() => {
    fetchDoc();
  }, []);

  const fetchDoc = async () => {
    const { code, data } = await Get(
      formatUrl(`/api/jobs/${jobId}/docs/${docType}`, role)
    );
    if (code === 0) {
      setJobDocContent(data.content);
    }
  };

  if (jobDocContent === "") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin />
      </div>
    );
  }

  return <MarkdownContainer content={jobDocContent} />;
};
const JobInformation = (props: IProps) => {
  const { jobId, activeDocType, role = "staff" } = props;

  const [job, setJob] = useState<IJob>();

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchJob = async () => {
    const { code, data } = await Get(formatUrl(`/api/jobs/${jobId}`, role));
    if (code === 0) {
      setJob(data.job);
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
      value: "basic_info",
      label: "Basic Information",
      disabled: docUnfinised("basic_info"),
    },
    {
      value: "role_context",
      label: "Role Context",
      disabled: docUnfinised("role_context"),
    },
    {
      value: "objectives",
      label: "Objectives & Success Metrics",
      disabled: docUnfinised("objectives"),
    },
    {
      value: "activities",
      label: "Day-to-day activities",
      disabled: docUnfinised("activities"),
    },
    {
      value: "candidate_requirements",
      label: "Ideal Candidate Profile & Screening Criteria",
      disabled: docUnfinised("candidate_requirements"),
    },
    {
      value: "target_companies",
      label: "Target Companies",
      disabled: docUnfinised("target_companies"),
    },
    {
      value: "requirement",
      label: "JRD",
      disabled: docUnfinised("requirement"),
    },
    // {
    //   value: "interview_plan",
    //   label: "Interview Plan",
    //   disabled: docUnfinised("interview_plan"),
    // },
    // {
    //   value: "jd",
    //   label: "Job Description",
    //   disabled: docUnfinised("jd"),
    // },
  ];

  const items: CollapseProps["items"] = docsOptions.map((option) => {
    return {
      key: option.value,
      label: option.label,
      children: job && (
        <JobDocPanel
          jobId={job.id}
          docType={option.value as TJobDocType}
          role={role}
        />
      ),
      collapsible: option.disabled ? "disabled" : "header",
    };
  });

  return (
    <div className={styles.container}>
      <Collapse
        key={job?.id}
        items={items}
        defaultActiveKey={activeDocType ? [activeDocType] : []}
      />
    </div>
  );
};

export default JobInformation;
