import { useEffect, useMemo, useState } from "react";
import { Alert, Empty, Spin, Tabs } from "antd";

import useJob from "@/hooks/useJob";
import { Get } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import styles from "./style.module.less";

interface IInternalDocuments {
  role_archetype?: string;
  similarity_matching_results_json?: string;
  job_requirement_strategy_doc?: string;
}

const formatContentForDisplay = (content?: string) => {
  const trimmed = content?.trim();
  if (!trimmed) return "";

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "object" && parsed !== null) {
      return `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
    }
  } catch {
    // keep original content when it is not a valid JSON string
  }

  return content ?? "";
};

const JobInternalDocuments = () => {
  const { job } = useJob();
  const [docs, setDocs] = useState<IInternalDocuments>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchInternalDocuments = async () => {
      if (!job?.id) return;

      setLoading(true);
      setErrorMessage("");
      const { code, data } = await Get(
        `/api/admin/jobs/${job.id}/internal_documents`,
      );
      setLoading(false);

      if (code === 0) {
        setDocs(data ?? {});
      } else {
        setDocs(undefined);
        setErrorMessage("Get internal documents failed");
      }
    };

    fetchInternalDocuments();
  }, [job?.id]);

  const tabItems = useMemo(
    () => [
      {
        key: "roleArchetype",
        label: "Role Archetype",
        value: docs?.role_archetype,
      },
      {
        key: "similarityMatchingResults",
        label: "Similarity Matching Results",
        value: docs?.similarity_matching_results_json,
      },
      {
        key: "jobRequirementStrategy",
        label: "Job Requirement Strategy",
        value: docs?.job_requirement_strategy_doc,
      },
    ],
    [docs],
  );

  if (!job) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>{job.name}</div>

      {errorMessage && (
        <Alert
          type="error"
          showIcon
          message={errorMessage}
          style={{ marginBottom: 16 }}
        />
      )}

      <div className={styles.content}>
        {loading ? (
          <Spin />
        ) : (
          <Tabs
            items={tabItems.map((item) => ({
              key: item.key,
              label: item.label,
              children: item.value ? (
                <MarkdownContainer content={formatContentForDisplay(item.value)} />
              ) : (
                <Empty description="No content" />
              ),
            }))}
          />
        )}
      </div>
    </div>
  );
};

export default JobInternalDocuments;
