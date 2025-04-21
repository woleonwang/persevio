import { Collapse, CollapseProps, Spin } from "antd";
import { useEffect, useState } from "react";
import { Get } from "../../utils/request";
import MarkdownContainer from "../MarkdownContainer";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

interface IProps {
  jobId: number;
  activeDocType?: TJobDocType;
  role?: "staff" | "coworker";
}

export type TJobDocType =
  | "basic_info"
  | "requirement"
  | "jd"
  | "target_companies"
  | "compensation_details"
  | "screening_question"
  | "interview_plan"
  | "outreach_message"
  | "social_media";

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
  const [jobUpdatedAt, setJobUpdatedAt] = useState("");

  const { t: originalT } = useTranslation();
  const t = (key: string) => {
    return originalT(`job_information.${key}`);
  };

  useEffect(() => {
    fetchDoc();
  }, []);

  const fetchDoc = async () => {
    const { code, data } = await Get(
      formatUrl(`/api/jobs/${jobId}/docs/${docType}`, role)
    );
    if (code === 0) {
      setJobDocContent(data.content);
      setJobUpdatedAt(data.updated_at);
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

  return (
    <div>
      <div>
        {t("updated_at")}
        {jobUpdatedAt && dayjs(jobUpdatedAt).format("YYYY/MM/DD HH:mm:ss")}
      </div>
      <MarkdownContainer content={jobDocContent} />
    </div>
  );
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
      value: "requirement",
      label: t("jrd"),
      disabled: docUnfinised("requirement"),
    },
    {
      value: "jd",
      label: t("jd"),
      disabled: docUnfinised("jd"),
    },
    {
      value: "target_companies",
      label: t("target_companies"),
      disabled: docUnfinised("target_companies"),
    },
    {
      value: "compensation_details",
      label: t("compensation_details"),
      disabled: docUnfinised("compensation_details"),
    },
    {
      value: "screening_question",
      label: t("screening_question"),
      disabled: docUnfinised("screening_question"),
    },
    {
      value: "interview_plan",
      label: t("interview_plan"),
      disabled: docUnfinised("interview_plan"),
    },
    {
      value: "outreach_message",
      label: t("outreach_message"),
      disabled: docUnfinised("outreach_message"),
    },
    {
      value: "social_media",
      label: t("social_media"),
      disabled: docUnfinised("social_media"),
    },
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
