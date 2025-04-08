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
  Modal,
  Drawer,
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
import dayjs, { Dayjs } from "dayjs";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  headingsPlugin,
  listsPlugin,
  ListsToggle,
  MDXEditor,
  quotePlugin,
  Separator,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

import type { TextAreaRef } from "antd/es/input/TextArea";
import type { UploadChangeParam, UploadFile } from "antd/es/upload";

import { Get, Post, PostFormData } from "../../utils/request";
import JobRequirementFormDrawer from "./components/JobRequirementFormDrawer";
import globalStore from "../../store/global";

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
import IdealProfileForm from "./components/IdealProflieForm";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import MarkdownContainer from "../MarkdownContainer";

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
  const {
    jobId,
    sessionId,
    allowEditMessage = false,
    role = "staff",
    onChangeTab,
  } = props;

  const [chatType, setChatType] = useState<TChatType>();
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [loadingText, setLoadingText] = useState(".");
  // job 仅用来判断进度。当 role 为 candidate 时不需要 job
  const [job, setJob] = useState<IJob>();
  const [jobUrl, setJobUrl] = useState("");
  const [profile, setProfile] = useState<ISettings>();
  // 表单抽屉
  const [showJobRequirementFormDrawer, setShowJobRequirementFormDrawer] =
    useState(false);
  const [jobRequirementFormType, setJobRequirementFormType] =
    useState<TRoleOverviewType>();
  const [editMessageTourOpen, setEditMessageTourOpen] = useState(false);
  // 编辑消息
  const [markdownEditMessageId, setMarkdownEditMessageId] = useState<string>();
  const [markdownEditMessageContent, setMarkdownEditMessageContent] =
    useState<string>("");
  const [idealProfileDrawerOpen, setIdealProfileDrawerOpen] = useState(false);

  // 最后一条消息的 id，用于控制新增消息的自动弹出
  const lastMessageIdRef = useRef<string>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isCompositingRef = useRef(false);
  const recognitionRef = useRef<any>();
  const originalInputRef = useRef<string>("");
  const isRecordingRef = useRef(false);
  isRecordingRef.current = isRecording;
  const textInstanceRef = useRef<TextAreaRef | null>();
  const editMessageTourElementRef = useRef<
    HTMLButtonElement | HTMLAnchorElement | null
  >();
  const needScrollToBottom = useRef(false);
  const loadingStartedAtRef = useRef<Dayjs>();

  const { t: originalT, i18n } = useTranslation();

  const { collapseForDrawer, setCollapseForDrawer } = globalStore;

  useEffect(() => {
    if (role === "staff") {
      initProfile();
    }

    return () => {
      setCollapseForDrawer(false);
    };
  }, []);

  useEffect(() => {
    setChatType(undefined);
    setMessages([]);
    setIdealProfileDrawerOpen(false);
    setShowJobRequirementFormDrawer(false);
    // 如果不加 setTimeout, 会跳过 chatType = undefined 的中间状态，不会 fetchMessage
    setTimeout(() => {
      setCollapseForDrawer(false);
    }, 0);

    if (role === "candidate") {
      setChatType("candidate");
    } else {
      initJob();
    }
  }, [jobId]);

  useEffect(() => {
    if (isLoading) {
      loadingStartedAtRef.current = dayjs();
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
    } else {
      loadingStartedAtRef.current = undefined;
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

  const t = (key: string) => {
    return originalT(`chat.${key}`);
  };

  const EditMessageTourSteps: TourStepProps[] = [
    {
      title: t("edit_message"),
      description: t("edit_message_desc"),
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

  const handleJobRequirementFormDrawerOpen = (open: boolean) => {
    setCollapseForDrawer(open);
    setShowJobRequirementFormDrawer(open);
  };

  const openJobRequirementFormDrawer = (type: TRoleOverviewType) => {
    setJobRequirementFormType(type);
    handleJobRequirementFormDrawerOpen(true);
  };

  const triggerIdealProfileDrawer = (open: boolean) => {
    setCollapseForDrawer(open);
    setIdealProfileDrawerOpen(open);
  };

  const supportTags: {
    key: TExtraTagName;
    title: string;
    handler: (tag?: { name: string; content: string }) => void;
    autoTrigger?: boolean;
  }[] = [
    {
      key: "basic-info-request",
      title: t("share_basic"),
      handler: () => openJobRequirementFormDrawer("basic_info"),
      autoTrigger: true,
    },
    {
      key: "reference-request",
      title: t("share_reference"),
      handler: () => openJobRequirementFormDrawer("reference"),
      autoTrigger: true,
    },
    {
      key: "team-context-request",
      title: t("share_team"),
      handler: () => openJobRequirementFormDrawer("team_context"),
      autoTrigger: true,
    },
    {
      key: "other-requirements-request",
      title: t("other_requirements"),
      handler: () => openJobRequirementFormDrawer("other_requirement"),
      autoTrigger: true,
    },
    {
      key: "profile-feedback-and-priorities-request",
      title: t("ideal_profile"),
      handler: () => triggerIdealProfileDrawer(true),
      autoTrigger: true,
    },
    {
      key: "jrd-done",
      title: t("view_jrd"),
      handler: () => {
        onChangeTab?.("info", { docType: "requirement" });
      },
      autoTrigger: true,
    },

    {
      key: "copy-link",
      title: t("copy_link"),
      handler: async (tag) => {
        if (tag) {
          await copy(tag.content);
          message.success("Copied");
        }
      },
    },
    {
      key: "open-link",
      title: t("open"),
      handler: async (tag) => {
        if (tag) {
          window.open(tag.content);
        }
      },
    },

    {
      key: "jrd-done-btn",
      title: t("define_interview_plan"),
      handler: () => setChatType("jobInterviewPlan"),
    },
    {
      key: "interview-plan-done-btn",
      title: t("draft_job_description"),
      handler: () => setChatType("jobDescription"),
    },
    {
      key: "jd-done-btn",
      title: t("jd_done"),
      handler: () => setChatType("chatbot"),
    },
  ];

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
      setProfile(data);
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
          content: t("chatbot_greeting"),
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

        // 自动执行标签逻辑
        const lastMessage = messageHistory[messageHistory.length - 1];
        if (lastMessage.id !== lastMessageIdRef.current) {
          // 如果最后一条消息需要弹表单或者抽屉，则直接打开
          const autoTriggerTag = supportTags.find((supportTag) => {
            return !!(lastMessage.extraTags ?? []).find(
              (tag) => supportTag.key === tag.name && supportTag.autoTrigger
            );
          });
          autoTriggerTag?.handler();
        }
        lastMessageIdRef.current = messageHistory[messageHistory.length - 1].id;

        // 如果正在 loading，添加 fake 消息
        if (isLoading) {
          messageHistory.push({
            id: "fake_ai_id",
            role: "ai",
            content: "",
            updated_at: dayjs().format(datetimeFormat),
          });
        }
        setMessages(messageHistory);

        // 如果已完成 jrd，则跳转到调查问卷
        if (role !== "candidate") {
          if (!!data.job.requirement_doc_id && !data.job.jrd_survey_opened_at) {
            const { code } = await Post(
              formatUrl(`/api/jobs/${data.job.id}/open_survey`)
            );
            if (code === 0) {
              window.open(
                i18n.language === "zh-CN"
                  ? "https://ccn778871l8s.feishu.cn/share/base/form/shrcngf6iPqgTexsGeu7paeCjxf"
                  : "https://igk8gb3qpgz.sg.larksuite.com/wiki/Bf5DwwQLlixR12kY7jFl8qWPg2c?fromScene=spaceOverview&table=tblYl7ujQvy1Fj1F&view=vewYMhEF8Z",
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

      // 下一步 按钮
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
              content: step === "jd-done" ? t("jd_next_task") : t("next_task"),
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

  // 聊天框是否能发送
  const canSubmit = () => {
    return inputValue?.trim() && !isLoading;
  };

  const submit = async () => {
    if (!canSubmit()) return;

    stopRecord();

    setInputValue("");

    await sendMessage(inputValue.trim().replaceAll("\n", "\n\n"));
  };

  const sendJobRequirementForm = async (JobRequirementFormMessage: string) => {
    const { code } = await Post(formatUrl(`/api/jobs/${jobId}/role_overview`), {
      type: jobRequirementFormType,
      content: JobRequirementFormMessage,
    });
    if (code === 0) {
      sendMessage(JobRequirementFormMessage);
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
    if (!chatType || isLoading) return;

    const formattedMessage = rawMessage.trim();
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
      recognition.lang = i18n.language;

      recognition.onresult = (event: any) => {
        if (!isRecordingRef.current) return;

        let result = "";
        let isFinal = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          result += event.results[i][0].transcript ?? "";
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }
        console.log("result: ", result, " length:", result.length);
        if (!result) {
          console.log("events:", event.results);
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

  const canMessageEdit = (item: TMessage) => {
    return (
      allowEditMessage &&
      item.messageType === "normal" &&
      item.role === "ai" &&
      item.id !== "fake_ai_id"
    );
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
        <div
          className={styles.left}
          style={{ display: collapseForDrawer ? "none" : "block" }}
        >
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
              { title: t("create_job"), disabled: true, status: "finish" },
              {
                title: t("define_job_requirement"),
                status: chatType === "jobRequirementDoc" ? "process" : "finish",
              },
              {
                title: t("define_interview_plan"),
                disabled: !job?.requirement_doc_id,
                status:
                  chatType === "jobInterviewPlan"
                    ? "process"
                    : job?.interview_plan_doc_id
                    ? "finish"
                    : "wait",
              },
              {
                title: t("draft_job_description_btn"),
                disabled: !job?.interview_plan_doc_id,
                status:
                  chatType === "jobDescription"
                    ? "process"
                    : job?.jd_doc_id
                    ? "finish"
                    : "wait",
              },
              {
                title: t("create_chatbot"),
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
      <div
        className={styles.right}
        style={collapseForDrawer ? { width: "40vw", flex: "none" } : {}}
      >
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
                          : `Viona, ${
                              chatType === "candidate"
                                ? t("viona_intro_candidate")
                                : t("viona_intro_staff")
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
                        styles.messageContainer,
                        item.role === "user" ? styles.user : ""
                      )}
                    >
                      {item.id === "fake_ai_id" ? (
                        <p>
                          {loadingText}
                          {dayjs().diff(
                            loadingStartedAtRef.current ?? dayjs(),
                            "second"
                          ) > 30
                            ? `(${t("viona_is_thinking")})`
                            : ""}
                        </p>
                      ) : (
                        <MarkdownContainer
                          onClick={() => {
                            if (canMessageEdit(item)) {
                              setMarkdownEditMessageId(item.id);
                              setMarkdownEditMessageContent(item.content);
                            }
                          }}
                          content={
                            item.messageSubType === "error"
                              ? "Something wrong with Viona, please retry."
                              : item.content
                          }
                        />
                      )}

                      {(() => {
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
                        const canEditing = canMessageEdit(item);

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
                                    onClick={() => {
                                      setMarkdownEditMessageId(item.id);
                                      setMarkdownEditMessageContent(
                                        item.content
                                      );
                                    }}
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
                  key={message}
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
            {role !== "candidate" && (
              <div style={{ marginBottom: 10, gap: 5, display: "flex" }}>
                {(chatType === "jobDescription"
                  ? [t("make_details"), t("make_concise")]
                  : [
                      t("yes"),
                      t("no"),
                      t("accurate"),
                      t("proposal"),
                      t("no_others"),
                    ]
                ).map((text) => {
                  return (
                    <Button
                      type="primary"
                      key={text}
                      shape="round"
                      onClick={() => sendMessage(text)}
                      size="small"
                    >
                      {text}
                    </Button>
                  );
                })}
              </div>
            )}
            <Input.TextArea
              ref={(element) => (textInstanceRef.current = element)}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (isRecording) {
                  originalInputRef.current = e.target.value;
                }
              }}
              placeholder={
                allowEditMessage
                  ? t("reply_viona_directly_or_edit")
                  : t("reply_viona")
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
                justifyContent: "flex-end",
              }}
            >
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

                <Button type="primary" onClick={submit} disabled={!canSubmit()}>
                  {originalT("submit")}
                </Button>

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

        {role !== "candidate" && (
          <>
            <JobRequirementFormDrawer
              open={showJobRequirementFormDrawer}
              onClose={() => handleJobRequirementFormDrawerOpen(false)}
              group={jobRequirementFormType}
              onOk={(result: string) => {
                if (!isLoading) {
                  sendJobRequirementForm(result);
                  handleJobRequirementFormDrawerOpen(false);
                }
              }}
              isCoworker={role === "coworker"}
            />

            <Drawer
              open={idealProfileDrawerOpen}
              title={t("edit_ideal_profile")}
              width={"50vw"}
              onClose={() => triggerIdealProfileDrawer(false)}
              destroyOnClose
              mask={false}
            >
              {job?.candidate_requirements_json && (
                <IdealProfileForm
                  candidateRequirementsJson={job.candidate_requirements_json}
                  onClose={() => triggerIdealProfileDrawer(false)}
                  onOk={(groups) => {
                    // 发送
                    let message = t("edit_profiles_hint");

                    groups.forEach((group) => {
                      const { name, skills } = group;
                      if (skills.length > 0) {
                        message += `\n\n**${name}:**`;
                        skills.forEach((skill) => {
                          message += `\n\n*   **${skill.content} - ${originalT(
                            `ideal_profile.${skill.type}`
                          )}**`;
                        });
                      }
                    });

                    sendMessage(message);
                    triggerIdealProfileDrawer(false);
                  }}
                />
              )}
            </Drawer>
          </>
        )}

        <Modal
          open={!!markdownEditMessageId}
          onCancel={() => {
            setMarkdownEditMessageId(undefined);
          }}
          width={"80vw"}
          getContainer={document.body}
          destroyOnClose
          centered
          footer={[
            <Button
              key="cancel"
              onClick={() => setMarkdownEditMessageId(undefined)}
            >
              {originalT("cancel")}
            </Button>,
            <Button
              key="no_edit"
              type="primary"
              onClick={() => {
                setMarkdownEditMessageId(undefined);
                sendMessage(t("no_edits"));
              }}
            >
              {t("no_edits")}
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={() => {
                setMarkdownEditMessageId(undefined);
                sendMessage(markdownEditMessageContent);
              }}
            >
              {originalT("submit")}
            </Button>,
          ]}
        >
          <>
            <div style={{ color: "#1FAC6A", marginBottom: 12, fontSize: 16 }}>
              {t("tips")}
            </div>
            <MDXEditor
              contentEditableClassName={styles.mdEditor}
              markdown={markdownEditMessageContent}
              onChange={(md) => setMarkdownEditMessageContent(md)}
              plugins={[
                headingsPlugin(),
                quotePlugin(),
                listsPlugin(),
                thematicBreakPlugin(),
                toolbarPlugin({
                  toolbarContents: () => (
                    <>
                      <UndoRedo />
                      <BoldItalicUnderlineToggles />
                      <ListsToggle options={["bullet", "number"]} />
                      <Separator />
                      <BlockTypeSelect />
                    </>
                  ),
                }),
              ]}
            />
          </>
        </Modal>

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

export default observer(ChatRoom);
