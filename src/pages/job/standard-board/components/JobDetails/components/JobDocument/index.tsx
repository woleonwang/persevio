import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Drawer, message } from "antd";
import {
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import styles from "./style.module.less";
import { Get, Post } from "@/utils/request";
import { confirmModal, copy } from "@/utils";
import MarkdownEditor from "@/components/MarkdownEditor";
import MarkdownContainer from "@/components/MarkdownContainer";
import ChatMessagePreview from "@/components/ChatMessagePreview";

type TChatType = "jobRequirement" | "jobDescription";

interface IProps {
  job: IJob;
  chatType: TChatType;
  togglePostJob: () => Promise<void>;
}

const chatTypeMappings: Record<TChatType, string> = {
  jobRequirement: "requirement",
  jobDescription: "jd",
};
const JobDocument = (props: IProps) => {
  const { job, chatType, togglePostJob } = props;

  const [documentContent, setDocumentContent] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
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
      `/api/jobs/${job.id}/docs/${chatTypeMappings[chatType]}`
    );
    if (code === 0) {
      setDocumentContent(data.content);
      setUpdatedAt(data.updated_at);
    } else {
      setDocumentContent("");
      setUpdatedAt("");
    }
  };

  const fetchConversationRecord = async () => {
    const { code, data } = await Get(
      `/api/jobs/${job.id}/chat/${
        chatType === "jobRequirement" ? "JOB_REQUIREMENT" : "JOB_DESCRIPTION"
      }/messages`
    );
    if (code === 0) {
      setChatMessages(data.messages);
    }
  };
  const updateDoc = async () => {
    const { code } = await Post(
      `/api/jobs/${job.id}/docs/${chatTypeMappings[chatType]}`,
      {
        content: editingValue,
      }
    );
    if (code === 0) {
      message.success(originalT("submit_succeed"));
      setIsEditing(false);
      fetchDoc();
    } else {
      message.success(originalT("submit_failed"));
    }
  };

  const downloadAsType = (type: "txt" | "markdown") => {
    // 根据 type 下载 documentContent，txt 需去除 markdown 格式，md 直接下载
    let fileName = job?.name || "document";
    if (type === "txt") {
      fileName += ".txt";
    } else {
      fileName += ".md";
    }

    // 创建 blob 并下载
    const blob = new Blob([documentContent], {
      type: "text/plain;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className={styles.container}>
      <div className={styles.docHeader}>
        <div className={styles.docTitle}>
          {t(
            {
              jobRequirement: "job_requirement_table",
              jobDescription: "job_description_jd",
            }[chatType]
          )}
          <span className={styles.timestamp}>
            {updatedAt &&
              `${dayjs(updatedAt).format("YYYY/MM/DD HH:mm:ss")} ${t(
                "updated_at"
              )}`}
          </span>
        </div>
        {!!documentContent && (
          <div className={styles.operations}>
            <DownloadOutlined
              onClick={() => {
                downloadAsType("markdown");
              }}
            />
            <ShareAltOutlined
              onClick={async () => {
                await copy(
                  `${window.origin}/jobs/${job.id}/share?show=${chatTypeMappings[chatType]}`
                );
                message.success(originalT("copied"));
              }}
            />
            <CopyOutlined
              onClick={async () => {
                await copy(documentContent);
                message.success(originalT("copied"));
              }}
            />
            <EditOutlined
              onClick={() => {
                setEditingValue(documentContent);
                setIsEditing(true);
              }}
            />
            <Button
              variant="outlined"
              color="primary"
              style={{ marginLeft: 6 }}
              onClick={() => {
                setShowConversationRecord(true);
              }}
            >
              {t("conversation_record")}
            </Button>
            {chatType === "jobDescription" && (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  style={{ marginLeft: 6 }}
                  onClick={() => {
                    confirmModal({
                      title: t("unpost_job_title"),
                      content: t("unpost_job_content"),
                      onOk: () => {
                        togglePostJob();
                      },
                    });
                  }}
                >
                  {t("unpost_job")}
                </Button>

                <Button
                  type="primary"
                  style={{ marginLeft: 6 }}
                  onClick={() => {
                    window.open(`${window.origin}/jobs/${job.id}/chat`);
                  }}
                >
                  {t("job_posting")}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      {chatType === "jobRequirement" && (
        <div className={styles.hint}>
          When Viona introduces this role to candidates, she will reference the
          information in this document. You can edit the information here to
          control how Viona introduces this role to potential candidates.
        </div>
      )}
      <div className={styles.docContent}>
        {isEditing ? (
          <MarkdownEditor
            value={editingValue}
            onChange={(md) => setEditingValue(md)}
          />
        ) : (
          <MarkdownContainer content={documentContent} />
        )}
      </div>
      {isEditing && (
        <div>
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
      >
        <ChatMessagePreview messages={chatMessages} job={job} />
      </Drawer>
    </div>
  );
};

export default JobDocument;
