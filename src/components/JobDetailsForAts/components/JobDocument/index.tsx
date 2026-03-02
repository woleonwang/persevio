import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Drawer, message, Tooltip } from "antd";

import styles from "./style.module.less";
import { Get, Post } from "@/utils/request";
import { copy, downloadMarkdownAsPDF } from "@/utils";
import MarkdownEditor from "@/components/MarkdownEditor";
import MarkdownContainer from "@/components/MarkdownContainer";
import ChatMessagePreview from "@/components/ChatMessagePreview";
import Download from "@/assets/icons/download";
import Share2 from "@/assets/icons/share2";
import Copy from "@/assets/icons/copy";
import Icon from "@/components/Icon";

type TChatType = "jobRequirement" | "jobDescription";

interface IProps {
  job: IJob;
  chatType: TChatType;
  role?: "admin" | "staff";
  onUpdateDoc: () => Promise<void>;
}

const chatTypeMappings: Record<TChatType, string> = {
  jobRequirement: "requirement",
  jobDescription: "jd",
};
const JobDocument = (props: IProps) => {
  const { job, chatType, onUpdateDoc, role = "staff" } = props;

  const [documentContent, setDocumentContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState("");
  const [showConversationRecord, setShowConversationRecord] = useState(false);
  const [chatMessages, setChatMessages] = useState<TMessageFromApi[]>([]);

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_details.${key}`);

  useEffect(() => {
    fetchDoc();
    fetchConversationRecord();
  }, [job.id, chatType]);

  const fetchDoc = async () => {
    const { code, data } = await Get(
      `/api/jobs/${job.id}/docs/${chatTypeMappings[chatType]}`,
    );
    if (code === 0) {
      setDocumentContent(data.content);
    } else {
      setDocumentContent("");
    }
  };

  const fetchConversationRecord = async () => {
    const { code, data } = await Get(
      `/api/jobs/${job.id}/chat/${
        chatType === "jobRequirement" ? "JOB_REQUIREMENT" : "JOB_DESCRIPTION"
      }/messages`,
    );
    if (code === 0) {
      setChatMessages(data.messages ?? []);
    }
  };

  const updateDoc = async () => {
    const { code } = await Post(
      `/api/jobs/${job.id}/docs/${chatTypeMappings[chatType]}`,
      {
        content: editingValue,
      },
    );
    if (code === 0) {
      message.success(originalT("submit_succeed"));
      setIsEditing(false);
      fetchDoc();
      onUpdateDoc();
    } else {
      message.success(originalT("submit_failed"));
    }
  };

  const disabledEdit = chatType === "jobDescription" && !!job.posted_at;

  return (
    <div className={styles.container}>
      <div className={styles.docHeader}>
        <div className={styles.docTitle}>
          <div className={styles.docTitleText}>
            {t(
              {
                jobRequirement: "job_requirement_table",
                jobDescription: "job_description_jd",
              }[chatType],
            )}
          </div>
          {chatType === "jobRequirement" && (
            <div className={styles.internalBadge}>{t("internal")}</div>
          )}
          {chatType === "jobDescription" && (
            <div className={styles.publishedBadge}>Published</div>
          )}
        </div>
        {!!documentContent && (
          <div className={styles.operations}>
            {role === "staff" && (
              <Tooltip title={disabledEdit ? t("publish_job_hint") : ""}>
                <Button
                  type="default"
                  onClick={() => {
                    if (disabledEdit) return;
                    setEditingValue(documentContent);
                    setIsEditing(true);
                  }}
                  disabled={disabledEdit}
                >
                  Edit
                </Button>
              </Tooltip>
            )}
            <Button
              type="default"
              icon={<Icon icon={<Share2 />} />}
              onClick={async () => {
                await copy(
                  `${window.origin}/jobs/${job.id}/share?show=${chatTypeMappings[chatType]}`,
                );
                message.success(originalT("copied"));
              }}
            >
              {t("share_position")}
            </Button>
            <Button
              type="default"
              icon={<Icon icon={<Copy />} />}
              onClick={async () => {
                await copy(documentContent);
                message.success(originalT("copied"));
              }}
            >
              {t("copy_document")}
            </Button>
            <Button
              type="default"
              onClick={() => setShowConversationRecord(true)}
            >
              {t("conversation_record")}
            </Button>
            <Button
              type="primary"
              icon={<Icon icon={<Download />} />}
              onClick={() => {
                downloadMarkdownAsPDF({
                  name: job.name,
                  element: document.getElementById("docContent") as HTMLElement,
                });
              }}
            >
              Download PDF
            </Button>
          </div>
        )}
      </div>
      <div className={styles.docContent}>
        {isEditing ? (
          <MarkdownEditor
            value={editingValue}
            onChange={(md) => setEditingValue(md)}
          />
        ) : (
          <MarkdownContainer content={documentContent} id="docContent" />
        )}
      </div>
      {isEditing && (
        <div className={styles.editActions}>
          <Button onClick={() => setIsEditing(false)}>
            {originalT("cancel")}
          </Button>
          <Button
            onClick={() => updateDoc()}
            type="primary"
            style={{ marginLeft: 12 }}
          >
            {originalT("save")}
          </Button>
        </div>
      )}

      <Drawer
        title={t("conversation_record")}
        open={showConversationRecord}
        onClose={() => setShowConversationRecord(false)}
        width={1000}
        destroyOnClose
      >
        <ChatMessagePreview messages={chatMessages} job={job} />
      </Drawer>
    </div>
  );
};

export default JobDocument;
