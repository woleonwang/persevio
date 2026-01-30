import React, { useState, useRef, useEffect } from "react";

import {
  Button,
  message,
  Modal,
  FloatButton,
  Upload,
  Tooltip,
  Drawer,
} from "antd";
import { LoadingOutlined, ReloadOutlined } from "@ant-design/icons";
import classnames from "classnames";
import dayjs, { Dayjs } from "dayjs";

import { Get, Post, PostFormData } from "../../utils/request";

import styles from "./style.module.less";
import { IProps, TChatType, TRoleOverviewType } from "./type";
import { copy, downloadText, getDocumentType, parseJSON } from "@/utils";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { tokenStorage } from "@/utils/storage";

import SelectOptionsForm from "./components/SelectOptionsForm";
import JobRequirementFormDrawer from "./components/JobRequirementFormDrawer";
import globalStore from "@/store/global";
import JrdSteps from "./components/JrdSteps";
import JobRequirementForm from "./components/JobRequirementForm";
import EditableMarkdown from "../EditableMarkdown";
import Icon from "../Icon";
import Switch from "@/assets/icons/switch";
import Bag from "@/assets/icons/bag";
import Copy from "@/assets/icons/copy";
import Pen from "@/assets/icons/pen";
import Delete from "@/assets/icons/delete";
import Download from "@/assets/icons/download";
import Close from "@/assets/icons/close";
import ChatInputArea from "../ChatInputArea";
import ChatMessageList from "../ChatMessageList";
import { SIDE_DOCUMENT_TYPES } from "@/utils/consts";
import JobCollaboratorModal from "../JobCollaboratorModal";
import MarkdownContainer from "../MarkdownContainer";
import JrdRealRequirementForm from "./components/JrdRealRequirementForm";
import JrdTargetCandidateProfileForm from "./components/JrdTargetCandidateProfileForm";

const datetimeFormat = "YYYY/MM/DD HH:mm:ss";

const StaffChat: React.FC<IProps> = (props) => {
  const {
    chatType,
    jobId,
    share = false,
    jobInterviewDesignerId,
    jobInterviewFeedbackId,
    viewDoc,
    onNextTask,
    newVersion = false,
  } = props;

  const [messages, setMessages] = useState<TMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [waitingType, setWaitingType] = useState<"generate_jrd_strategy" | "">(
    ""
  );
  const [jrdProgress, setJrdProgress] = useState<number>(0);

  // job 仅用来判断进度。当 role 为 candidate 时不需要 job
  const [job, setJob] = useState<IJob>();
  const [profile, setProfile] = useState<ISettings>();

  // 表单抽屉
  const [showJobRequirementFormDrawer, setShowJobRequirementFormDrawer] =
    useState(false);
  const [jobRequirementFormType, setJobRequirementFormType] =
    useState<TRoleOverviewType>();
  const [jrdRealRequirementFormValue, setJrdRealRequirementFormValue] =
    useState<string>();
  const [showJrdRealRequirementForm, setShowJrdRealRequirementForm] =
    useState(false);
  const [
    jrdTargetCandidateProfileFormValue,
    setJrdTargetCandidateProfileFormValue,
  ] = useState<string>();
  const [
    showJrdTargetCandidateProfileForm,
    setShowJrdTargetCandidateProfileForm,
  ] = useState(false);

  const [selectOptionsType, setSelectOptionsType] = useState<
    "high_level_responsibility" | "day_to_day_tasks" | "icp" | "success-metric"
  >();
  const [selectOptionsModalOpen, setSelectOptionsModalOpen] = useState(false);
  const [isUploadingJd, setIsUploadingJd] = useState(false);
  const [sideDocumentVisible, setSideDocumentVisible] = useState(false);
  const [sideDocumentType, setSideDocumentType] =
    useState<TEditableDocumentType>();

  const [sideDocumentContent, setSideDocumentContent] = useState<string>("");
  const [isEditingSideDocument, setIsEditingSideDocument] = useState(false);

  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
  const [isStrategyDrawerOpen, setIsStrategyDrawerOpen] = useState(false);

  // 最后一条消息的 id，用于控制新增消息的自动弹出
  const lastMessageIdRef = useRef<string>();
  const needScrollToBottom = useRef(false);
  const loadingStartedAtRef = useRef<Dayjs>();
  const jrdContextDocumentJsonRef = useRef();
  jrdContextDocumentJsonRef.current = parseJSON(job?.jrd_context_document_json);
  const childrenFunctionsRef = useRef<{
    scrollToBottom?: () => void;
    scrollToMessage?: (messageId: string) => void;
  }>({});
  const sideDocumentTriggerMessageIdRef = useRef<string>();
  const messageListScrollTopRef = useRef<number>(0);

  const { t: originalT, i18n } = useTranslation();
  const navigate = useNavigate();

  const { mode, isAdmin } = globalStore;

  const SurveyLink =
    i18n.language === "zh-CN"
      ? "https://ccn778871l8s.feishu.cn/share/base/form/shrcngf6iPqgTexsGeu7paeCjxf"
      : "https://igk8gb3qpgz.sg.larksuite.com/share/base/form/shrlgfakyAOv0sKElWPJMjC8yTh";

  useEffect(() => {
    initProfile();
  }, []);

  useEffect(() => {
    initConversation();
  }, [jobId]);

  useEffect(() => {
    if (!showJrdRealRequirementForm && !showJrdTargetCandidateProfileForm) {
      const listNode = document.querySelector("." + styles.listArea);
      if (listNode && messageListScrollTopRef.current) {
        listNode.scrollTop = messageListScrollTopRef.current;
        messageListScrollTopRef.current = 0;
      }
    }
  }, [showJrdRealRequirementForm, showJrdTargetCandidateProfileForm]);

  useEffect(() => {
    if (isLoading) {
      loadingStartedAtRef.current = dayjs();
      const intervalFetchMessage = setInterval(() => {
        fetchMessages();
      }, 3000);

      return () => {
        clearInterval(intervalFetchMessage);
      };
    } else {
      loadingStartedAtRef.current = undefined;
    }
  }, [isLoading]);

  useEffect(() => {
    if (messages.length === 0) return;

    if (messages.length > 2 && needScrollToBottom.current) {
      childrenFunctionsRef.current.scrollToBottom?.();
      needScrollToBottom.current = false;
    }
  }, [messages]);

  useEffect(() => {
    if (jrdContextDocumentJsonRef.current) {
      setSideDocumentContent(
        jrdContextDocumentJsonRef.current[sideDocumentType ?? ""] ?? ""
      );
    }
  }, [job]);

  // 当 sideDocument 打开时，滚动到触发打开的消息
  useEffect(() => {
    if (sideDocumentVisible && sideDocumentTriggerMessageIdRef.current) {
      // 延迟执行，确保布局已经更新
      setTimeout(() => {
        childrenFunctionsRef.current.scrollToMessage?.(
          sideDocumentTriggerMessageIdRef.current!
        );
      }, 100);
    }
  }, [sideDocumentVisible]);

  const t = (key: string) => {
    return originalT(`chat.${key}`);
  };

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
          key: "jrd-language-zh-CN",
          title: (
            <div className={styles.languageButton}>
              <Icon icon={<Switch />} style={{ fontSize: 24 }} /> 中文
            </div>
          ),
          handler: () =>
            sendMessage(
              "好的，我们可以开始对话。请你用中文和我进行接下来的对话。"
            ),
        },
        {
          key: "jrd-language-en-US",
          title: (
            <div className={styles.languageButton}>
              <Icon icon={<Switch />} style={{ fontSize: 24 }} /> English
            </div>
          ),
          handler: () =>
            sendMessage("Yes, we can start. Please speak with me in English."),
        },
      ],
    },
    {
      key: "jd-language",
      children: [
        {
          key: "jd-language-zh-CN",
          title: (
            <div className={styles.languageButton}>
              <Icon icon={<Switch />} style={{ fontSize: 24 }} /> 中文
            </div>
          ),
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
          key: "jd-language-en-US",
          title: (
            <div className={styles.languageButton}>
              <Icon icon={<Switch />} style={{ fontSize: 24 }} /> English
            </div>
          ),
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
      title: (
        <div className={styles.bagButton}>
          <Icon icon={<Bag />} style={{ fontSize: 24 }} />
          {t("share_reference")}
        </div>
      ),
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
      ...(onNextTask
        ? { autoTrigger: true, handler: () => onNextTask?.() }
        : { handler: () => viewDoc?.("job-description") }),
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
          if (newVersion) {
            setIsCollaboratorModalOpen(true);
          } else {
            await copy(
              `${window.origin}/app/jobs/${jobId}/board?token=${
                tokenStorage.getToken("staff") || ""
              }&share=1`
            );
            message.success(t("copied"));
          }
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

    {
      key: "real-requirement-form",
      title: "Edit Real Requirement",
      handler: (tag) => {
        setJrdRealRequirementFormValue(tag?.content);
        setShowJrdRealRequirementForm(true);
        messageListScrollTopRef.current =
          document.querySelector("." + styles.listArea)?.scrollTop ?? 0;
      },
    },

    {
      key: "target-candidate-profile-form",
      title: "Edit Target Candidate Profile",
      handler: (tag) => {
        setJrdTargetCandidateProfileFormValue(tag?.content);
        setShowJrdTargetCandidateProfileForm(true);
        messageListScrollTopRef.current =
          document.querySelector("." + styles.listArea)?.scrollTop ?? 0;
      },
    },

    ...(SIDE_DOCUMENT_TYPES as TExtraTagName[]).map((key) => {
      return {
        key: key,
        title: t("view_document"),
        handler: () => {
          setTimeout(() => {
            const documentType = getDocumentType(key);
            setSideDocumentVisible(true);
            setSideDocumentContent(
              jrdContextDocumentJsonRef.current?.[documentType] ?? ""
            );
            setSideDocumentType(documentType as TEditableDocumentType);
          });
        },
        autoTrigger: true,
      };
    }),
  ];

  const initConversation = async () => {
    needScrollToBottom.current = true;
    setSideDocumentVisible(false);
    setIsEditingSideDocument(false);
    await fetchJob();
    await fetchMessages();
  };

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
      setWaitingType(data.waiting_type);
      setIsLoading(isLoading);

      if (chatType === "jobRequirementDoc") {
        const tagPrograss = {
          "cddreq-done": 1,
          "sourcing-done": 2,
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
          // 如果没有打开文档的按钮，则关闭文档
          if (
            lastMessage.role === "ai" &&
            !SIDE_DOCUMENT_TYPES.find((type) =>
              (lastMessage.extraTags ?? []).find((tag) => tag.name === type)
            )
          ) {
            setSideDocumentVisible(false);
          }
          // 如果最后一条消息需要弹表单或者抽屉，则直接打开
          let extraTag;
          const autoTriggerTag = supportTags.find((supportTag) => {
            extraTag = (lastMessage.extraTags ?? []).find(
              (tag) => supportTag.key === tag.name && supportTag.autoTrigger
            );
            return !!extraTag;
          });
          autoTriggerTag?.handler?.(extraTag);
          sideDocumentTriggerMessageIdRef.current = lastMessage.id;
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

  const updateJrdContextDocument = async (content: string) => {
    const { code } = await Post(
      formatUrl(`/api/jobs/${jobId}/jrd_context_document`),
      {
        field: sideDocumentType,
        content: content,
      }
    );
    if (code === 0) {
      message.success(originalT("submit_succeed"));
      setIsEditingSideDocument(false);
      fetchJob();
    }
  };

  const openSurvey = async () => {
    window.open(SurveyLink, "popup", "width=1000,height=800");
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

  const genPredefinedButton = () => {
    return (
      <div style={{ gap: 5, display: "flex", overflow: "auto" }}>
        {[t("yes"), t("no"), t("accurate"), t("proposal"), t("no_others")].map(
          (text) => {
            return (
              <Button
                variant="filled"
                color="default"
                key={text}
                onClick={() => sendMessage(text)}
                style={{ borderRadius: 12 }}
              >
                <span style={{ color: "#c1c1c1" }}>→</span> {text}
              </Button>
            );
          }
        )}
      </div>
    );
  };

  const basicFormVisible = mode === "standard" && showJobRequirementFormDrawer;
  const realRequirementFormVisible =
    mode === "standard" && showJrdRealRequirementForm;
  const targetCandidateProfileFormVisible =
    mode === "standard" && showJrdTargetCandidateProfileForm;

  return (
    <div className={styles.container}>
      <div
        className={classnames(styles.conversation, {
          [styles.collapsed]: sideDocumentVisible,
        })}
      >
        {chatType === "jobRequirementDoc" && (
          <JrdSteps current={jrdProgress} collapse={sideDocumentVisible} />
        )}

        <div className={styles.chatArea}>
          {basicFormVisible ? (
            <JobRequirementForm
              group={jobRequirementFormType}
              onOk={(result: string) => {
                if (!isLoading) {
                  sendJobRequirementForm(result);
                  handleJobRequirementFormDrawerOpen(false);
                }
              }}
              userRole="staff"
            />
          ) : realRequirementFormVisible ? (
            <JrdRealRequirementForm
              onSubmit={(result: string) => {
                if (!isLoading) {
                  sendMessage(result);
                  setShowJrdRealRequirementForm(false);
                }
              }}
              onBack={() => {
                setShowJrdRealRequirementForm(false);
              }}
              initialValue={jrdRealRequirementFormValue ?? ""}
            />
          ) : targetCandidateProfileFormVisible ? (
            <JrdTargetCandidateProfileForm
              initialValue={jrdTargetCandidateProfileFormValue ?? ""}
              onSubmit={(result: string) => {
                if (!isLoading) {
                  sendMessage(result);
                  setShowJrdTargetCandidateProfileForm(false);
                }
              }}
              onBack={() => {
                setShowJrdTargetCandidateProfileForm(false);
              }}
            />
          ) : (
            <>
              <ChatMessageList
                messages={messages}
                isLoading={isLoading}
                className={styles.listArea}
                childrenFunctionsRef={childrenFunctionsRef}
                showCustomThinkingText={() => {
                  return waitingType === "generate_jrd_strategy"
                    ? originalT("chat.viona_is_generating_jrd_strategy")
                    : "";
                }}
                renderTagsContent={(item) => {
                  const visibleTags = (item.extraTags ?? [])
                    .map((extraTag) => {
                      return supportTags.find(
                        (tag) => tag.key === extraTag.name
                      );
                    })
                    .filter(Boolean) as TSupportTag[];
                  const inlineButtons = visibleTags.filter(
                    (tag) => !tag.style || tag.style === "inline-button"
                  );

                  return (
                    <>
                      {inlineButtons.length > 0 && (
                        <div className={styles.inlineButtonWrapper}>
                          {inlineButtons.map((tag) => {
                            const genButtonElement = (tag: {
                              title?: React.ReactNode;
                              key?: string;
                              handler?: (tag?: TExtraTag) => void;
                            }) => {
                              return (
                                <div
                                  style={{ marginBottom: 16 }}
                                  key={tag.key ?? (tag.title as string)}
                                >
                                  <Button
                                    type="primary"
                                    className={styles.inlineButton}
                                    onClick={() => {
                                      if (
                                        SIDE_DOCUMENT_TYPES.includes(
                                          tag.key as any
                                        )
                                      ) {
                                        sideDocumentTriggerMessageIdRef.current =
                                          item.id;
                                      }
                                      const extraTag = (
                                        item.extraTags ?? []
                                      ).find(
                                        (extraTag) => extraTag.name === tag.key
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
                              ? tag.children.map((tag) => genButtonElement(tag))
                              : genButtonElement(tag);
                          })}
                        </div>
                      )}
                      {visibleTags
                        .filter((tag) => tag.style === "block-button")
                        .map((tag) => (
                          <div style={{ width: "100%" }} key={tag.key}>
                            {tag.key === "upload-jd" ? (
                              <Upload.Dragger
                                beforeUpload={() => false}
                                onChange={async (fileInfo) => {
                                  setIsUploadingJd(true);
                                  // 根据文件类型处理上传文件
                                  const fileExt = (fileInfo.file.name || "")
                                    .split(".")
                                    .pop()
                                    ?.toLowerCase();

                                  if (fileExt === "txt" || fileExt === "md") {
                                    // 直接读取文本内容
                                    const reader = new FileReader();
                                    reader.onload = function (event) {
                                      if (event.target?.result) {
                                        sendMessage(
                                          event.target.result as string
                                        );
                                      }
                                    };
                                    reader.readAsText(
                                      fileInfo.file as unknown as Blob,
                                      "UTF-8"
                                    );
                                  } else if (
                                    fileExt === "docx" ||
                                    fileExt === "pdf"
                                  ) {
                                    const formData = new FormData();
                                    formData.append(
                                      "file",
                                      fileInfo.file as any
                                    );

                                    const { code, data } = await PostFormData(
                                      `/api/jobs/${jobId}/upload_resume_for_interview_design`,
                                      formData
                                    );
                                    if (code === 0) {
                                      sendMessage(data.resume);
                                    } else {
                                      message.error(t("upload_failed"));
                                    }
                                  }

                                  setIsUploadingJd(false);
                                }}
                                showUploadList={false}
                                accept=".docx,.pdf,.txt,.md"
                                multiple={false}
                                className={styles.uploadJdButton}
                              >
                                {isUploadingJd ? (
                                  <>
                                    <LoadingOutlined style={{ fontSize: 16 }} />
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
                                  background: "#e5e9ec",
                                  color: "#3682fe",
                                }}
                                onClick={() => {
                                  const extraTag = (item.extraTags ?? []).find(
                                    (extraTag) => extraTag.name === tag.key
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
                        .filter((tag) => tag.style === "button-with-text")
                        .map((tag) => (
                          <div
                            key={tag.key}
                            className={styles.tagButtonWithText}
                          >
                            <div>{t("interview_feedback_confirm_text")}</div>
                            <Button
                              variant="outlined"
                              color="primary"
                              style={{ marginTop: 8 }}
                              onClick={() => {
                                const extraTag = (item.extraTags ?? []).find(
                                  (extraTag) => extraTag.name === tag.key
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
                }}
                renderOperationContent={(item, isLast) => {
                  const canDelete =
                    !!profile?.is_admin &&
                    item.role === "user" &&
                    item.messageType === "normal" &&
                    !["fake_ai_id", "fake_user_id"].includes(item.id);
                  // 操作区. 用户消息 &&普通类型消息 && 大模型生成 && 不是 mock 消息 && 非编辑状态

                  const canRetry = isLast && item.messageSubType === "error";

                  return canDelete || canRetry ? (
                    <div
                      className={classnames(
                        styles.operationArea,
                        styles[item.role]
                      )}
                    >
                      {canDelete && (
                        <Tooltip title={originalT("delete")}>
                          <div
                            onClick={() => {
                              if (confirm(t("confirm_delete_messages"))) {
                                deleteMessage(parseInt(item.id));
                              }
                            }}
                          >
                            <Icon icon={<Delete />} />
                          </div>
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
                }}
              />
              <div className={styles.footer}>
                <div className={classnames("flex-center")}>
                  {genPredefinedButton()}
                </div>
                <ChatInputArea
                  onSubmit={(value, options) => {
                    sendMessage(value, options);
                  }}
                  isLoading={isLoading}
                  disabledVoiceInput={
                    isLoading ||
                    showJobRequirementFormDrawer ||
                    selectOptionsModalOpen
                  }
                  isCollapsed={sideDocumentVisible}
                />
              </div>
            </>
          )}

          <FloatButton.Group>
            <FloatButton onClick={() => openSurvey()} type="primary" />
            {isAdmin && (
              <>
                <FloatButton
                  onClick={() => {
                    setIsStrategyDrawerOpen(true);
                  }}
                  type="primary"
                  description="查看策略"
                />

                <FloatButton
                  onClick={async () => {
                    if (confirm("确定要重置状态吗？")) {
                      const { code } = await Post(`/api/jobs/${jobId}`, {
                        is_jd_exsits: "",
                      });
                      if (code === 0) {
                        alert("状态重置成功. 请删除上传 jd 的消息并重新上传");
                      } else {
                        message.error("重置失败");
                      }
                    }
                  }}
                  type="primary"
                  description="重置状态"
                />
              </>
            )}
          </FloatButton.Group>

          {mode === "utils" && (
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
          )}

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
                high_level_responsibility: t(
                  "extract_high_level_responsibility"
                ),
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
        </div>
      </div>

      {sideDocumentVisible && (
        <div className={styles.sideDocument}>
          <div className={styles.sideDocumentHeader}>
            <div className={styles.sideDocumentTitle}>
              {t(sideDocumentType ?? "")}
            </div>
            <div className={styles.sideDocumentOperations}>
              <Tooltip title={originalT("edit")}>
                <Icon
                  icon={<Pen />}
                  onClick={() => setIsEditingSideDocument(true)}
                />
              </Tooltip>
              <Tooltip title={originalT("copy")}>
                <Icon
                  icon={<Copy />}
                  onClick={async () => {
                    await copy(sideDocumentContent);
                    message.success(originalT("copied"));
                  }}
                />
              </Tooltip>
              <Tooltip title={originalT("download")}>
                <Icon
                  icon={<Download />}
                  onClick={() =>
                    downloadText({
                      name: `${t(sideDocumentType ?? "")}.md`,
                      content: sideDocumentContent,
                    })
                  }
                />
              </Tooltip>
              <div className={styles.sideDocumentOperationSeparator} />
              <Icon
                icon={<Close />}
                onClick={() => setSideDocumentVisible(false)}
              />
            </div>
          </div>
          <EditableMarkdown
            className={styles.sideDocumentContent}
            isEditing={isEditingSideDocument}
            value={sideDocumentContent}
            onSubmit={(md) => updateJrdContextDocument(md)}
            onCancel={() => setIsEditingSideDocument(false)}
          />
        </div>
      )}

      <JobCollaboratorModal
        open={isCollaboratorModalOpen}
        onCancel={() => setIsCollaboratorModalOpen(false)}
        jobId={jobId}
      />

      <Drawer
        open={isStrategyDrawerOpen}
        onClose={() => setIsStrategyDrawerOpen(false)}
        title="职位需求对话策略"
        width={800}
      >
        <MarkdownContainer content={job?.job_requirement_strategy_doc || ""} />
      </Drawer>
    </div>
  );
};

export default observer(StaffChat);
