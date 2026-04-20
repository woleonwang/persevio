import { useEffect, useMemo, useState } from "react";
import { Alert, Empty, Spin, Tabs } from "antd";
import { useParams } from "react-router";

import { Get } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import styles from "./style.module.less";

interface IJobApplyInternalDocuments {
  interview_strategy_doc?: string;
  strategy_generation_context?: string;
  interview_conversation_context?: string;
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

const JobApplyInternalDocuments = () => {
  const { talentId } = useParams<{ talentId: string }>();
  const [docs, setDocs] = useState<IJobApplyInternalDocuments>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchInternalDocuments = async () => {
      if (!talentId) return;

      setLoading(true);
      setErrorMessage("");
      const { code, data } = await Get(
        `/api/admin/talents/${talentId}/internal_documents`,
      );
      setLoading(false);

      if (code === 0) {
        setDocs(data ?? {});
      } else {
        setDocs(undefined);
        setErrorMessage("Get job apply internal documents failed");
      }
    };

    fetchInternalDocuments();
  }, [talentId]);

  const tabItems = useMemo(
    () => [
      {
        key: "strategyGenerationContext",
        label: "Strategy Generation Context",
        value: docs?.strategy_generation_context,
      },
      {
        key: "interviewStrategyDoc",
        label: "Interview Strategy Doc",
        value: docs?.interview_strategy_doc,
      },
      {
        key: "interviewConversationContext",
        label: "Interview Conversation Context",
        value: docs?.interview_conversation_context,
      },
    ],
    [docs],
  );

  if (!talentId) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>Talent #{talentId}</div>

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
                <MarkdownContainer
                  content={formatContentForDisplay(item.value)}
                />
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

export default JobApplyInternalDocuments;
