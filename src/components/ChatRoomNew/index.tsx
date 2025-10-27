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
  Upload,
  Popover,
  Tooltip,
} from "antd";
import {
  AudioOutlined,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SendOutlined,
  XFilled,
} from "@ant-design/icons";
import classnames from "classnames";
import dayjs, { Dayjs } from "dayjs";
import { ScaleLoader } from "react-spinners";
import "@mdxeditor/editor/style.css";

import { Get, Post, PostFormData } from "../../utils/request";

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

import SelectOptionsForm from "../ChatRoom/components/SelectOptionsForm";
import JobRequirementFormDrawer from "../ChatRoom/components/JobRequirementFormDrawer";
import globalStore from "@/store/global";
import JrdSteps from "./components/JrdSteps";

const EditMessageGuideKey = "edit_message_guide_timestamp";
const datetimeFormat = "YYYY/MM/DD HH:mm:ss";

type TSupportTag = {
  key: TExtraTagName;
  title?: string;
  handler?: (tag?: { name: string; content: string }) => void;
  children?: {
    title: string;
    handler: () => void;
  }[];
  autoTrigger?: boolean;
  style?: "inline-button" | "block-button" | "button-with-text";
};

const ChatRoomNew: React.FC<IProps> = (props) => {
  const {
    chatType,
    jobId,
    allowEditMessage = false,
    share = false,
    jobInterviewDesignerId,
    jobInterviewFeedbackId,
    viewDoc,
    onNextTask,
  } = props;

  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(".");
  const [jrdProgress, setJrdProgress] = useState<number>(0);
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [inputPlaceholder, setInputPlaceholder] = useState("");
  const [audioHintVisible, setAudioHintVisible] = useState(true);

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
    "high_level_responsibility" | "day_to_day_tasks" | "icp" | "success-metric"
  >();
  const [selectOptionsModalOpen, setSelectOptionsModalOpen] = useState(false);
  const [isUploadingJd, setIsUploadingJd] = useState(false);

  // 最后一条消息的 id，用于控制新增消息的自动弹出
  const lastMessageIdRef = useRef<string>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isCompositingRef = useRef(false);
  const editMessageTourElementRef = useRef<
    HTMLButtonElement | HTMLAnchorElement | HTMLElement | null
  >();
  const needScrollToBottom = useRef(false);
  const loadingStartedAtRef = useRef<Dayjs>();
  const listContainerRef = useRef<HTMLDivElement | null>();

  const { t: originalT, i18n } = useTranslation();
  const navigate = useNavigate();

  const { mode } = globalStore;

  const {
    startTranscription,
    endTranscription,
    isRecording,
    volume,
    isTranscribing,
    isStartRecordingOutside,
  } = useAssemblyOffline({
    onFinish: (result, payloadId) => {
      // console.log("handle result:", result);
      sendMessage(result, { voice_payload_id: payloadId });
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
    setTimeout(() => setAudioHintVisible(false), 5000);
  }, []);

  useEffect(() => {
    fetchJob();
    fetchMessages();
    needScrollToBottom.current = true;
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
        children: t("ok"),
      },
      target: () => editMessageTourElementRef.current ?? document.body,
    },
  ];

  const formatUrl = (url: string) => {
    return url;
  };

  const changeChatType = (chatType: string) => {
    navigate(`/app/jobs/${jobId}/chat/${chatType}`);
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
    jobCompensationDetails: {
      get: formatUrl(
        `/api/jobs/${jobId}/chat/JOB_COMPENSATION_DETAILS/messages`
      ),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_COMPENSATION_DETAILS/send`),
    },
    jobOutreachMessage: {
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_OUTREACH_MESSAGE/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_OUTREACH_MESSAGE/send`),
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
      key: "jrd-language",
      children: [
        {
          title: "中文",
          handler: () =>
            sendMessage(
              "好的，我们可以开始对话。请你用中文和我进行接下来的对话。"
            ),
        },
        {
          title: "English",
          handler: () =>
            sendMessage("Yes, we can start. Please speak with me in English."),
        },
      ],
    },
    {
      key: "jd-language",
      children: [
        {
          title: "中文",
          handler: async () => {
            const success = await updateJob({ jd_language: "zh-CN" });
            if (success) {
              sendMessage(
                "请用中文来撰写这个职位的JD。请你在把JD发给我之前确保你的语言是正宗地道的适合在职位描述中使用的中文。"
              );
            } else {
              message.error(t("update_job_failed"));
            }
          },
        },
        {
          title: "English",
          handler: async () => {
            const success = await updateJob({ jd_language: "en-US" });
            if (success) {
              sendMessage(
                "Please use English to draft the JD. Please make sure you use authentic English that is appropriate for the use in an official Job Description."
              );
            } else {
              message.error(t("update_job_failed"));
            }
          },
        },
      ],
    },
    {
      key: "huoqujibenxinxi-jindu-one",
      title: t("share_basic"),
      handler: () => openJobRequirementFormDrawer("basic_info"),
      autoTrigger: true,
    },
    {
      key: "upload-jd",
      title: t("share_reference"),
      handler: () => {},
      style: "block-button",
    },
    {
      key: "extract-high-level-responsibility",
      title: t("extract_high_level_responsibility"),
      handler: async () => {
        setSelectOptionsModalOpen(true);
        setSelectOptionsType("high_level_responsibility");
      },
      style: "block-button",
    },
    {
      key: "extract-day-to-day-tasks",
      title: t("extract_day_to_day_tasks"),
      handler: async () => {
        setSelectOptionsModalOpen(true);
        setSelectOptionsType("day_to_day_tasks");
      },
      style: "block-button",
    },
    {
      key: "extract-icp",
      title: t("extract_icp"),
      handler: async () => {
        setSelectOptionsModalOpen(true);
        setSelectOptionsType("icp");
      },
      style: "block-button",
    },
    {
      key: "success-metric",
      title: t("extract_success_metric"),
      handler: async () => {
        setSelectOptionsModalOpen(true);
        setSelectOptionsType("success-metric");
      },
      style: "block-button",
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
      ...(onNextTask
        ? { autoTrigger: true, handler: () => onNextTask?.() }
        : { handler: () => viewDoc?.("job-requirement") }),
    },
    {
      key: "intake-done",
      title: t("view_jrd"),
      ...(onNextTask
        ? { autoTrigger: true, handler: () => onNextTask?.() }
        : { handler: () => viewDoc?.("job-requirement") }),
    },
    {
      key: "jd-done",
      title: t("view_jd"),
      handler: () => viewDoc?.("job-description"),
    },
    {
      key: "compensation-details-done",
      title: t("view_compensation_details"),
      handler: () => viewDoc?.("job-compensation-details"),
    },
    {
      key: "outreach-done",
      title: t("view_outreach_message"),
      handler: () => viewDoc?.("job-outreach-message"),
    },
    {
      key: "interview-plan-done",
      title: t("view_interview_plan"),
      handler: () => viewDoc?.("job-interview-plan"),
    },
    {
      key: "copy-link",
      title: t("copy_link"),
      handler: async (tag) => {
        if (tag) {
          await copy(
            `${
              window.origin
            }/app/jobs/${jobId}/board?token=${localStorage.getItem(
              "token"
            )}&share=1`
          );
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
      handler: () => changeChatType("job-description"),
    },
    {
      key: "to-interview-plan-btn",
      title: t("define_interview_plan"),
      handler: () => changeChatType("job-interview-plan"),
    },

    {
      key: "interview-feedback-confirm-btn",
      title: t("confirm"),
      handler: () => {
        sendMessage(t("confirm"));
      },
      style: "button-with-text",
    },
  ];

  const fetchJob = async () => {
    const { code, data } = await Get(formatUrl(`/api/jobs/${jobId}`));

    if (code === 0) {
      const job: IJob = data.job ?? data;
      setJob(job);
    } else {
      message.error(t("get_job_failed"));
    }
  };

  const updateJob = async (job: { jd_language?: IJob["jd_language"] }) => {
    const { code } = await Post(formatUrl(`/api/jobs/${jobId}`), job);
    return code === 0;
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
          autoTriggerTag?.handler?.(extraTag);
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

    messages.forEach((item, index) => {
      // 过滤对该角色隐藏的消息
      if ((item.content.metadata.hide_for_roles ?? []).length && share) return;

      if (
        item.content.content ||
        item.content.metadata.message_sub_type === "error"
      ) {
        const extraTags = item.content.metadata.extra_tags || [];
        // 确认按钮
        if (
          chatType === "jobInterviewFeedback" &&
          index === messages.length - 1 &&
          item.content.role === "assistant" &&
          !messages.find(
            (item) =>
              !!item.content.metadata.extra_tags?.find(
                (item) => item.name === "current-round-evaluation"
              )
          )
        ) {
          extraTags.push({
            name: "interview-feedback-confirm-btn",
            content: "",
          });
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

        if (mode === "utils") {
          // 下一步 按钮
          (item.content.metadata.extra_tags ?? []).forEach((tag) => {
            (
              [
                "jd-done",
                "interview-plan-done",
                "jrd-done",
                "intake-done",
              ] as TDoneTag[]
            ).forEach((step) => {
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
        }
      }
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
      message.error(t("send_role_overview_failed"));
    }
  };

  const sendMessage = async (
    rawMessage: string,
    options?: {
      voice_payload_id?: number;
      metadata?: {
        before_text?: string;
        after_text?: string;
      };
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

    const { voice_payload_id, metadata } = options ?? {};
    const { code } = await Post(apiMapping[chatType as TChatType].send, {
      content: formattedMessage,
      voice_payload_id: voice_payload_id,
      metadata: metadata,
    });

    // 仅限额时报错。其它情况，不用报错。轮询会保证最终结果一致
    if (code === 10011) {
      setIsLoading(false);
      setMessages(messages);
      message.error(t("quota_exhausted"));
    }
  };

  const retryMessage = async (retryMessageId: number) => {
    if (isLoading) return;

    setIsLoading(true);

    needScrollToBottom.current = true;

    setMessages([
      ...messages.slice(0, messages.length - 1),
      {
        id: "fake_ai_id",
        role: "ai",
        content: "",
        updated_at: dayjs().format(datetimeFormat),
      },
    ]);

    const { code } = await Post(apiMapping[chatType as TChatType].send, {
      retry_message_id: retryMessageId,
    });

    if (code === 10011) {
      setIsLoading(false);
      setMessages(messages);
      message.error(t("quota_exhausted"));
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
    const url =
      chatType === "jobInterviewDesign"
        ? `/api/jobs/${jobId}/interview_designers/${jobInterviewDesignerId}/clear_messages`
        : chatType === "jobInterviewFeedback"
        ? `/api/jobs/${jobId}/interview_feedbacks/${jobInterviewFeedbackId}/clear_messages`
        : `/api/jobs/${jobId}/messages`;

    const { code } = await Post(url, {
      message_id: messageId,
    });

    if (code === 0) {
      message.success(t("delete_message_success"));
      fetchMessages();
    } else {
      message.error(t("delete_message_failed"));
    }
  };

  const maxIdOfAIMessage = [...messages]
    .reverse()
    .find((item) => item.role === "ai" && item.id !== "fake_ai_id")?.id;

  const genPredefinedButton = () => {
    return (
      <div
        style={{ gap: 5, display: "flex", overflow: "auto", paddingBottom: 16 }}
      >
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
              variant="filled"
              color="default"
              key={text}
              onClick={() => sendMessage(text)}
            >
              <span style={{ color: "#999" }}>→</span> {text}
            </Button>
          );
        })}
      </div>
    );
  };

  const genRecordButton = () => {
    return (
      <Popover
        content={
          <div>
            <div className={styles.hintHeader}>
              <div className={styles.hintTitle}>
                {t("voice_input_hint_title")}
              </div>
              <CloseOutlined
                onClick={() => setAudioHintVisible(false)}
                style={{ cursor: "pointer" }}
              />
            </div>
            <div>{t("voice_input_hint_content")}</div>
            <ul className={styles.hintList}>
              <li>{t("voice_input_hint_method1")}</li>
              <li>{t("voice_input_hint_method2")}</li>
            </ul>
          </div>
        }
        placement="top"
        open={audioHintVisible}
      >
        <div className={styles.buttonContainer}>
          {!isRecording && !isTranscribing ? (
            <Button
              style={{
                width: 48,
                height: 48,
                border: "4px solid gray",
                color: "gray",
                backgroundColor: "#f1f1f1",
              }}
              shape="circle"
              variant="outlined"
              color="default"
              onClick={() => startTranscription()}
              icon={<AudioOutlined style={{ fontSize: 24 }} />}
              iconPosition="start"
            />
          ) : (
            <Button
              style={{
                width: 48,
                height: 48,
                border: "4px solid #3682fe",
                backgroundColor: "#f1f1f1",
              }}
              shape="circle"
              type="primary"
              disabled={isTranscribing || !isStartRecordingOutside}
              onClick={() => endTranscription()}
              icon={<XFilled style={{ fontSize: 16, color: "#3682fe" }} />}
              iconPosition="start"
            />
          )}
          <div className={styles.buttonHint}>
            {!isRecording && !isTranscribing
              ? t("voice_input")
              : t("stop_voice_input")}
          </div>
        </div>
      </Popover>
    );
  };

  return (
    <div className={styles.container}>
      {chatType === "jobRequirementDoc" && <JrdSteps current={jrdProgress} />}
      <div className={styles.chatArea}>
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
                        style={{
                          border: "none",
                          background: "none",
                          width: 40,
                          height: 40,
                        }}
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
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: 18 }}>
                          {item.role === "user"
                            ? t("you")
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
                                ? t("error_message")
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
                            <>
                              <div className={styles.inlineButtonWrapper}>
                                {visibleTags
                                  .filter(
                                    (tag) =>
                                      !tag.style ||
                                      tag.style === "inline-button"
                                  )
                                  .map((tag) => {
                                    const genButtonElement = (tag: {
                                      title?: string;
                                      key?: string;
                                      handler?: (tag?: TExtraTag) => void;
                                    }) => {
                                      return (
                                        <div
                                          style={{ marginBottom: 16 }}
                                          key={tag.key ?? tag.title}
                                        >
                                          <Button
                                            variant="filled"
                                            color="default"
                                            className={styles.inlineButton}
                                            onClick={() => {
                                              const extraTag = (
                                                item.extraTags ?? []
                                              ).find(
                                                (extraTag) =>
                                                  extraTag.name === tag.key
                                              );
                                              tag.handler?.(extraTag);
                                            }}
                                          >
                                            {tag.title}
                                          </Button>
                                        </div>
                                      );
                                    };

                                    return tag.children
                                      ? tag.children.map((tag) =>
                                          genButtonElement(tag)
                                        )
                                      : genButtonElement(tag);
                                  })}
                              </div>
                              {visibleTags
                                .filter((tag) => tag.style === "block-button")
                                .map((tag) => (
                                  <div style={{ width: "100%" }} key={tag.key}>
                                    {tag.key === "upload-jd" ? (
                                      <Upload.Dragger
                                        beforeUpload={() => false}
                                        onChange={async (fileInfo) => {
                                          const formData = new FormData();
                                          formData.append(
                                            "file",
                                            fileInfo.file as any
                                          );
                                          setIsUploadingJd(true);
                                          const { code, data } =
                                            await PostFormData(
                                              `/api/jobs/${jobId}/upload_resume_for_interview_design`,
                                              formData
                                            );
                                          if (code === 0) {
                                            sendMessage(data.resume);
                                          } else {
                                            message.error(t("upload_failed"));
                                          }
                                          setIsUploadingJd(false);
                                        }}
                                        showUploadList={false}
                                        accept=".doc,.docx,.pdf"
                                        multiple={false}
                                        style={{
                                          background: "rgb(239, 249, 239)",
                                          color: "#3682fe",
                                          marginBottom: 16,
                                        }}
                                      >
                                        {isUploadingJd ? (
                                          <>
                                            <LoadingOutlined
                                              style={{ fontSize: 16 }}
                                            />
                                            <div className={styles.buttonHint}>
                                              {originalT("uploading")}
                                            </div>
                                          </>
                                        ) : (
                                          tag.title
                                        )}
                                      </Upload.Dragger>
                                    ) : (
                                      <Button
                                        type="dashed"
                                        style={{
                                          width: "100%",
                                          height: 56,
                                          marginBottom: 16,
                                          background: "rgb(239, 249, 239)",
                                          color: "#3682fe",
                                        }}
                                        onClick={() => {
                                          const extraTag = (
                                            item.extraTags ?? []
                                          ).find(
                                            (extraTag) =>
                                              extraTag.name === tag.key
                                          );
                                          tag.handler?.(extraTag);
                                        }}
                                      >
                                        {tag.title}
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              {visibleTags
                                .filter(
                                  (tag) => tag.style === "button-with-text"
                                )
                                .map((tag) => (
                                  <div
                                    key={tag.key}
                                    className={styles.tagButtonWithText}
                                  >
                                    <div>
                                      {t("interview_feedback_confirm_text")}
                                    </div>
                                    <Button
                                      variant="outlined"
                                      color="primary"
                                      style={{ marginTop: 8 }}
                                      onClick={() => {
                                        const extraTag = (
                                          item.extraTags ?? []
                                        ).find(
                                          (extraTag) =>
                                            extraTag.name === tag.key
                                        );
                                        tag.handler?.(extraTag);
                                      }}
                                    >
                                      {tag.title}
                                    </Button>
                                  </div>
                                ))}
                            </>
                          );
                        })()}

                        {(() => {
                          const canEditing = canMessageEdit(item);

                          const canDelete =
                            !!profile?.is_admin &&
                            item.messageType === "normal" &&
                            !["fake_ai_id", "fake_user_id"].includes(item.id);
                          // 操作区. 普通类型消息 && 大模型生成 && 不是 mock 消息 && 非编辑状态

                          const canRetry =
                            isLast && item.messageSubType === "error";

                          return canEditing || canDelete || canRetry ? (
                            <div className={styles.operationArea}>
                              {canEditing && (
                                <>
                                  <Tooltip title={originalT("edit")}>
                                    <EditOutlined
                                      onClick={() => {
                                        setMarkdownEditMessageId(item.id);
                                        setMarkdownEditMessageContent(
                                          item.content
                                        );
                                      }}
                                      ref={(e) => {
                                        if (maxIdOfAIMessage === item.id)
                                          editMessageTourElementRef.current = e;
                                      }}
                                    />
                                  </Tooltip>
                                  <Tooltip title={originalT("copy")}>
                                    <CopyOutlined
                                      onClick={async () => {
                                        await copy(item.content);
                                        message.success(originalT("copied"));
                                      }}
                                    />
                                  </Tooltip>
                                </>
                              )}
                              {canDelete && (
                                <Tooltip title={originalT("delete")}>
                                  <DeleteOutlined
                                    onClick={() => {
                                      if (
                                        confirm(t("confirm_delete_messages"))
                                      ) {
                                        deleteMessage(parseInt(item.id));
                                      }
                                    }}
                                  />
                                </Tooltip>
                              )}
                              {canRetry && (
                                <Tooltip title={originalT("retry")}>
                                  <ReloadOutlined
                                    onClick={async () => {
                                      if (confirm(t("confirm_retry_message"))) {
                                        retryMessage(parseInt(item.id));
                                      }
                                    }}
                                  />
                                </Tooltip>
                              )}
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
          <div className={classnames("flex-center")}>
            {genPredefinedButton()}
          </div>
          <div
            className={classnames("flex-center", "gap-12")}
            style={{ marginTop: 12 }}
          >
            {genRecordButton()}
            <Input.TextArea
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
              placeholder={textInputVisible ? inputPlaceholder : ""}
              style={
                textInputVisible
                  ? {
                      width: 600,
                      marginRight: "8px",
                      resize: "none",
                      overflow: "hidden",
                    }
                  : {
                      width: 0,
                      height: 0,
                      padding: 0,
                      border: "none",
                    }
              }
              onCompositionStartCapture={() =>
                (isCompositingRef.current = true)
              }
              onCompositionEndCapture={() => (isCompositingRef.current = false)}
              onPressEnter={(e) => {
                if (!e.shiftKey && !isCompositingRef.current && canSubmit()) {
                  e.preventDefault();
                  submit();
                }
              }}
              autoSize={{
                minRows: 2,
                maxRows: 16,
              }}
            />
            {textInputVisible && (
              <SendOutlined
                onClick={() => submit()}
                style={{ fontSize: 24, color: "#3682fe" }}
              />
            )}
            <div className={styles.buttonContainer} style={{ marginLeft: 12 }}>
              <Button
                style={{
                  width: 48,
                  height: 48,
                  border: "4px solid gray",
                  color: "gray",
                  backgroundColor: "#f1f1f1",
                }}
                shape="circle"
                variant="outlined"
                color="primary"
                iconPosition="start"
                icon={<EditOutlined style={{ fontSize: 24 }} />}
                onClick={() => {
                  if (textInputVisible) {
                    setTextInputVisible(false);
                    setInputPlaceholder("");
                  } else {
                    setTextInputVisible(true);
                    setTimeout(() => {
                      setInputPlaceholder(t("reply_viona_directly_or_edit"));
                    }, 400);
                  }
                }}
              />
              <div className={styles.buttonHint}>{t("text_edit")}</div>
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
          userRole="staff"
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
            {
              high_level_responsibility: t("extract_high_level_responsibility"),
              day_to_day_tasks: t("extract_day_to_day_tasks"),
              icp: t("extract_icp"),
              "success-metric": t("extract_success_metric"),
            }[selectOptionsType ?? "icp"]
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
                  metadata: {
                    before_text: `#### ${t("edit_message_hint")}\n\n`,
                  },
                });
              }}
            >
              {originalT("submit")}
            </Button>,
          ]}
        >
          <>
            <div style={{ color: "#3682fe", marginBottom: 12, fontSize: 16 }}>
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
              backgroundColor: "rgba(0,0,0,0.6)",
              width: 100,
              height: 100,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ScaleLoader
              color="#3682fe"
              height={75 * Math.min(1, volume * 3) + 5}
              width={10}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default observer(ChatRoomNew);
