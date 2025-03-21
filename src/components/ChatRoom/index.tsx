import React, { useState, useRef, useEffect } from "react";
import {
  Avatar,
  List,
  Input,
  Button,
  Upload,
  message,
  Tour,
  TourStepProps,
} from "antd";
import {
  AudioMutedOutlined,
  AudioOutlined,
  CopyOutlined,
  EditOutlined,
  RightCircleOutlined,
} from "@ant-design/icons";
import classnames from "classnames";
import Markdown from "react-markdown";
import dayjs from "dayjs";
import rehypeRaw from "rehype-raw";

import type { TextAreaRef } from "antd/es/input/TextArea";
import type { UploadChangeParam, UploadFile } from "antd/es/upload";

import { Get, Post, PostFormData } from "../../utils/request";
import Icon from "../Icon";
import WriteJdIcon from "../../assets/icons/write-jd";
import WriteInterviewPlanIcon from "../../assets/icons/write-interview-plan";
import BagIcon from "../../assets/icons/bag";
import RoleOverviewModal from "./components/RoleOverviewModal";

import LogoVertical from "../../assets/logo-vertical.png";
import VionaAvatar from "../../assets/viona-avatar.png";
import UserAvatar from "../../assets/user-avatar.png";
import styles from "./style.module.less";

type TMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
  updated_at: string;

  messageType?: "normal" | "error";
  extraTags?: {
    name: string;
    content: string;
  }[];
};

export type TChatType =
  | "jobRequirementDoc"
  | "candidate"
  | "jobDescription"
  | "jobInterviewPlan";

interface IProps {
  jobId: number;
  type: TChatType;
  sessionId?: string;
  allowEditMessage?: boolean;
  role?: "staff" | "coworker";
  onChangeType?: (type: TChatType) => void;
}

const PreDefinedMessages = [
  "Give me a brief intro about the company",
  "Which team will this role join?",
  "Who will this role report to?",
  "How many annual leave will this role have?",
];

const EditMessageGuideKey = "edit_message_guide_timestamp";
const ChatRoom: React.FC<IProps> = (props) => {
  const {
    jobId,
    type = "jobRequirementDoc",
    sessionId,
    allowEditMessage = false,
    role = "staff",
    onChangeType,
  } = props;
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [loadingText, setLoadingText] = useState(".");
  const [job, setJob] = useState<IJob>();
  const [showRoleOverviewModal, setShowRoleOverviewModal] = useState(false);
  const [editMessageMap, setEditMessageMap] = useState<
    Record<string, { enabled: boolean; content: string }>
  >({});
  const [editMessageTourOpen, setEditMessageTourOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isCompositingRef = useRef(false);
  const recognitionRef = useRef<any>();
  const originalInputRef = useRef<string>("");
  const textInstanceRef = useRef<TextAreaRef | null>();
  const editMessageTourElementRef = useRef<
    HTMLButtonElement | HTMLAnchorElement | null
  >();
  const needScrollToBottom = useRef(false);

  const EditMessageTourSteps: TourStepProps[] = [
    {
      title: "Edit Message",
      description:
        "Click here to edit Viona's draft summaries, or answer her questions directly below.",
      nextButtonProps: {
        children: "OK",
      },
      target: () => editMessageTourElementRef.current ?? document.body,
    },
  ];

  useEffect(() => {
    if (isLoading) {
      const intervalFetchMessage = setInterval(() => {
        fetchMessages();
      }, 3000);

      const intervalText = setInterval(() => {
        setLoadingText((prev) => (prev === "..." ? "." : prev + "."));
      }, 500);

      return () => {
        clearInterval(intervalFetchMessage);
        clearInterval(intervalText);
      };
    }
  }, [isLoading]);

  useEffect(() => {
    needScrollToBottom.current = true;
    fetchMessages();
  }, [jobId, type]);

  useEffect(() => {
    if (needScrollToBottom.current) {
      scrollToBottom();
      needScrollToBottom.current = false;
    }

    if (!localStorage.getItem(EditMessageGuideKey) && allowEditMessage) {
      setTimeout(() => {
        setEditMessageTourOpen(true);
      }, 500);
    }
  }, [messages]);
  const formatUrl = (url: string) => {
    if (role === "staff") return url;
    return url.replace("/api", "/api/coworker");
  };

  const apiMapping: Record<IProps["type"], { get: string; send: string }> = {
    jobRequirementDoc: {
      get: formatUrl(`/api/jobs/${jobId}/requirement_doc_chat`),
      send: formatUrl(`/api/jobs/${jobId}/requirement_doc_chat/send`),
    },
    jobDescription: {
      get: formatUrl(`/api/jobs/${jobId}/job_description_chat`),
      send: formatUrl(`/api/jobs/${jobId}/job_description_chat/send`),
    },
    jobInterviewPlan: {
      get: formatUrl(`/api/jobs/${jobId}/interview_plan_chat`),
      send: formatUrl(`/api/jobs/${jobId}/interview_plan_chat/send`),
    },
    candidate: {
      get: `/api/public/jobs/${jobId}/candidate_chat/${sessionId}`,
      send: `/api/public/jobs/${jobId}/candidate_chat/${sessionId}/send`,
    },
  };

  const fetchMessages = async () => {
    const { code, data } = await Get(apiMapping[type].get);
    if (code === 0) {
      const messageHistory = formatMessages(data.messages);
      const isLoading = data.is_invoking === 1;
      setIsLoading(isLoading);
      if (isLoading) {
        messageHistory.push({
          id: "fake_ai_id",
          role: "ai",
          content: "",
          updated_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        });
      }
      setMessages(messageHistory);
      setJob(data.job);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  };

  const formatMessages = (
    messages: {
      id: number;
      content: {
        content: string;
        role: "user" | "assistant";
        metadata: {
          message_type: string;
          message_sub_type: "error";
          extra_tags: {
            name: string;
            content: string;
          }[];
        };
      };
      updated_at: string;
    }[]
  ): TMessage[] => {
    return messages
      .map(
        (m): TMessage => ({
          id: m.id.toString(),
          role: m.content.role === "assistant" ? "ai" : "user",
          content: m.content.content,
          updated_at: m.updated_at,
          messageType: m.content.metadata.message_sub_type || "normal",
          extraTags: m.content.metadata.extra_tags || [],
        })
      )
      .filter((item) => item.content);
  };

  const canSubmit = () => {
    return inputValue?.trim() && !isLoading && !isCompositingRef.current;
  };

  const submit = async () => {
    if (!canSubmit()) return;

    stopRecord();

    setInputValue("");

    await sendMessage(inputValue.trim());
  };

  const sendRoleOverviwe = async (roleOverview: string) => {
    const { code } = await Post(formatUrl(`/api/jobs/${jobId}/role_overview`), {
      content: roleOverview,
    });
    if (code === 0) {
      sendMessage(roleOverview);
    } else {
      message.error("Send role overview failed");
    }
  };

  const sendMessage = async (message: string) => {
    needScrollToBottom.current = true;
    setMessages([
      ...messages,
      {
        id: "fake_user_id",
        role: "user",
        content: message,
        updated_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      },
      {
        id: "fake_ai_id",
        role: "ai",
        content: "",
        updated_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      },
    ]);

    setIsLoading(true);

    Post(apiMapping[type].send, {
      content: message,
    });
  };

  const handleInputChange = (e: any) => {
    setInputValue(e.target.value);
  };

  const startRecord = async () => {
    if (!recognitionRef.current) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      //@ts-ignore
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        console.log(event);
        let result = "";
        let isFinal = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          result += event.results[i][0].transcript ?? "";
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }
        setInputValue(originalInputRef.current + result);
        if (isFinal) {
          console.log("is final: ", originalInputRef.current + result);
          originalInputRef.current += result;
        }
      };
      recognition.onend = () => {
        console.log("end");
        setIsRecording(false);
      };
      recognition.onerror = () => {
        console.log("error");
      };
      recognitionRef.current = recognition;
    }

    setIsRecording(true);
    originalInputRef.current = inputValue;
    recognitionRef.current?.start();
    textInstanceRef.current?.focus();
  };

  const stopRecord = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const uploadPdf = async (fileInfo: UploadChangeParam<UploadFile<any>>) => {
    const file = fileInfo.file;

    if (file && !file.status) {
      const isPDF = file.type === "application/pdf";
      if (!isPDF) {
        message.error("You can only upload PDF file!");
        return;
      }

      const formData = new FormData();
      formData.append("file", file as any);
      const { code } = await PostFormData(
        `/api/public/jobs/${jobId}/candidate_chat/${sessionId}/upload_attachment/pdf`,
        formData
      );

      if (code === 0) {
        message.success("Upload succeed");
      } else {
        message.error("Upload failed");
      }
    }
  };

  const uploadDocx = async (fileInfo: UploadChangeParam<UploadFile<any>>) => {
    const file = fileInfo.file;

    if (file && !file.status) {
      const isDocx =
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (!isDocx) {
        message.error("You can only upload Docx file!");
        return;
      }

      const formData = new FormData();
      formData.append("file", file as any);
      const { code } = await PostFormData(
        `/api/public/jobs/${jobId}/candidate_chat/${sessionId}/upload_attachment/docx`,
        formData
      );

      if (code === 0) {
        message.success("Upload succeed");
      } else {
        message.error("Upload failed");
      }
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const cancelMessageEdit = (id: string) => {
    setEditMessageMap((current) => {
      const newValue = { ...current };
      delete newValue[id];
      return newValue;
    });
  };

  const maxIdOfAIMessage = [...messages]
    .reverse()
    .find((item) => item.role === "ai" && item.id !== "fake_ai_id")?.id;

  return (
    <div className={styles.container}>
      <div className={styles.listArea}>
        {type === "candidate" && messages.length === 0 ? (
          <div className={styles.emptyContainer}>
            <div className={styles.logo}>
              <img src={LogoVertical} style={{ width: 200 }} />
            </div>
            <div className={styles.messageCardContainer}>
              {PreDefinedMessages.map((message) => {
                return (
                  <div className={styles.messageCard}>
                    <div>{message}</div>
                    <RightCircleOutlined
                      style={{
                        marginTop: 16,
                        fontSize: 30,
                        color: "#1FAC6A",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        sendMessage(message);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <List
            dataSource={messages}
            split={false}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={
                        item.role === "user" ? (
                          <img src={UserAvatar} />
                        ) : (
                          <img src={VionaAvatar} />
                        )
                      }
                    />
                  }
                  title={
                    <div>
                      <span style={{ fontSize: 18 }}>
                        {item.role === "user"
                          ? "You"
                          : `Viona${
                              type === "candidate"
                                ? ", your application agent"
                                : ", AI recruiter"
                            }`}
                      </span>
                      <span
                        style={{
                          color: "#999999",
                          marginLeft: 8,
                          fontSize: 14,
                          fontWeight: "normal",
                        }}
                      >
                        {dayjs(item.updated_at).format("HH:mm")}
                      </span>
                    </div>
                  }
                  description={
                    <div
                      className={classnames(
                        styles.markdownContainer,
                        item.role === "user" ? styles.user : "",
                        {
                          [styles.editing]: editMessageMap[item.id]?.enabled,
                        }
                      )}
                    >
                      {item.id === "fake_ai_id" ? (
                        <p>{loadingText}</p>
                      ) : editMessageMap[item.id]?.enabled ? (
                        <div className={styles.editingContainer}>
                          <Input.TextArea
                            autoSize={{ minRows: 4, maxRows: 16 }}
                            value={editMessageMap[item.id]?.content}
                            onChange={(e) =>
                              setEditMessageMap((current) => ({
                                ...current,
                                [item.id]: {
                                  ...current[item.id],
                                  content: e.currentTarget.value,
                                },
                              }))
                            }
                          />
                          <div className={styles.editingButton}>
                            <Button onClick={() => cancelMessageEdit(item.id)}>
                              Cancel
                            </Button>
                            <Button
                              type="primary"
                              style={{ marginLeft: 8 }}
                              onClick={() => {
                                const editMessage = `Below is my response. I have answered your questions directly beneath them AND/OR  revised your proposal by adding, deleting, or modifying content. \n\n ${
                                  editMessageMap[item.id].content
                                }`;
                                sendMessage(editMessage);
                                cancelMessageEdit(item.id);
                              }}
                            >
                              Send
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Markdown rehypePlugins={[rehypeRaw]}>
                          {item.messageType === "error"
                            ? "Something wrong with Viona, please retry."
                            : item.content}
                        </Markdown>
                      )}

                      {(() => {
                        // 附加按钮
                        const roleOverview = (item.extraTags ?? []).find(
                          (tag) => tag.name === "request-role-overview"
                        );
                        const copyLink = (item.extraTags ?? []).find(
                          (tag) => tag.name === "copy-link"
                        );

                        return (
                          <>
                            {roleOverview && (
                              <div style={{ marginBottom: 16 }}>
                                <Button
                                  type="primary"
                                  onClick={() => setShowRoleOverviewModal(true)}
                                >
                                  Share Role Overview
                                </Button>
                              </div>
                            )}
                            {copyLink && (
                              <div style={{ marginBottom: 16 }}>
                                <Button
                                  type="primary"
                                  onClick={async () => {
                                    await copy(copyLink.content);
                                    message.success("Copied");
                                  }}
                                >
                                  Copy Link
                                </Button>
                              </div>
                            )}
                          </>
                        );
                      })()}

                      {(() => {
                        // 操作区
                        return allowEditMessage &&
                          item.role === "ai" &&
                          item.id !== "fake_ai_id" &&
                          !editMessageMap[item.id]?.enabled ? (
                          <div className={styles.operationArea}>
                            <Button.Group>
                              <Button
                                shape="round"
                                onClick={() =>
                                  setEditMessageMap((current) => ({
                                    ...current,
                                    [item.id]: {
                                      enabled: true,
                                      content: item.content,
                                    },
                                  }))
                                }
                                icon={<EditOutlined />}
                                ref={(e) => {
                                  if (maxIdOfAIMessage === item.id)
                                    editMessageTourElementRef.current = e;
                                }}
                              />
                              <Button
                                shape="round"
                                onClick={async () => {
                                  await copy(item.content);
                                  message.success("Copied");
                                }}
                                icon={<CopyOutlined />}
                              />
                            </Button.Group>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.inputArea}>
        <div style={{ marginBottom: 12, display: "flex", gap: 10 }}>
          {(type === "jobDescription" || type === "jobInterviewPlan") && (
            <Button
              type="default"
              shape="round"
              icon={<Icon icon={<BagIcon />} style={{ fontSize: 20 }} />}
              onClick={() => onChangeType?.("jobRequirementDoc")}
            >
              Write Requirement Document
            </Button>
          )}
          {!!job?.requirement_doc_id && (
            <>
              {type !== "jobDescription" && (
                <Button
                  type="default"
                  shape="round"
                  icon={
                    <Icon icon={<WriteJdIcon />} style={{ fontSize: 20 }} />
                  }
                  onClick={() => onChangeType?.("jobDescription")}
                >
                  Write Job Description
                </Button>
              )}
              {type !== "jobInterviewPlan" && (
                <Button
                  type="default"
                  shape="round"
                  icon={
                    <Icon
                      icon={<WriteInterviewPlanIcon />}
                      style={{ fontSize: 20 }}
                    />
                  }
                  onClick={() => onChangeType?.("jobInterviewPlan")}
                >
                  Write Interview Plan
                </Button>
              )}
            </>
          )}
          {!!job?.jd_doc_id && (
            <Button
              shape="round"
              onClick={async () => {
                const url = `${window.location.origin}/jobs/${job.id}/chat`;
                await copy(url);
                message.success("Copied");
              }}
            >
              Copy Link
            </Button>
          )}
        </div>
        <Input.TextArea
          ref={(element) => (textInstanceRef.current = element)}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={
            allowEditMessage
              ? "Reply to Viona or edit Viona's message directly"
              : "Reply to Viona"
          }
          style={{
            width: "100%",
            marginRight: "8px",
            resize: "none",
          }}
          onCompositionStart={() => {
            isCompositingRef.current = true;
          }}
          onCompositionEnd={() => {
            isCompositingRef.current = false;
          }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          autoSize={{
            minRows: 1,
            maxRows: 16,
          }}
        />
        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 10,
            justifyContent: "space-between",
          }}
        >
          <Button type="primary" onClick={submit} disabled={!canSubmit()}>
            Send
          </Button>

          <div style={{ display: "flex", gap: 10 }}>
            {false && type === "candidate" && (
              <>
                <Upload
                  beforeUpload={() => false}
                  onChange={(fileInfo) => uploadDocx(fileInfo)}
                  showUploadList={false}
                  accept=".docx"
                  multiple={false}
                >
                  <Button type="primary">DOCX</Button>
                </Upload>

                <Upload
                  beforeUpload={() => false}
                  onChange={(fileInfo) => uploadPdf(fileInfo)}
                  showUploadList={false}
                  accept=".pdf"
                  multiple={false}
                >
                  <Button type="primary">PDF</Button>
                </Upload>
              </>
            )}

            <Button
              type="primary"
              danger={isRecording}
              shape="circle"
              icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
              onClick={isRecording ? stopRecord : startRecord}
            />
          </div>
        </div>
      </div>

      <RoleOverviewModal
        open={showRoleOverviewModal}
        onClose={() => setShowRoleOverviewModal(false)}
        onOk={(result: string) => {
          sendRoleOverviwe(result);
          setShowRoleOverviewModal(false);
        }}
      />

      <Tour
        open={editMessageTourOpen}
        onClose={() => {
          localStorage.setItem(EditMessageGuideKey, Date.now().toString());
          setEditMessageTourOpen(false);
        }}
        steps={EditMessageTourSteps}
        closable={false}
      />
    </div>
  );
};

export default ChatRoom;
