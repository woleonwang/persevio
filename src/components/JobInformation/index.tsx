import { Collapse, CollapseProps, Spin } from "antd";
import { useEffect, useState } from "react";
import { Get } from "../../utils/request";
import MarkdownContainer from "../MarkdownContainer";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";

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

  const { t: originalT } = useTranslation();
  const t = (key: string) => {
    return originalT(`job_information.${key}`);
  };

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
      label: t("basic"),
      disabled: docUnfinised("basic_info"),
    },
    {
      value: "role_context",
      label: t("role_context"),
      disabled: docUnfinised("role_context"),
    },
    {
      value: "objectives",
      label: t("objectives"),
      disabled: docUnfinised("objectives"),
    },
    {
      value: "activities",
      label: t("activities"),
      disabled: docUnfinised("activities"),
    },
    {
      value: "candidate_requirements",
      label: t("ideal_candidate"),
      disabled: docUnfinised("candidate_requirements"),
    },
    {
      value: "target_companies",
      label: t("target_companies"),
      disabled: docUnfinised("target_companies"),
    },
    {
      value: "requirement",
      label: t("jrd"),
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
