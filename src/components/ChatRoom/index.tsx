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
  Steps,
  Spin,
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
import RoleOverviewModal from "./components/RoleOverviewModal";

import VionaAvatar from "../../assets/viona-avatar.png";
import UserAvatar from "../../assets/user-avatar.png";
import styles from "./style.module.less";

type TExtraTagName =
  | "request-role-overview" // 职位表单
  | "copy-link" // 复制链接
  | "open-link" // 打开新页面
  | "jrd-done"
  | "jrd-done-btn"
  | "interview-plan-done"
  | "interview-plan-done-btn"
  | "jd-done"
  | "jd-done-btn";

type TMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
  updated_at: string;
  messageType?: "normal" | "system";
  messageSubType?: "normal" | "error";
  extraTags?: {
    name: TExtraTagName;
    content: string;
  }[];
};

export type TChatType =
  | "jobRequirementDoc"
  | "candidate"
  | "jobDescription"
  | "jobInterviewPlan"
  | "chatbot";

type TChatTypeWithApi = Exclude<TChatType, "chatbot">;

interface IProps {
  jobId: number;
  sessionId?: string;
  allowEditMessage?: boolean;
  role?: "staff" | "coworker" | "candidate";
}

const PreDefinedMessages = [
  "Give me a brief intro about the company",
  "Which team will this role join?",
  "Who will this role report to?",
  "What is the interview process like?",
  "What is are the key objectives of this role?",
  "How is success measured?",
  "Does this role allow work from home?",
];

const EditMessageGuideKey = "edit_message_guide_timestamp";

const datetimeFormat = "MM/DD HH:mm:ss";
const ChatRoom: React.FC<IProps> = (props) => {
  const { jobId, sessionId, allowEditMessage = false, role = "staff" } = props;
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
  const [chatType, setChatType] = useState<TChatType>();

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
    setChatType(undefined);
    setMessages([]);
    if (role === "candidate") {
      setChatType("candidate");
    } else {
      initJob();
    }
  }, [jobId]);

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
    if (chatType) {
      needScrollToBottom.current = true;
      fetchMessages();
    }
  }, [chatType]);

  useEffect(() => {
    if (messages.length === 0) return;

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

  const apiMapping: Record<TChatTypeWithApi, { get: string; send: string }> = {
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

  const initJob = async () => {
    const { code, data } = await Get(
      role === "candidate"
        ? `/api/public/jobs/${jobId}`
        : formatUrl(`/api/jobs/${jobId}`)
    );
    if (code === 0) {
      setJob(data);
      const job: IJob = data;
      let initChatType: TChatType = "candidate";
      if (role !== "candidate") {
        if (job.interview_plan_doc_id) {
          initChatType = "jobDescription";
        } else if (job.requirement_doc_id) {
          initChatType = "jobInterviewPlan";
        } else {
          initChatType = "jobRequirementDoc";
        }
      }
      setChatType(initChatType);
    } else {
      message.error("Get job failed");
    }
  };
  const fetchMessages = async () => {
    if (!chatType) return;

    if (chatType === "chatbot") {
      const url = `${window.location.origin}/jobs/${jobId}/chat`;
      setMessages([
        {
          id: "chatbot-message",
          role: "ai",
          content:
            "Share this link with potential candidates to connect them with Viona, who can answer their questions and help convert any curious candidates into interested applicants.",
          updated_at: dayjs().format(datetimeFormat),
          messageType: "system",
          extraTags: [
            {
              name: "open-link",
              content: url,
            },
            {
              name: "copy-link",
              content: url,
            },
          ],
        },
      ]);
    } else {
      const { code, data } = await Get(
        apiMapping[chatType as TChatTypeWithApi].get
      );
      if (code === 0) {
        const messageHistory = formatMessages(data.messages);
        const isLoading = data.is_invoking === 1;
        setIsLoading(isLoading);
        if (isLoading) {
          messageHistory.push({
            id: "fake_ai_id",
            role: "ai",
            content: "",
            updated_at: dayjs().format(datetimeFormat),
          });
        }

        setMessages(messageHistory);
        setJob(data.job);
      }
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
          message_type: "" | "system" | "normal";
          message_sub_type: "" | "error" | "normal";
          extra_tags: {
            name: TExtraTagName;
            content: string;
          }[];
          hide_for_roles?: ("staff" | "coworker" | "candidate")[];
        };
      };
      updated_at: string;
    }[]
  ): TMessage[] => {
    // 根据 extraTag 添加系统消息
    const resultMessages: TMessage[] = [];

    messages.forEach((item) => {
      // 过滤对该角色隐藏的消息
      if ((item.content.metadata.hide_for_roles ?? []).includes(role)) return;

      if (item.content.content) {
        resultMessages.push({
          id: item.id.toString(),
          role: item.content.role === "assistant" ? "ai" : "user",
          content: item.content.content,
          updated_at: item.updated_at,
          messageType: item.content.metadata.message_type || "normal",
          messageSubType: item.content.metadata.message_sub_type || "normal",
          extraTags: item.content.metadata.extra_tags || [],
        });
      }

      (item.content.metadata.extra_tags ?? []).forEach((tag) => {
        (
          ["jrd-done", "interview-plan-done", "jd-done"] as (
            | "jrd-done"
            | "interview-plan-done"
            | "jd-done"
          )[]
        ).forEach((step) => {
          if (step === tag.name) {
            resultMessages.push({
              id: `${item.id.toString()}-${step}-btn`,
              role: "ai",
              content:
                step === "jd-done"
                  ? "With the interview plan and official job description (JD) finalized, I can confidently discuss the role with candidates and answer any questions they may have.  Simply attach me (the link below) to the JD, or share it via email/message to candidates. I'll help convert curious candidates into interested applicants"
                  : "Your next task is: ",
              updated_at: item.updated_at,
              messageType: "system",
              extraTags: [
                {
                  name: `${step}-btn`,
                  content: "",
                },
              ],
            });
          }
        });
      });
    });

    return resultMessages;
  };

  const canSubmit = () => {
    return inputValue?.trim() && !isLoading;
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

  const sendMessage = async (
    rawMessage: string,
    metadata?: {
      before_text?: string;
      after_text?: string;
    }
  ) => {
    if (!chatType) return;

    const formattedMessage = rawMessage.trim().replaceAll("\n", "\n\n");
    needScrollToBottom.current = true;
    setMessages([
      ...messages,
      {
        id: "fake_user_id",
        role: "user",
        content: formattedMessage,
        updated_at: dayjs().format(datetimeFormat),
      },
      {
        id: "fake_ai_id",
        role: "ai",
        content: "",
        updated_at: dayjs().format(datetimeFormat),
      },
    ]);
    setIsLoading(true);

    const { code } = await Post(apiMapping[chatType as TChatTypeWithApi].send, {
      content: formattedMessage,
      metadata: metadata,
    });

    if (code !== 0) {
      setIsLoading(false);
      setMessages(messages);
      if (code === 10011) {
        message.error("Your quota has been exhausted.");
      } else {
        message.error("Send message failed");
      }
    }
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

  if (!chatType) {
    return <Spin spinning />;
  }

  return (
    <div className={styles.container}>
      {chatType !== "candidate" && (
        <div className={styles.left}>
          <Steps
            direction="vertical"
            size="small"
            onChange={(current) => {
              if (current === 1) {
                setChatType("jobRequirementDoc");
              } else if (current === 2) {
                setChatType("jobInterviewPlan");
              } else if (current === 3) {
                setChatType("jobDescription");
              } else if (current === 4) {
                setChatType("chatbot");
              }
            }}
            items={[
              { title: "Open a new role", disabled: true, status: "finish" },
              {
                title: "Define job requirements",
                status: chatType === "jobRequirementDoc" ? "process" : "finish",
              },
              {
                title: "Define interview plan",
                disabled: !job?.requirement_doc_id,
                status:
                  chatType === "jobInterviewPlan"
                    ? "process"
                    : job?.interview_plan_doc_id
                    ? "finish"
                    : "wait",
              },
              {
                title: "Draft job description",
                disabled: !job?.interview_plan_doc_id,
                status:
                  chatType === "jobDescription"
                    ? "process"
                    : job?.jd_doc_id
                    ? "finish"
                    : "wait",
              },
              {
                title: "Create chatbot for candidate",
                disabled: !job?.jd_doc_id,
                status:
                  chatType === "chatbot"
                    ? "process"
                    : job?.jd_doc_id
                    ? "finish"
                    : "wait",
              },
            ]}
          />
        </div>
      )}
      <div className={styles.right}>
        <div className={styles.listArea}>
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
                              chatType === "candidate"
                                ? ", your application copilot"
                                : ", AI recruiter"
                            }`}
                      </span>
                      <span className={styles.timestamp}>
                        {dayjs(item.updated_at).format(datetimeFormat)}
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
                                const editMessage =
                                  editMessageMap[item.id].content;
                                sendMessage(editMessage, {
                                  before_text:
                                    "Below is my response. I have answered your questions directly beneath them AND/OR  revised your proposal by adding, deleting, or modifying content. \n\n",
                                });
                                cancelMessageEdit(item.id);
                              }}
                            >
                              Send
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Markdown rehypePlugins={[rehypeRaw]}>
                          {item.messageSubType === "error"
                            ? "Something wrong with Viona, please retry."
                            : item.content}
                        </Markdown>
                      )}

                      {(() => {
                        const supportTags: {
                          key: TExtraTagName;
                          title: string;
                          handler: (tag?: {
                            name: string;
                            content: string;
                          }) => void;
                        }[] = [
                          {
                            key: "request-role-overview",
                            title:
                              "Click here to share information about this role",
                            handler: () => {
                              setShowRoleOverviewModal(true);
                            },
                          },
                          {
                            key: "copy-link",
                            title: "Copy Link",
                            handler: async (tag) => {
                              if (tag) {
                                await copy(tag.content);
                                message.success("Copied");
                              }
                            },
                          },
                          {
                            key: "open-link",
                            title: "Open",
                            handler: async (tag) => {
                              if (tag) {
                                window.open(tag.content);
                              }
                            },
                          },

                          {
                            key: "jrd-done-btn",
                            title: "Define Interview Plan",
                            handler: () => setChatType("jobInterviewPlan"),
                          },
                          {
                            key: "interview-plan-done-btn",
                            title: "Draft Job Description",
                            handler: () => setChatType("jobDescription"),
                          },
                          {
                            key: "jd-done-btn",
                            title: "Viona for candidates",
                            handler: () => setChatType("chatbot"),
                          },
                        ];

                        const visibleTags = supportTags.filter((tag) =>
                          (item.extraTags ?? [])
                            .map((extraTag) => extraTag.name)
                            .includes(tag.key)
                        );

                        return (
                          <div
                            style={{
                              marginTop: 16,
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 8,
                            }}
                          >
                            {visibleTags.map((tag) => {
                              return (
                                <div style={{ marginBottom: 16 }} key={tag.key}>
                                  <Button
                                    type="primary"
                                    onClick={() => {
                                      const extraTag = (
                                        item.extraTags ?? []
                                      ).find(
                                        (extraTag) => extraTag.name === tag.key
                                      );
                                      tag.handler(extraTag);
                                    }}
                                  >
                                    {tag.title}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {(() => {
                        // 操作区
                        return allowEditMessage &&
                          chatType !== "chatbot" &&
                          item.messageType === "normal" &&
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
          <div ref={messagesEndRef} />
        </div>
        {role === "candidate" && (
          <div className={styles.preDefinedQuestionContainer}>
            {PreDefinedMessages.map((message) => {
              return (
                <div
                  className={styles.messageCard}
                  onClick={() => {
                    sendMessage(message);
                  }}
                >
                  <div>{message}</div>
                  <RightCircleOutlined
                    style={{
                      fontSize: 16,
                      color: "#1FAC6A",
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {chatType !== "chatbot" && (
          <div className={styles.inputArea}>
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
              onCompositionStartCapture={() =>
                (isCompositingRef.current = true)
              }
              onCompositionEndCapture={() => (isCompositingRef.current = false)}
              onPressEnter={(e) => {
                if (!e.shiftKey && !isCompositingRef.current) {
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
                {false && chatType === "candidate" && (
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
                  icon={
                    isRecording ? <AudioMutedOutlined /> : <AudioOutlined />
                  }
                  onClick={isRecording ? stopRecord : startRecord}
                />
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
};

export default ChatRoom;
