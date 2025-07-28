import {
  ArrowLeftOutlined,
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import styles from "./style.module.less";
import { useNavigate, useParams } from "react-router";
import useJob from "@/hooks/useJob";
import { Badge, Button, Empty, message, Spin } from "antd";
import { checkJobDotStatus, copy, setJobDotStatus } from "@/utils";
import MarkdownContainer from "@/components/MarkdownContainer";
import { useEffect, useState } from "react";
import { Get, Post } from "@/utils/request";
import dayjs from "dayjs";
import MarkdownEditor from "@/components/MarkdownEditor";
import { useTranslation } from "react-i18next";

type TChatType = "job-requirement" | "job-description" | "job-interview-plan";

const chatTypeMappings: Record<TChatType, string> = {
  "job-requirement": "requirement",
  "job-description": "jd",
  "job-interview-plan": "interview_plan",
};

const chatTypeTitle: Record<TChatType, string> = {
  "job-requirement": "职位需求表",
  "job-description": "职位描述(JD)",
  "job-interview-plan": "面试计划&评分卡",
};

const chatTypeField: Record<TChatType, string> = {
  "job-requirement": "requirement_doc_id",
  "job-description": "jd_doc_id",
  "job-interview-plan": "interview_plan_doc_id",
};

const JobDocument = () => {
  const { chatType = "job-requirement" } = useParams<{
    chatType: TChatType;
  }>();

  const { job } = useJob();
  const [documentContent, setDocumentContent] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState("");

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();
  // const t = (key: string) => originalT(`job.${key}`);

  useEffect(() => {
    if (job) {
      fetchDoc();
    }
  }, [job, chatType]);

  const fetchDoc = async () => {
    if (!job) return;

    const { code, data } = await Get(
      `/api/jobs/${job?.id}/docs/${chatTypeMappings[chatType]}`
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
      `/api/jobs/${job?.id}/docs/${chatTypeMappings[chatType]}`,
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

  const docHasReady = (chatType: TChatType): boolean => {
    if (!job) return false;
    return !!job[chatTypeField[chatType] as keyof IJob];
  };

  const downloadAsType = (type: "txt" | "markdown") => {
    if (!job || !documentContent) return;
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

  if (!job) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ArrowLeftOutlined
          style={{
            fontSize: 20,
            cursor: "pointer",
            margin: "0 20px",
          }}
          onClick={() => {
            navigate(`/app/jobs/${job.id}/board`);
          }}
        />
        <span style={{ fontSize: 20, fontWeight: "bold" }}>{job.name}</span> -
        {" 职位详情"}
      </div>
      <div className={styles.body}>
        <div className={styles.left}>
          {Object.keys(chatTypeTitle).map((item) => {
            return (
              <Badge
                key={item}
                styles={{ root: { width: "100%" } }}
                dot={
                  docHasReady(item as TChatType) &&
                  !checkJobDotStatus(job.id, item)
                }
              >
                <Button
                  type={chatType === item ? "primary" : "default"}
                  onClick={() => {
                    setJobDotStatus(job.id, item);
                    navigate(`/app/jobs/${job.id}/document/${item}`);
                  }}
                  style={{
                    width: "100%",
                    borderRadius: "0",
                    fontSize: 16,
                    height: 60,
                  }}
                  size="large"
                >
                  {chatTypeTitle[item as keyof typeof chatTypeTitle]}
                </Button>
              </Badge>
            );
          })}
        </div>
        <div className={styles.right}>
          <div className={styles.docHeader}>
            <div className={styles.docTitle}>
              {chatTypeTitle[chatType]}
              <span className={styles.timestamp}>
                {updatedAt &&
                  `${dayjs(updatedAt).format("YYYY/MM/DD HH:mm:ss")}更新`}
              </span>
            </div>
            <div className={styles.operations}>
              <DownloadOutlined
                onClick={() => {
                  downloadAsType("markdown");
                }}
              />
              <ShareAltOutlined />
              <CopyOutlined
                onClick={async () => {
                  await copy(documentContent);
                  message.success("Copied");
                }}
              />
              <EditOutlined
                onClick={() => {
                  setEditingValue(documentContent);
                  setIsEditing(true);
                }}
              />

              <Button
                type="primary"
                onClick={() => {
                  navigate(`/app/jobs/${job.id}/chat/${chatType}`);
                }}
                style={{ marginLeft: "12px" }}
              >
                与 Viona 对话
              </Button>
            </div>
          </div>
          <div className={styles.docContent}>
            {documentContent ? (
              isEditing ? (
                <div>
                  <MarkdownEditor
                    value={editingValue}
                    onChange={(md) => setEditingValue(md)}
                  />
                </div>
              ) : (
                <MarkdownContainer content={documentContent} />
              )
            ) : (
              <div style={{ marginTop: 120 }}>
                <Empty
                  description={
                    <div style={{ marginTop: 20 }}>
                      请先与 Viona 对话获取职位需求表
                      <Button
                        type="primary"
                        onClick={() => {
                          navigate(`/app/jobs/${job.id}/chat/${chatType}`);
                        }}
                        style={{ marginLeft: "12px" }}
                      >
                        与 Viona 对话
                      </Button>
                    </div>
                  }
                />
              </div>
            )}
          </div>
          {isEditing && (
            <div>
              <Button onClick={() => setIsEditing(false)}>取消</Button>
              <Button
                onClick={() => updateDoc()}
                type="primary"
                style={{ marginLeft: 12 }}
              >
                保存
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDocument;
