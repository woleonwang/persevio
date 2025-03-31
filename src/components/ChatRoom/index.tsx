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
  DeleteOutlined,
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
import {
  IProps,
  TChatType,
  TChatTypeWithApi,
  TExtraTagName,
  TMessage,
  TMessageFromApi,
  TRoleOverviewType,
} from "./type";
import { copy } from "../../utils";

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
const datetimeFormat = "YYYY/MM/DD HH:mm:ss";

const ChatRoom: React.FC<IProps> = (props) => {
  const { jobId, sessionId, allowEditMessage = false, role = "staff" } = props;
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [loadingText, setLoadingText] = useState(".");
  // job 仅用来判断进度。role 为 candidate 时不需要
  const [job, setJob] = useState<IJob>();
  const [jobUrl, setJobUrl] = useState("");
  const [showRoleOverviewModal, setShowRoleOverviewModal] = useState(false);
  const [editMessageMap, setEditMessageMap] = useState<
    Record<string, { enabled: boolean; content: string }>
  >({});
  const [editMessageTourOpen, setEditMessageTourOpen] = useState(false);
  const [chatType, setChatType] = useState<TChatType>();
  const [roleOverviewType, setRoleOverviewType] = useState<TRoleOverviewType>();
  const [profile, setProfile] = useState<{
    name: string;
    is_admin: number;
  }>();

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

  useEffect(() => {
    setChatType(undefined);
    setMessages([]);
    if (role === "candidate") {
      setChatType("candidate");
    } else {
      initJob();
      if (role === "staff") {
        initProfile();
      }
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

  const initJob = async () => {
    const { code, data } = await Get(formatUrl(`/api/jobs/${jobId}`));

    if (code === 0) {
      const job: IJob = data.job ?? data;
      setJob(job);
      setJobUrl(data.url);
      let initChatType: TChatType = "jobRequirementDoc";
      if (job.interview_plan_doc_id) {
        initChatType = "jobDescription";
      } else if (job.requirement_doc_id) {
        initChatType = "jobInterviewPlan";
      }
      setChatType(initChatType);
    } else {
      message.error("Get job failed");
    }
  };

  const initProfile = async () => {
    const { code, data } = await Get("/api/settings");
    if (code === 0) {
      const { staff_name, is_admin } = data;
      setProfile({
        name: staff_name,
        is_admin: is_admin,
      });
    }
  };

  const fetchMessages = async () => {
    if (!chatType) return;

    if (chatType === "chatbot") {
      const url = jobUrl ?? `${window.location.origin}/jobs/${jobId}/chat`;
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
        if (role !== "candidate") {
          if (!!data.job.requirement_doc_id && !data.job.jrd_survey_opened_at) {
            const { code } = await Post(
              formatUrl(`/api/jobs/${data.job.id}/open_survey`)
            );
            if (code === 0) {
              window.open(
                "https://igk8gb3qpgz.sg.larksuite.com/wiki/Bf5DwwQLlixR12kY7jFl8qWPg2c?fromScene=spaceOverview&table=tblYl7ujQvy1Fj1F&view=vewYMhEF8Z",
                "popup",
                "width=1000,height=800"
              );
            }
          }
          setJob(data.job);
        }
      }
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  };

  const formatMessages = (messages: TMessageFromApi[]): TMessage[] => {
    // 根据 extraTag 添加系统消息
    const resultMessages: TMessage[] = [];

    messages.forEach((item) => {
      // 过滤对该角色隐藏的消息
      if ((item.content.metadata.hide_for_roles ?? []).includes(role)) return;

      if (
        item.content.content ||
        item.content.metadata.message_sub_type === "error"
      ) {
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

  const sendRoleOverview = async (roleOverview: string) => {
    const { code } = await Post(formatUrl(`/api/jobs/${jobId}/role_overview`), {
      type: roleOverviewType,
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

    // 仅限额时报错。其它情况，不用报错。轮询会保证最终结果一致
    if (code === 10011) {
      setIsLoading(false);
      setMessages(messages);
      message.error("Your quota has been exhausted.");
    }
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

  const uploadFile = async (
    fileInfo: UploadChangeParam<UploadFile<any>>,
    fileType: "docx" | "pdf"
  ) => {
    const file = fileInfo.file;

    if (file && !file.status) {
      const formatValid =
        (fileType === "pdf" && file.type === "application/pdf") ||
        (fileType === "docx" &&
          file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      if (!formatValid) {
        message.error(
          `You can only upload ${fileType === "pdf" ? "PDF" : "Docx"} file!`
        );
        return;
      }

      const formData = new FormData();
      formData.append("file", file as any);
      const { code } = await PostFormData(
        `/api/public/jobs/${jobId}/candidate_chat/${sessionId}/upload_attachment/${fileType}`,
        formData
      );

      if (code === 0) {
        message.success("Upload succeed");
      } else {
        message.error("Upload failed");
      }
    }
  };

  const cancelMessageEdit = (id: string) => {
    setEditMessageMap((current) => {
      const newValue = { ...current };
      delete newValue[id];
      return newValue;
    });
  };

  const deleteMessage = async (messageId: number) => {
    const { code } = await Post(`/api/jobs/${jobId}/messages`, {
      message_id: messageId,
    });

    if (code === 0) {
      message.success("Delete message successfully");
      fetchMessages();
    } else {
      message.error("Delete message failed");
    }
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
                            key: "basic-info-request",
                            title: "Click here to share basic information",
                            handler: () => {
                              setRoleOverviewType("basic_info");
                              setShowRoleOverviewModal(true);
                            },
                          },
                          {
                            key: "reference-request",
                            title: "Click here to share references",
                            handler: () => {
                              setRoleOverviewType("reference");
                              setShowRoleOverviewModal(true);
                            },
                          },
                          {
                            key: "team-context-request",
                            title: "Click here to share team context",
                            handler: () => {
                              setRoleOverviewType("team_context");
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
                        const canEditing =
                          allowEditMessage &&
                          item.messageType === "normal" &&
                          item.role === "ai" &&
                          item.id !== "fake_ai_id" &&
                          !editMessageMap[item.id]?.enabled;

                        const canDelete =
                          !!profile?.is_admin &&
                          item.messageType === "normal" &&
                          !["fake_ai_id", "fake_user_id"].includes(item.id);
                        // 操作区. 普通类型消息 && 大模型生成 && 不是 mock 消息 && 非编辑状态

                        return canEditing || canDelete ? (
                          <div className={styles.operationArea}>
                            <Button.Group>
                              {canEditing && (
                                <>
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
                                </>
                              )}
                              {canDelete && (
                                <Button
                                  shape="round"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Confirm to delete messages after this message?"
                                      )
                                    ) {
                                      deleteMessage(parseInt(item.id));
                                    }
                                  }}
                                  icon={<DeleteOutlined />}
                                />
                              )}
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
              onChange={(e) => setInputValue(e.target.value)}
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
                      onChange={(fileInfo) => uploadFile(fileInfo, "docx")}
                      showUploadList={false}
                      accept=".docx"
                      multiple={false}
                    >
                      <Button type="primary">DOCX</Button>
                    </Upload>

                    <Upload
                      beforeUpload={() => false}
                      onChange={(fileInfo) => uploadFile(fileInfo, "pdf")}
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
          group={roleOverviewType}
          onOk={(result: string) => {
            sendRoleOverview(result);
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
