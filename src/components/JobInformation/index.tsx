import {
  Button,
  Collapse,
  CollapseProps,
  Input,
  message,
  Modal,
  Spin,
  Upload,
} from "antd";
import { useEffect, useState } from "react";
import { Get, Post, PostFormData } from "../../utils/request";
import MarkdownContainer from "../MarkdownContainer";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { copy } from "@/utils";
import MarkdownEditor from "../MarkdownEditor";

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
  | "social_media"
  | "faq";

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
  const [markdownEditModalOpen, setMarkdownEditModalOpen] = useState(false);
  const [editValue, setEditValue] = useState("");

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

  const updateContent = async () => {
    const { code } = await Post(
      formatUrl(`/api/jobs/${jobId}/docs/${docType}`, role),
      {
        content: editValue,
      }
    );
    if (code === 0) {
      message.success(originalT("submit_succeed"));
      setMarkdownEditModalOpen(false);
      fetchDoc();
    } else {
      message.success(originalT("submit_failed"));
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
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div>
          {t("updated_at")}
          {jobUpdatedAt && dayjs(jobUpdatedAt).format("YYYY/MM/DD HH:mm:ss")}
        </div>
        <Button
          onClick={async () => {
            await copy(jobDocContent);
            message.success(originalT("copied"));
          }}
          type="primary"
        >
          {originalT("copy")}
        </Button>
        <Button
          onClick={() => {
            setEditValue(jobDocContent);
            setMarkdownEditModalOpen(true);
          }}
          type="primary"
        >
          {originalT("edit")}
        </Button>
      </div>
      <MarkdownContainer content={jobDocContent} />
      <Modal
        open={!!markdownEditModalOpen}
        onCancel={() => {
          setMarkdownEditModalOpen(false);
        }}
        width={"80vw"}
        getContainer={document.body}
        destroyOnClose
        centered
        footer={[
          <Button key="cancel" onClick={() => setMarkdownEditModalOpen(false)}>
            {originalT("cancel")}
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              updateContent();
            }}
          >
            {originalT("submit")}
          </Button>,
        ]}
      >
        <MarkdownEditor value={editValue} onChange={(md) => setEditValue(md)} />
      </Modal>
    </div>
  );
};

const JobEditableField = (props: {
  jobId: number;
  fieldContent: string;
  fieldKey: string;
}) => {
  const { jobId, fieldContent, fieldKey } = props;
  const [value, setValue] = useState(fieldContent);

  const updateField = async (value: string) => {
    const { code } = await Post(
      `/api/jobs/${jobId}/update_field_for_interview_design_or_feedback`,
      {
        [fieldKey]: value,
      }
    );
    if (code === 0) {
      message.success("保存成功");
    } else {
      message.error("保存失败");
    }
  };

  return (
    <div>
      <Input.TextArea
        rows={10}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        type="primary"
        onClick={() => updateField(value)}
        style={{ marginTop: 16 }}
      >
        更新
      </Button>
      {fieldKey === "resume_for_interview_design" && (
        <Upload
          beforeUpload={() => false}
          onChange={async (fileInfo) => {
            const formData = new FormData();
            formData.append("file", fileInfo.file as any);
            const { code, data } = await PostFormData(
              `/api/jobs/${jobId}/upload_resume_for_interview_design`,
              formData
            );
            if (code === 0) {
              setValue(data.resume);
              updateField(data.resume);
            } else {
              message.error("上传失败");
            }
          }}
          showUploadList={false}
          accept=".docx,.pdf"
          multiple={false}
        >
          <Button type="primary" style={{ marginLeft: 16 }}>
            上传简历
          </Button>
        </Upload>
      )}
    </div>
  );
};
const JobInformation = (props: IProps) => {
  const { jobId, activeDocType, role = "staff" } = props;

  const [job, setJob] = useState<IJob>();
  const [profile, setProfile] = useState<ISettings>();

  const { t: originalT } = useTranslation();
  const t = (key: string) => {
    return originalT(`job_information.${key}`);
  };

  useEffect(() => {
    initProfile();
  }, []);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const initProfile = async () => {
    const { code, data } = await Get("/api/settings");
    if (code === 0) {
      setProfile(data);
    }
  };

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
      value: "compensation_details",
      label: t("compensation_details"),
      disabled: docUnfinised("compensation_details"),
    },
    {
      value: "jd",
      label: t("jd"),
      disabled: docUnfinised("jd"),
    },
    // {
    //   value: "target_companies",
    //   label: t("target_companies"),
    //   disabled: docUnfinised("target_companies"),
    // },
    // {
    //   value: "screening_question",
    //   label: t("screening_question"),
    //   disabled: docUnfinised("screening_question"),
    // },
    {
      value: "interview_plan",
      label: t("interview_plan"),
      disabled: docUnfinised("interview_plan"),
    },
    // {
    //   value: "outreach_message",
    //   label: t("outreach_message"),
    //   disabled: docUnfinised("outreach_message"),
    // },
    // {
    //   value: "social_media",
    //   label: t("social_media"),
    //   disabled: docUnfinised("social_media"),
    // },
    // {
    //   value: "faq",
    //   label: t("faq"),
    //   disabled: docUnfinised("faq"),
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
        items={[
          ...items,
          ...(profile?.is_admin
            ? [
                {
                  key: "resume",
                  label: "候选人简历",
                  children: job && (
                    <JobEditableField
                      jobId={job.id}
                      fieldContent={job.resume_for_interview_design}
                      fieldKey="resume_for_interview_design"
                    />
                  ),
                },
                {
                  key: "feedback",
                  label: "上轮面试评价",
                  children: job && (
                    <JobEditableField
                      jobId={job.id}
                      fieldContent={job.feedback_for_interview_design}
                      fieldKey="feedback_for_interview_design"
                    />
                  ),
                },
                {
                  key: "interview_transcript",
                  label: "面试笔录",
                  children: job && (
                    <JobEditableField
                      jobId={job.id}
                      fieldContent={
                        job.interview_transcript_for_interview_feedback
                      }
                      fieldKey="interview_transcript_for_interview_feedback"
                    />
                  ),
                },
                {
                  key: "interview_design",
                  label: "面试设计",
                  children: job && (
                    <JobEditableField
                      jobId={job.id}
                      fieldContent={job.interview_design_for_interview_feedback}
                      fieldKey="interview_design_for_interview_feedback"
                    />
                  ),
                },
              ]
            : []),
        ]}
        defaultActiveKey={activeDocType ? [activeDocType] : []}
      />
    </div>
  );
};

export default JobInformation;
