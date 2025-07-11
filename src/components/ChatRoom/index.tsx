import React, { useState, useRef, useEffect, useReducer } from "react";

import {
  Avatar,
  List,
  Input,
  Button,
  message,
  Tour,
  TourStepProps,
  Spin,
  Modal,
  Drawer,
  FloatButton,
  Badge,
  Steps,
  Upload,
} from "antd";
import {
  ArrowRightOutlined,
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  EditOutlined,
} from "@ant-design/icons";
import classnames from "classnames";
import dayjs, { Dayjs } from "dayjs";
import { ClipLoader, ScaleLoader } from "react-spinners";
import "@mdxeditor/editor/style.css";

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
  TDoneTag,
  TExtraTag,
  TExtraTagName,
  TMessage,
  TMessageFromApi,
  TRoleOverviewType,
  TScreeningQuestionType,
} from "./type";
import { copy, parseJSON } from "../../utils";
import IdealProfileForm from "./components/IdealProflieForm";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import MarkdownContainer from "../MarkdownContainer";
import ScreeningQuestionDrawer from "./components/ScreeningQuestionDrawer";
import ChatbotConfigForm, {
  TChatbotOptions,
} from "./components/ChatbotConfigForm";
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

const RESOURCE_TYPE_MAP: Record<string, TChatType> = {
  JOB_REQUIREMENT: "jobRequirementDoc",
  JOB_DESCRIPTION: "jobDescription",
  JOB_TARGET_COMPANIES: "jobTargetCompanies",
  JOB_COMPENSATION_DETAILS: "jobCompensationDetails",
  JOB_SCREENING_QUESTION: "jobScreeningQuestion",
  JOB_INTERVIEW_PLAN: "jobInterviewPlan",
  JOB_OUTREACH_MESSAGE: "jobOutreachMessage",
  JOB_SOCIAL_MEDIA: "jobSocialMedia",
  JOB_FAQ: "jobFaq",
  JOB_TALENT_EVALUATE: "talentEvaluateResult",
  JOB_INTERVIEW_DESIGN: "jobInterviewDesign",
  JOB_INTERVIEW_FEEDBACK: "jobInterviewFeedback",
  CANDIDATE_CHAT: "candidate",
};

const visibleTasksForCoworker = [
  "jobRequirementDoc",
  "jobDescription",
  "jobCompensationDetails",
  "jobInterviewPlan",
];

const CHATTYPE_MAP: Record<TChatType, string> = Object.keys(
  RESOURCE_TYPE_MAP
).reduce((prev, current) => {
  prev[RESOURCE_TYPE_MAP[current]] = current;
  return prev;
}, {} as Record<TChatType, string>);

const ChatRoom: React.FC<IProps> = (props) => {
  const {
    jobId,
    sessionId,
    allowEditMessage = false,
    userRole = "staff",
    disableApply = false,
    onChangeTab,
    onNextTask,
    jobInterviewDesignerId,
    jobInterviewFeedbackId,
    hideSidebar = false,
  } = props;

  const [chatType, setChatType] = useState<TChatType>();
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] =
    useState<Record<string, number>>();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(".");
  const [taskCollapsed, setTaskCollapsed] = useState(false);
  const [jrdProgress, setJrdProgress] = useState<number>(0);

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
  const [screeningQuestionDrawerOpen, setScreeningQuestionDrawerOpen] =
    useState(false);
  const [screeningQuestion, setScreeningQuestion] = useState<{
    questions: TScreeningQuestionType[];
  }>();
  const [chatbotOptionsModalOpen, setChatbotOptionsModalOpen] = useState(false);

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
  const [needToFetchMessage, triggerFetchMessage] = useReducer(() => ({}), {});

  const { t: originalT, i18n } = useTranslation();
  const navigate = useNavigate();

  const { collapseForDrawer, setCollapseForDrawer } = globalStore;

  const { isRecording, volume, isTranscribing } = useAssemblyOffline({
    onFinish: (result) => {
      // console.log("handle result:", result);
      sendMessage(result);
    },
    disabled:
      isLoading ||
      showJobRequirementFormDrawer ||
      idealProfileDrawerOpen ||
      !!markdownEditMessageId,
  });

  const SurveyLink =
    i18n.language === "zh-CN"
      ? "https://ccn778871l8s.feishu.cn/share/base/form/shrcngf6iPqgTexsGeu7paeCjxf"
      : "https://igk8gb3qpgz.sg.larksuite.com/share/base/form/shrlgfakyAOv0sKElWPJMjC8yTh";

  useEffect(() => {
    if (userRole === "staff") {
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

    if (userRole === "candidate") {
      setChatType("candidate");
    } else if (!!jobInterviewDesignerId) {
      setChatType("jobInterviewDesign");
    } else if (!!jobInterviewFeedbackId) {
      setChatType("jobInterviewFeedback");
    } else {
      fetchJob({ init: true });
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
  }, [chatType, needToFetchMessage]);

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
    if (userRole === "coworker") {
      return url.replace("/api", "/api/coworker");
    }
    if (userRole === "trial_user") {
      return url.replace("/api", "/api/trial_user");
    }
    return url;
  };

  const apiMapping: Record<TChatTypeWithApi, { get: string; send: string }> = {
    jobRequirementDoc: {
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_REQUIREMENT/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_REQUIREMENT/send`),
    },
    jobDescription: {
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_DESCRIPTION/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_DESCRIPTION/send`),
    },
    jobTargetCompanies: {
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_TARGET_COMPANIES/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_TARGET_COMPANIES/send`),
    },
    jobCompensationDetails: {
      get: formatUrl(
        `/api/jobs/${jobId}/chat/JOB_COMPENSATION_DETAILS/messages`
      ),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_COMPENSATION_DETAILS/send`),
    },
    jobScreeningQuestion: {
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_SCREENING_QUESTION/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_SCREENING_QUESTION/send`),
    },
    jobInterviewPlan: {
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_INTERVIEW_PLAN/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_INTERVIEW_PLAN/send`),
    },
    jobOutreachMessage: {
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_OUTREACH_MESSAGE/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_OUTREACH_MESSAGE/send`),
    },
    jobSocialMedia: {
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_SOCIAL_MEDIA/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_SOCIAL_MEDIA/send`),
    },
    jobFaq: {
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_FAQ/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_FAQ/send`),
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
    talentEvaluateResult: {
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_TALENT_EVALUATE/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_TALENT_EVALUATE/send`),
    },
    candidate: {
      get: `/api/public/jobs/${jobId}/candidate_chat/${sessionId}`,
      send: `/api/public/jobs/${jobId}/candidate_chat/${sessionId}/send`,
    },
  };

  const PreDefinedMessages = [
    t("question_context"),
    t("question_company"),
    t("question_objectives"),
    t("question_team"),
    t("question_candidate"),
    t("question_interview"),
    t("question_compensation"),
    t("question_location"),
    t("question_hours"),
  ];

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

  const triggerScreeningQuestionDrawer = (open: boolean) => {
    setCollapseForDrawer(open);
    setScreeningQuestionDrawerOpen(open);
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
      key: "salary-structure-request",
      title: t("salary_structure"),
      handler: () => openJobRequirementFormDrawer("salary_structure"),
      autoTrigger: true,
    },
    {
      key: "jindu-four",
      title: t("ideal_profile"),
      handler: () => triggerIdealProfileDrawer(true),
      autoTrigger: true,
    },
    {
      key: "screening-q-request",
      title: t("screening_questions"),
      handler: (tag) => {
        triggerScreeningQuestionDrawer(true);
        setScreeningQuestion(parseJSON(tag?.content));
      },
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
      key: "talent-evaluate-result",
      title: t("view_talent"),
      handler: (tag) => {
        let talentId;
        try {
          talentId = JSON.parse(tag?.content ?? "")?.talent_id;
        } catch (e) {}
        if (talentId) {
          window.open(`/app/jobs/${jobId}/talents/${talentId}`);
        }
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
      key: "to-compensation-details-btn",
      title: t("define_compensation_details"),
      handler: () => setChatType("jobCompensationDetails"),
    },
    {
      key: "to-jd-btn",
      title: t("draft_job_description"),
      handler: () => setChatType("jobDescription"),
    },
    {
      key: "to-post-job-btn",
      title: t("post_job"),
      handler: () => setChatType("jobPost"),
    },
    {
      key: "to-target-companies-btn",
      title: t("define_target_companies"),
      handler: () => setChatType("jobTargetCompanies"),
    },
    {
      key: "to-screening-questions-btn",
      title: t("define_screening_questions"),
      handler: () => setChatType("jobScreeningQuestion"),
    },
    {
      key: "to-interview-plan-btn",
      title: t("define_interview_plan"),
      handler: () => setChatType("jobInterviewPlan"),
    },
    {
      key: "to-outreach-btn",
      title: t("define_outreach_message"),
      handler: () => setChatType("jobOutreachMessage"),
    },
    {
      key: "to-social-post-btn",
      title: t("define_social_post"),
      handler: () => setChatType("jobSocialMedia"),
    },
    {
      key: "to-faq-btn",
      title: t("define_faq"),
      handler: () => setChatType("jobFaq"),
    },
    {
      key: "to-chatbot-btn",
      title: t("create_chatbot"),
      handler: () => setChatType("chatbot"),
    },
    {
      key: "chatbot-config-btn",
      title: t("chatbot_config"),
      handler: () => setChatbotOptionsModalOpen(true),
    },
    {
      key: "post-job-btn",
      title: t("post_job_btn"),
      handler: async () => {
        const { code } = await Post(`/api/jobs/${jobId}/post_job`);
        if (code === 0) {
          await fetchJob();
          triggerFetchMessage();
        }
      },
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
  ];

  const fetchJob = async (options?: { init: boolean }) => {
    const { code, data } = await Get(formatUrl(`/api/jobs/${jobId}`));

    if (code === 0) {
      const job: IJob = data.job ?? data;
      setJob(job);
      setJobUrl(data.url);

      if (options?.init) {
        const defaultChatType = RESOURCE_TYPE_MAP[data.current_chat_type];
        setChatType(
          userRole === "staff" ||
            visibleTasksForCoworker.includes(defaultChatType)
            ? defaultChatType
            : "jobRequirementDoc"
        );
      }

      setUnreadMessageCount(data.unread_message_count);
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

    if (chatType === "jobPost") {
      const messages = [
        {
          id: "post-job-message-greeting-1",
          role: "ai",
          content: !!job?.posted_at
            ? `${t("post_job_greeting_1")}\n\n${t("post_job_done")}`
            : t("post_job_greeting_1"),
          updated_at: dayjs().format(datetimeFormat),
          messageType: "system",
          extraTags: !!job?.posted_at
            ? []
            : [
                {
                  name: "post-job-btn",
                  content: "",
                },
              ],
        },
        {
          id: "post-job-message-greeting-2",
          role: "ai",
          content: t("post_job_greeting_2"),
          updated_at: dayjs().format(datetimeFormat),
          messageType: "system",
        },
      ];
      if (job?.posted_at) {
        messages.push({
          id: "post-job-message-greeting-3",
          role: "ai",
          content: t("jrd_next_task"),
          updated_at: dayjs().format(datetimeFormat),
          messageType: "system",
          extraTags: getNextStepsExtraTags(job),
        });
      }
      setMessages(messages as TMessage[]);
    } else if (chatType === "chatbot") {
      const url = jobUrl ?? `${window.location.origin}/jobs/${jobId}/chat`;
      setMessages([
        {
          id: "chatbot-message-greeting-1",
          role: "ai",
          content: t("chatbot_greeting_1"),
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
        {
          id: "chatbot-message-greeting-2",
          role: "ai",
          content: t("chatbot_greeting_2"),
          updated_at: dayjs().format(datetimeFormat),
          messageType: "system",
          extraTags: [
            {
              name: "to-compensation-details-btn",
              content: "",
            },
            {
              name: "to-interview-plan-btn",
              content: "",
            },
            {
              name: "to-faq-btn",
              content: "",
            },
          ],
        },
        {
          id: "chatbot-message-greeting-3",
          role: "ai",
          content: t("chatbot_greeting_3"),
          updated_at: dayjs().format(datetimeFormat),
          messageType: "system",
          extraTags: [
            {
              name: "chatbot-config-btn",
              content: "",
            },
          ],
        },
      ]);
    } else {
      const { code, data } = await Get(
        apiMapping[chatType as TChatTypeWithApi].get
      );
      if (code === 0) {
        const job: IJob = data.job;
        if (userRole !== "candidate") {
          setJob(job);
          setUnreadMessageCount(data.unread_message_count);
        }

        const messageHistory = formatMessages(data.messages, job);
        const isLoading = data.is_invoking === 1;
        setIsLoading(isLoading);

        if (chatType === "jobRequirementDoc") {
          const tagPrograss = {
            "huoqujibenxinxi-jindu-one": 0,
            "jindu-two": 1,
            // "jindu-three": 2,
            "jindu-four": 2,
            shaixuanbiaozhun: 3,
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

        // 如果已完成 jrd，则跳转到调查问卷
        if (userRole !== "candidate" && userRole !== "trial_user") {
          if (!!job.requirement_doc_id && !job.jrd_survey_opened_at) {
            await Post(formatUrl(`/api/jobs/${job.id}/open_survey`));
          }
        }
      }
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
    if (!job || userRole === "coworker") return [];

    return [
      !job.compensation_details_doc_id && {
        name: `to-compensation-details-btn`,
        content: "",
      },
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
      if ((item.content.metadata.hide_for_roles ?? []).includes(userRole))
        return;

      if (
        item.content.content ||
        item.content.metadata.message_sub_type === "error"
      ) {
        resultMessages.push({
          id: item.id.toString(),
          role: item.content.role === "assistant" ? "ai" : "user",
          content: item.content.content,
          thinking: item.content.thinking ?? "",
          updated_at: item.updated_at,
          messageType: item.content.metadata.message_type || "normal",
          messageSubType: item.content.metadata.message_sub_type || "normal",
          extraTags: item.content.metadata.extra_tags || [],
        });
      }

      if (userRole !== "trial_user") {
        // 下一步 按钮
        (item.content.metadata.extra_tags ?? []).forEach((tag) => {
          (
            [
              "jrd-done",
              "jd-done",
              "targets-done",
              "compensation-details-done",
              "screening-q-done",
              "interview-plan-done",
              "outreach-done",
              "social-post-done",
              "faq-done",
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
    if (!chatType || isLoading) {
      console.log("stop:", chatType, isLoading);
      return;
    }

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

  const onSubmitChatbotOptions = async (options: TChatbotOptions) => {
    const { code } = await Post(`/api/jobs/${job?.id}/chatbot_options`, {
      allow_salary: options.allow_salary,
      others: options.others,
    });

    if (code === 0) {
      message.success(originalT("submit_succeed"));
      setChatbotOptionsModalOpen(false);
      fetchMessages();
    } else {
      message.error(originalT("submit_failed"));
    }
  };

  // const optionalTaskDisabled = !job?.posted_at;

  const maxIdOfAIMessage = [...messages]
    .reverse()
    .find((item) => item.role === "ai" && item.id !== "fake_ai_id")?.id;

  if (!chatType) {
    return <Spin spinning />;
  }

  return (
    <div className={styles.container}>
      {(userRole === "staff" || userRole === "coworker") && !hideSidebar && (
        <div
          className={styles.left}
          style={{
            display: collapseForDrawer ? "none" : "flex",
            width: taskCollapsed ? 30 : 200,
          }}
        >
          <div className={styles.leftTitle}>
            {taskCollapsed ? (
              <DoubleRightOutlined onClick={() => setTaskCollapsed(false)} />
            ) : (
              <>
                <span>{t("task")}</span>
                <DoubleLeftOutlined onClick={() => setTaskCollapsed(true)} />
              </>
            )}
          </div>
          <div className={styles.taskList}>
            {!taskCollapsed &&
              [
                {
                  title: t("define_job_requirement"),
                  disabled: false,
                  isFinished: !!job?.requirement_doc_id,
                  chatType: "jobRequirementDoc",
                },
                {
                  title: t("define_compensation_details"),
                  disabled: !job?.requirement_doc_id,
                  isFinished: !!job?.compensation_details_doc_id,
                  chatType: "jobCompensationDetails",
                },
                {
                  title: t("draft_job_description_btn"),
                  disabled: !job?.requirement_doc_id,
                  isFinished: !!job?.jd_doc_id,
                  chatType: "jobDescription",
                },
                {
                  title: t("define_interview_plan"),
                  disabled: !job?.requirement_doc_id,
                  isFinished: !!job?.interview_plan_doc_id,
                  chatType: "jobInterviewPlan",
                },
                {
                  title: t("evaluate_result"),
                  disabled: !job?.requirement_doc_id,
                  isFinished: false,
                  chatType: "talentEvaluateResult",
                },
                ...(profile?.is_admin
                  ? [
                      {
                        title: "设计面试",
                        isFinished: false,
                        chatType: "jobInterviewDesign",
                      },
                      {
                        title: "面试反馈",
                        isFinished: false,
                        chatType: "jobInterviewFeedback",
                      },
                    ]
                  : []),
              ]
                .filter(
                  (task) =>
                    visibleTasksForCoworker.includes(task.chatType) ||
                    userRole === "staff"
                )
                .sort(
                  (a, b) =>
                    (unreadMessageCount?.[
                      CHATTYPE_MAP[b.chatType as TChatType]
                    ] ?? 0) -
                    (unreadMessageCount?.[
                      CHATTYPE_MAP[a.chatType as TChatType]
                    ] ?? 0)
                )
                .map((task) => {
                  // const { color, text } =
                  //   {
                  //     required: {
                  //       color: "red",
                  //       text: t("essential"),
                  //     },
                  //     optional: {
                  //       color: "green",

                  //       text: t("optional_task"),
                  //     },
                  //     candidate: {
                  //       color: "blue",
                  //       text: t("candidate"),
                  //     },
                  //   }[task.type ?? ""] ?? {};

                  return (
                    <div
                      className={classnames(styles.taskBlock, {
                        [styles.finished]: task.isFinished,
                        [styles.active]: chatType === task.chatType,
                        [styles.disabled]: task.disabled,
                      })}
                      onClick={() => {
                        if (task.chatType === "jobInterviewDesign") {
                          navigate(`/app/jobs/${jobId}/interview-designers`);
                        } else if (task.chatType === "jobInterviewFeedback") {
                          navigate(`/app/jobs/${jobId}/interview-feedbacks`);
                        } else {
                          if (task.disabled || !task.chatType) return;
                          setChatType(task.chatType as TChatType);
                        }
                      }}
                      key={task.title}
                    >
                      <Badge
                        count={
                          unreadMessageCount?.[
                            CHATTYPE_MAP[task.chatType as TChatType]
                          ] ?? 0
                        }
                        size="small"
                      >
                        <div
                          style={{
                            paddingRight: 10,
                            color: task.disabled ? "#a1a1a1" : "",
                          }}
                        >
                          {task.title}
                        </div>
                      </Badge>
                      <div>
                        {task.isFinished ? (
                          <CheckOutlined />
                        ) : (
                          <ArrowRightOutlined />
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      )}
      <div
        className={styles.right}
        style={collapseForDrawer ? { width: "40vw", flex: "none" } : {}}
      >
        {chatType === "jobRequirementDoc" && (
          <div className={styles.progressWrapper}>
            <Steps
              progressDot
              direction="horizontal"
              size="small"
              current={jrdProgress}
              items={[
                { title: t("gather_basic_information") },
                { title: t("confirm_key_role_parameters") },
                { title: t("define_ideal_candidate_profile") },
                { title: t("define_screening_criteria") },
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
                                    style={{ marginBottom: 16 }}
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

        {userRole === "candidate" && (
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
                </div>
              );
            })}
          </div>
        )}

        {!["talentEvaluateResult", "chatbot"].includes(chatType) && (
          <div className={styles.inputArea}>
            {userRole !== "candidate" && (
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
            )}
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
                justifyContent: "space-between",
              }}
            >
              <div></div>
              <div style={{ display: "flex", gap: 10 }}>
                {chatType === "candidate" && !disableApply && (
                  <Button
                    type="primary"
                    onClick={async () => {
                      const { code } = await Post(
                        "/api/candidate/job_applies",
                        {
                          job_id: jobId,
                        }
                      );
                      if (code === 10001) {
                        navigate(`/signup-candidate?job_id=${jobId}`);
                      } else {
                        navigate(`/candidate/job-applies`);
                      }
                    }}
                  >
                    {t("apply_now")}
                  </Button>
                )}

                <Button type="primary" onClick={submit} disabled={!canSubmit()}>
                  {originalT("submit")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {userRole !== "candidate" && (
          <>
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
              userRole={userRole}
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
                  onOk={(requirements) => {
                    // 发送
                    let message = "";
                    requirements.forEach((requirement) => {
                      message += `\n\n*   **${
                        requirement.content
                      } - ${originalT(`ideal_profile.${requirement.type}`)}**`;
                    });

                    sendMessage(message, {
                      before_text: t("edit_profiles_hint"),
                    });
                    triggerIdealProfileDrawer(false);
                  }}
                />
              )}
            </Drawer>

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

            <ScreeningQuestionDrawer
              screeningQuestionDrawerOpen={screeningQuestionDrawerOpen}
              questions={screeningQuestion?.questions ?? []}
              onClose={() => triggerScreeningQuestionDrawer(false)}
              onOk={async (questions: TScreeningQuestionType[]) => {
                // 发送
                let llmMessage = "";
                questions.forEach((question, index) => {
                  llmMessage += `\n\n${index + 1}. ${question.question} - ${t(
                    question.required ? "required" : "optional"
                  )}`;
                });

                sendMessage(llmMessage, {
                  before_text: t("edit_screening_question_hint"),
                });
                triggerScreeningQuestionDrawer(false);
              }}
            />

            {job && (
              <ChatbotConfigForm
                job={job}
                open={chatbotOptionsModalOpen}
                onClose={() => setChatbotOptionsModalOpen(false)}
                onOk={(options) => onSubmitChatbotOptions(options)}
              />
            )}
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

export default observer(ChatRoom);
