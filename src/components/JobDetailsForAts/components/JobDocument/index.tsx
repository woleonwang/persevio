import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DownOutlined } from "@ant-design/icons";
import { Button, Drawer, Dropdown, message, Tooltip } from "antd";

import styles from "./style.module.less";
import { Get, Post } from "@/utils/request";
import { copy, downloadMarkdownAsPDF } from "@/utils";
import MarkdownEditor from "@/components/MarkdownEditor";
import MarkdownContainer from "@/components/MarkdownContainer";
import ChatMessagePreview from "@/components/ChatMessagePreview";
import JobJrdEditVionaNotifier from "@/components/JobJrdEditVionaNotifier";
import Download from "@/assets/icons/download";
import Share2 from "@/assets/icons/share2";
import Copy from "@/assets/icons/copy";
import Icon from "@/components/Icon";
import Pen from "@/assets/icons/pen";
import TwoStar from "@/assets/icons/two-star";

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

  const jobSeg = job.invitation_token;

  const [documentContent, setDocumentContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState("");
  const [showConversationRecord, setShowConversationRecord] = useState(false);
  const [chatMessages, setChatMessages] = useState<TMessageFromApi[]>([]);
  const [jrdVionaNotifierOpen, setJrdVionaNotifierOpen] = useState(false);

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_details.${key}`);

  useEffect(() => {
    fetchDoc();
    fetchConversationRecord();
  }, [job.id, chatType]);

  const fetchDoc = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobSeg}/docs/${chatTypeMappings[chatType]}`,
    );
    if (code === 0) {
      setDocumentContent(data.content);
    } else {
      setDocumentContent("");
    }
  };

  const fetchConversationRecord = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobSeg}/chat/${
        chatType === "jobRequirement" ? "JOB_REQUIREMENT" : "JOB_DESCRIPTION"
      }/messages`,
    );
    if (code === 0) {
      setChatMessages(data.messages ?? []);
    }
  };

  const updateDoc = async () => {
    const { code } = await Post(
      `/api/jobs/${jobSeg}/docs/${chatTypeMappings[chatType]}`,
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
            {role === "staff" && chatType === "jobRequirement" && (
              <Tooltip title={disabledEdit ? t("publish_job_hint") : ""}>
                <Dropdown
                  disabled={disabledEdit}
                  menu={{
                    items: [
                      {
                        key: "viona",
                        label: (
                          <span className={styles.chatWithVionaMenuItem}>
                            <Icon
                              icon={<TwoStar />}
                              style={{ marginRight: 8 }}
                            />
                            {originalT("job_details.chat_with_viona_menu")}
                          </span>
                        ),
                        onClick: () => setJrdVionaNotifierOpen(true),
                      },
                      {
                        key: "manual",
                        label: (
                          <span className={styles.chatWithVionaMenuItem}>
                            <Icon icon={<Pen />} style={{ marginRight: 8 }} />
                            {originalT("job_details.manually_edit")}
                          </span>
                        ),
                        onClick: () => {
                          setEditingValue(documentContent);
                          setIsEditing(true);
                        },
                      },
                    ],
                  }}
                  trigger={["click"]}
                >
                  <Button type="default" disabled={disabledEdit}>
                    <Icon icon={<TwoStar />} />
                    <span style={{ marginLeft: 6 }}>
                      {t("edit_with_stars")}
                    </span>
                    <DownOutlined style={{ marginLeft: 6, fontSize: 12 }} />
                  </Button>
                </Dropdown>
              </Tooltip>
            )}
            {role === "staff" && chatType === "jobDescription" && (
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
                  {t("edit")}
                </Button>
              </Tooltip>
            )}
            <Button
              type="default"
              icon={<Icon icon={<Share2 />} />}
              onClick={async () => {
                await copy(
                  `${window.origin}/jobs/${job.invitation_token}/share?show=${chatTypeMappings[chatType]}`,
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

      <JobJrdEditVionaNotifier
        open={jrdVionaNotifierOpen}
        jobId={jobSeg}
        onClose={() => setJrdVionaNotifierOpen(false)}
      />
    </div>
  );
};

export default JobDocument;
