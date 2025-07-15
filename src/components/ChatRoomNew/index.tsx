import React, { useState, useRef, useEffect } from "react";

import {
  Avatar,
  List,
  Input,
  Button,
  message,
  Tour,
  TourStepProps,
  Modal,
  FloatButton,
  Steps,
  Upload,
} from "antd";
import { CopyOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import classnames from "classnames";
import dayjs, { Dayjs } from "dayjs";
import { ClipLoader, ScaleLoader } from "react-spinners";
import "@mdxeditor/editor/style.css";

import { Get, Post, PostFormData } from "../../utils/request";
import JobRequirementFormDrawer from "./components/JobRequirementFormDrawer";

import VionaAvatar from "../../assets/viona-avatar.png";
import UserAvatar from "../../assets/user-avatar.png";
import styles from "./style.module.less";
import {
  IProps,
  TChatType,
  TDoneTag,
  TExtraTag,
  TExtraTagName,
  TMessage,
  TMessageFromApi,
  TRoleOverviewType,
} from "./type";
import { copy } from "../../utils";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import MarkdownContainer from "../MarkdownContainer";
import { useNavigate } from "react-router";
import MarkdownEditor from "../MarkdownEditor";
import useAssemblyOffline from "@/hooks/useAssemblyOffline";
import ReactDOM from "react-dom";
import SelectOptionsForm from "./components/SelectOptionsForm";

const EditMessageGuideKey = "edit_message_guide_timestamp";
const datetimeFormat = "YYYY/MM/DD HH:mm:ss";

type TSupportTag = {
  key: TExtraTagName;
  title: string;
  handler: (tag?: { name: string; content: string }) => void;
  autoTrigger?: boolean;
};

const ChatRoomNew: React.FC<IProps> = (props) => {
  const {
    chatType,
    jobId,
    allowEditMessage = false,
    share = false,
    jobInterviewDesignerId,
    jobInterviewFeedbackId,
    onChangeTab,
    onNextTask,
  } = props;

  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(".");
  const [jrdProgress, setJrdProgress] = useState<number>(0);

  // job 仅用来判断进度。当 role 为 candidate 时不需要 job
  const [job, setJob] = useState<IJob>();
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

  const [selectOptionsType, setSelectOptionsType] = useState<
    "high_level_responsibility" | "day_to_day_tasks" | "icp"
  >();
  const [selectOptionsModalOpen, setSelectOptionsModalOpen] = useState(false);

  // 最后一条消息的 id，用于控制新增消息的自动弹出
  const lastMessageIdRef = useRef<string>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isCompositingRef = useRef(false);
  const editMessageTourElementRef = useRef<
    HTMLButtonElement | HTMLAnchorElement | null
  >();
  const needScrollToBottom = useRef(false);
  const loadingStartedAtRef = useRef<Dayjs>();
  const listContainerRef = useRef<HTMLDivElement | null>();

  const { t: originalT, i18n } = useTranslation();
  const navigate = useNavigate();

  const { isRecording, volume, isTranscribing } = useAssemblyOffline({
    onFinish: (result) => {
      // console.log("handle result:", result);
      sendMessage(result);
    },
    disabled:
      isLoading ||
      showJobRequirementFormDrawer ||
      selectOptionsModalOpen ||
      !!markdownEditMessageId,
  });

  const SurveyLink =
    i18n.language === "zh-CN"
      ? "https://ccn778871l8s.feishu.cn/share/base/form/shrcngf6iPqgTexsGeu7paeCjxf"
      : "https://igk8gb3qpgz.sg.larksuite.com/share/base/form/shrlgfakyAOv0sKElWPJMjC8yTh";

  useEffect(() => {
    initProfile();
    fetchJob();
    fetchMessages();
    needScrollToBottom.current = true;
  }, []);

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
    return url;
  };

  const changeChatType = (chatType: TChatType) => {
    navigate(`/jobs/${jobId}/chat/${chatType}`);
  };

  const apiMapping: Record<TChatType, { get: string; send: string }> = {
    jobRequirementDoc: {
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_REQUIREMENT/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_REQUIREMENT/send`),
    },
    jobDescription: {
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_DESCRIPTION/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_DESCRIPTION/send`),
    },
    jobInterviewPlan: {
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_INTERVIEW_PLAN/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_INTERVIEW_PLAN/send`),
    },
    jobInterviewDesign: {
      get: formatUrl(
        `/api/jobs/${jobId}/interview_designers/${jobInterviewDesignerId}/messages`
      ),
      send: formatUrl(
        `/api/jobs/${jobId}/interview_designers/${jobInterviewDesignerId}/send`
      ),
    },
    jobInterviewFeedback: {
      get: formatUrl(
        `/api/jobs/${jobId}/interview_feedbacks/${jobInterviewFeedbackId}/messages`
      ),
      send: formatUrl(
        `/api/jobs/${jobId}/interview_feedbacks/${jobInterviewFeedbackId}/send`
      ),
    },
  };

  const handleJobRequirementFormDrawerOpen = (open: boolean) => {
    setShowJobRequirementFormDrawer(open);
  };

  const openJobRequirementFormDrawer = (type: TRoleOverviewType) => {
    setJobRequirementFormType(type);
    handleJobRequirementFormDrawerOpen(true);
  };

  const supportTags: TSupportTag[] = [
    {
      key: "huoqujibenxinxi-jindu-one",
      title: t("share_basic"),
      handler: () => openJobRequirementFormDrawer("basic_info"),
      autoTrigger: true,
    },
    {
      key: "huoqucailiao",
      title: t("share_reference"),
      handler: () => {},
      // autoTrigger: true,
    },
    {
      key: "extract-high-level-responsibility",
      title: "核心职责清单",
      handler: async () => {
        setSelectOptionsModalOpen(true);
        setSelectOptionsType("high_level_responsibility");
      },
    },
    {
      key: "extract-day-to-day-tasks",
      title: "每日任务清单",
      handler: async () => {
        setSelectOptionsModalOpen(true);
        setSelectOptionsType("day_to_day_tasks");
      },
    },
    {
      key: "extract-icp",
      title: "理想候选人画像",
      handler: async () => {
        setSelectOptionsModalOpen(true);
        setSelectOptionsType("icp");
      },
    },
    {
      key: "salary-structure-request",
      title: t("salary_structure"),
      handler: () => openJobRequirementFormDrawer("salary_structure"),
      autoTrigger: true,
    },
    {
      key: "jrd-done",
      title: t("view_jrd"),
      handler: () => {
        onNextTask
          ? onNextTask()
          : onChangeTab?.("info", { docType: "requirement" });
      },
    },

    {
      key: "copy-link",
      title: t("copy_link"),
      handler: async (tag) => {
        if (tag) {
          await copy(tag.content);
          message.success(t("copied"));
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
      key: "to-jd-btn",
      title: t("draft_job_description"),
      handler: () => changeChatType("jobDescription"),
    },
    {
      key: "to-interview-plan-btn",
      title: t("define_interview_plan"),
      handler: () => changeChatType("jobInterviewPlan"),
    },
  ];

  const fetchJob = async () => {
    const { code, data } = await Get(formatUrl(`/api/jobs/${jobId}`));

    if (code === 0) {
      const job: IJob = data.job ?? data;
      setJob(job);
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
    const { code, data } = await Get(apiMapping[chatType as TChatType].get);
    if (code === 0) {
      const job: IJob = data.job;
      setJob(job);

      const messageHistory = formatMessages(data.messages, job);
      const isLoading = data.is_invoking === 1;
      setIsLoading(isLoading);

      if (chatType === "jobRequirementDoc") {
        const tagPrograss = {
          "huoqujibenxinxi-jindu-one": 0,
          "extract-high-level-responsibility": 1,
          "extract-day-to-day-tasks": 2,
          "extract-icp": 3,
        };

        let progress = 0;
        messageHistory.forEach((message) => {
          (message.extraTags ?? []).forEach((tag) => {
            if (Object.keys(tagPrograss).includes(tag.name)) {
              progress = tagPrograss[tag.name as keyof typeof tagPrograss];
            }
          });
        });
        setJrdProgress(progress);
      }
      // 自动执行标签逻辑
      const lastMessage = messageHistory[messageHistory.length - 1];
      if (lastMessage) {
        if (lastMessage.id !== lastMessageIdRef.current) {
          // 如果最后一条消息需要弹表单或者抽屉，则直接打开
          let extraTag;
          const autoTriggerTag = supportTags.find((supportTag) => {
            extraTag = (lastMessage.extraTags ?? []).find(
              (tag) => supportTag.key === tag.name && supportTag.autoTrigger
            );
            return !!extraTag;
          });
          autoTriggerTag?.handler(extraTag);
        }
        lastMessageIdRef.current = lastMessage.id;
      }

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
    }
  };

  const openSurvey = async () => {
    window.open(SurveyLink, "popup", "width=1000,height=800");
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // 先滚动到底部，再向上滚动 100px
      messagesEndRef.current.scrollIntoView();
      if (messagesEndRef.current.parentElement) {
        messagesEndRef.current.parentElement.scrollTop -= 120;
      }
    }
  };

  const getNextStepsExtraTags = (job: IJob): TExtraTag[] => {
    if (!job) return [];

    return [
      !job.jd_doc_id && {
        name: `to-jd-btn`,
        content: "",
      },
      !job.interview_plan_doc_id && {
        name: `to-interview-plan-btn`,
        content: "",
      },
    ].filter(Boolean) as TExtraTag[];
  };

  const formatMessages = (
    messages: TMessageFromApi[],
    job: IJob
  ): TMessage[] => {
    // 根据 extraTag 添加系统消息
    const resultMessages: TMessage[] = [];

    messages.forEach((item) => {
      // 过滤对该角色隐藏的消息
      if ((item.content.metadata.hide_for_roles ?? []).length && share) return;

      if (
        item.content.content ||
        item.content.metadata.message_sub_type === "error"
      ) {
        const extraTags = item.content.metadata.extra_tags || [];
        if (extraTags.map((item) => item.name).includes("jrd-done")) {
          extraTags.push(...getNextStepsExtraTags(job));
        }
        resultMessages.push({
          id: item.id.toString(),
          role: item.content.role === "assistant" ? "ai" : "user",
          content: item.content.content,
          thinking: item.content.thinking ?? "",
          updated_at: item.updated_at,
          messageType: item.content.metadata.message_type || "normal",
          messageSubType: item.content.metadata.message_sub_type || "normal",
          extraTags: extraTags,
        });
      }

      // 下一步 按钮
      (item.content.metadata.extra_tags ?? []).forEach((tag) => {
        (["jd-done", "interview-plan-done"] as TDoneTag[]).forEach((step) => {
          if (step === tag.name) {
            const nextExtraTags = getNextStepsExtraTags(job);
            if (nextExtraTags.length > 0) {
              resultMessages.push({
                id: `${item.id.toString()}-${step}-btn`,
                role: "ai",
                content: t("jrd_next_task"),
                updated_at: item.updated_at,
                messageType: "system",
                extraTags: nextExtraTags,
              });
            }
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

    setInputValue("");

    await sendMessage(inputValue.trim().replaceAll("\n", "\n\n"));
  };

  const sendJobRequirementForm = async (JobRequirementFormMessage: string) => {
    const { code } = await Post(formatUrl(`/api/jobs/${jobId}/document`), {
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
    if (isLoading) return;

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

    const { code } = await Post(apiMapping[chatType as TChatType].send, {
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

  return (
    <div className={styles.container}>
      <div className={styles.right}>
        {chatType === "jobRequirementDoc" && (
          <div className={styles.progressWrapper}>
            <Steps
              progressDot
              direction="horizontal"
              size="small"
              current={jrdProgress}
              items={[
                { title: t("gather_basic_information") },
                { title: "核心职责清单" },
                { title: "每日任务清单" },
                { title: "理想候选人画像" },
              ]}
            />
          </div>
        )}
        <div
          className={styles.listArea}
          ref={(e) => (listContainerRef.current = e)}
        >
          <List
            dataSource={messages}
            split={false}
            renderItem={(item, index) => {
              const isLast = index === messages.length - 1;
              return (
                <List.Item
                  style={
                    isLast
                      ? {
                          minHeight:
                            (listContainerRef.current?.clientHeight ?? 80) - 8, // 32 is container's padding
                          alignItems: "flex-start",
                        }
                      : {}
                  }
                >
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
                            : `Viona, ${t("viona_intro_staff")}`}
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
                          item.role === "user" ? styles.user : "",
                          {
                            [styles.lastMessage]: index === messages.length - 1,
                          }
                        )}
                      >
                        {!!item.thinking && !!profile?.is_admin && (
                          <div
                            style={{
                              backgroundColor: "#f1f1f1",
                              margin: "12px 0",
                              padding: "12px",
                              borderRadius: "16px",
                              color: "gray",
                            }}
                          >
                            <MarkdownContainer content={item.thinking} />
                          </div>
                        )}
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
                            content={
                              item.messageSubType === "error"
                                ? "Something wrong with Viona, please retry."
                                : item.content
                            }
                          />
                        )}

                        {(() => {
                          const visibleTags = (item.extraTags ?? [])
                            .map((extraTag) => {
                              return supportTags.find(
                                (tag) => tag.key === extraTag.name
                              );
                            })
                            .filter(Boolean) as TSupportTag[];

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
                                  <div
                                    style={{
                                      marginBottom: 16,
                                      ...(tag.key === "jrd-done"
                                        ? {
                                            borderRight: "1px solid #d9d9d9",
                                            paddingRight: 8,
                                          }
                                        : {}),
                                    }}
                                    key={tag.key}
                                  >
                                    {tag.key === "huoqucailiao" ? (
                                      <Upload
                                        beforeUpload={() => false}
                                        onChange={async (fileInfo) => {
                                          const formData = new FormData();
                                          formData.append(
                                            "file",
                                            fileInfo.file as any
                                          );
                                          const { code, data } =
                                            await PostFormData(
                                              `/api/jobs/${jobId}/upload_resume_for_interview_design`,
                                              formData
                                            );
                                          if (code === 0) {
                                            sendMessage(data.resume);
                                          } else {
                                            message.error("Upload failed");
                                          }
                                        }}
                                        showUploadList={false}
                                        accept="text/plain,.docx,.pdf"
                                        multiple={false}
                                      >
                                        <Button type="primary">
                                          {tag.title}
                                        </Button>
                                      </Upload>
                                    ) : (
                                      <Button
                                        type="primary"
                                        onClick={() => {
                                          const extraTag = (
                                            item.extraTags ?? []
                                          ).find(
                                            (extraTag) =>
                                              extraTag.name === tag.key
                                          );
                                          tag.handler(extraTag);
                                        }}
                                        style={
                                          tag.key === "jrd-done"
                                            ? {
                                                backgroundColor: "#5489f3",
                                              }
                                            : {}
                                        }
                                      >
                                        {tag.title}
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {(() => {
                          const canEditing = canMessageEdit(item);

                          const canDelete =
                            chatType !== "jobInterviewDesign" &&
                            chatType !== "jobInterviewFeedback" &&
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
                                        message.success(t("copied"));
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
              );
            }}
          />
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <div style={{ marginBottom: 10, gap: 5, display: "flex" }}>
            {[
              ...(chatType === "jobDescription"
                ? [t("make_details"), t("make_concise")]
                : []),
              t("yes"),
              t("no"),
              t("accurate"),
              t("proposal"),
              t("no_others"),
            ].map((text) => {
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

          <Input.TextArea
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
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
            onCompositionStartCapture={() => (isCompositingRef.current = true)}
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
              justifyContent: "space-between",
            }}
          >
            <div></div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button type="primary" onClick={submit} disabled={!canSubmit()}>
                {originalT("submit")}
              </Button>
            </div>
          </div>
        </div>

        <FloatButton onClick={() => openSurvey()} type="primary" />

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
        />

        <Modal
          open={selectOptionsModalOpen}
          footer={null}
          destroyOnClose
          style={{
            top: 0,
            maxWidth: "100vw",
            height: "100vh",
          }}
          width="100vw"
          onCancel={() => setSelectOptionsModalOpen(false)}
          title={
            selectOptionsType === "high_level_responsibility"
              ? "高级别职责草案"
              : selectOptionsType === "day_to_day_tasks"
              ? "建议日常任务清单"
              : "理想候选人画像(ICP)"
          }
          closable={false}
          maskClosable={false}
        >
          {job && selectOptionsType && (
            <div
              style={{
                height: "calc(100vh - 72px)",
                overflow: "auto",
              }}
            >
              <SelectOptionsForm
                job={job}
                type={selectOptionsType}
                onOk={(result) => {
                  sendMessage(result);
                  setSelectOptionsModalOpen(false);
                }}
                onClose={() => {
                  setSelectOptionsModalOpen(false);
                }}
              />
            </div>
          )}
        </Modal>

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
                sendMessage(markdownEditMessageContent, {
                  before_text: `#### ${t("edit_message_hint")}\n\n`,
                });
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
            <MarkdownEditor
              value={markdownEditMessageContent}
              onChange={(md) => setMarkdownEditMessageContent(md)}
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

      {ReactDOM.createPortal(
        <div
          style={{
            position: "fixed",
            zIndex: 999999,
            width: "100vw",
            height: "100vh",
            left: 0,
            top: 0,
            display: isRecording || isTranscribing ? "flex" : "none",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.1)",
              width: 80,
              height: 80,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isRecording ? (
              <ScaleLoader
                color="#1FAC6A"
                height={60 * Math.min(1, volume * 3) + 5}
                width={8}
              />
            ) : (
              <ClipLoader color="#1FAC6A" size={32} />
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default observer(ChatRoomNew);
