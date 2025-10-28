import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, message } from "antd";
import {
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import styles from "./style.module.less";
import { Get, Post } from "@/utils/request";
import { copy } from "@/utils";
import MarkdownEditor from "@/components/MarkdownEditor";
import MarkdownContainer from "@/components/MarkdownContainer";

type TChatType = "jobRequirement" | "jobDescription";

interface IProps {
  job: IJob;
  chatType: TChatType;
}

const chatTypeMappings: Record<TChatType, string> = {
  jobRequirement: "requirement",
  jobDescription: "jd",
};
const JobDocument = (props: IProps) => {
  const { job, chatType } = props;

  const [documentContent, setDocumentContent] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState("");

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_details.${key}`);

  useEffect(() => {
    fetchDoc();
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
    </div>
  );
};

export default JobDocument;
