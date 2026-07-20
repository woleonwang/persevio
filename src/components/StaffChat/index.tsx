import React, { useState, useRef, useEffect } from "react";

import { Button, message, Tooltip } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import classnames from "classnames";
import dayjs, { Dayjs } from "dayjs";

import { Get, Post } from "../../utils/request";

import styles from "./style.module.less";
import { IProps, TChatType } from "./type";
import { copy, downloadText, getDocumentType, parseJSON } from "@/utils";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import globalStore from "@/store/global";
import EditableMarkdown from "../EditableMarkdown";
import Icon from "../Icon";
import Switch from "@/assets/icons/switch";
import Copy from "@/assets/icons/copy";
import Pen from "@/assets/icons/pen";
import Delete from "@/assets/icons/delete";
import Download from "@/assets/icons/download";
import Close from "@/assets/icons/close";
import ChatInputArea from "../ChatInputArea";
import ChatMessageList from "../ChatMessageList";
import { SIDE_DOCUMENT_TYPES } from "@/utils/consts";
import JdProgressCard from "./components/JdProgressCard";
import JrdRealRequirementForm from "./components/JrdRealRequirementForm";

import InviteCollaboratorsModal from "./components/InviteCollaboratorsModal";
import {
  MENTION_OWNER_ID,
  MENTION_VIONA_ID,
  TMentionOption,
  TMentionRoleKey,
  buildMentionDisplayContent,
  getActiveMemberships,
  getStaffEmail,
  isGroupChatMode,
  mentionsIncludeViona,
} from "./intakeCollabUtils";
import useStaffs from "@/hooks/useStaffs";

const datetimeFormat = "YYYY/MM/DD HH:mm:ss";

type TWaitingType = "generate_jrd_strategy" | "waiting_for_jd" | "";

const StaffChat: React.FC<IProps> = (props) => {
  const {
    chatType,
    jobId,
    share = false,
    talentId,
    jrdEditConversationId,
    viewDoc,
    onNextTask,
    hidePredefinedButtons = false,
    hideRetry = false,
    autoStart = false,
    onMembershipsChange,
    inviteCollaboratorsOpen,
    onInviteCollaboratorsOpenChange,
    membershipsRefreshSignal = 0,
    viewerMode = "staff",
    guestContext,
    onGuestAuthFailure,
  } = props;
  const isGuestViewer = viewerMode === "guest";

  const [messages, setMessages] = useState<TMessage[]>([]);
  const lastAiMessageForVoice = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "ai") return messages[i].content;
    }
    return undefined;
  })();
  const [isLoading, setIsLoading] = useState(false);
  const [waitingType, setWaitingType] = useState<TWaitingType>("");
  const [streamingLoadingText, setStreamingLoadingText] = useState("");
  const [showJdProgress, setShowJdProgress] = useState(false);
  const [jdProgressStatus, setJdProgressStatus] = useState(false);

  // job 仅用来判断进度。当 role 为 candidate 时不需要 job
  const [job, setJob] = useState<IJob>();
  const [profile, setProfile] = useState<ISettings>();
  const [conversationFinished, setConversationFinished] = useState(false);

  const [sideDocumentVisible, setSideDocumentVisible] = useState(false);
  const [sideDocumentType, setSideDocumentType] =
    useState<TEditableDocumentType>();

  const [sideDocumentContent, setSideDocumentContent] = useState<string>("");
  const [isEditingSideDocument, setIsEditingSideDocument] = useState(false);

  const [
    isInviteCollaboratorsOpenInternal,
    setIsInviteCollaboratorsOpenInternal,
  ] = useState(false);
  const isInviteCollaboratorsOpen =
    inviteCollaboratorsOpen ?? isInviteCollaboratorsOpenInternal;
  const setIsInviteCollaboratorsOpen =
    onInviteCollaboratorsOpenChange ?? setIsInviteCollaboratorsOpenInternal;
  const [memberships, setMemberships] = useState<TJobIntakeMembership[]>([]);
  const [collaborators, setCollaborators] = useState<TJobCollaborator[]>([]);
  const [jrdRealRequirementFormValue, setJrdRealRequirementFormValue] =
    useState<string>();
  const [showJrdRealRequirementForm, setShowJrdRealRequirementForm] =
    useState(false);
  const messageListScrollTopRef = useRef(0);

  // 当前 tab 未激活时的新消息提醒（提示音 + tab 红点）
  const [hasUnreadInInactiveTab, setHasUnreadInInactiveTab] = useState(false);
  const originalTitleRef = useRef<string | null>(null);
  const prevIsLoadingRef = useRef(isLoading);

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
  const showJdProgressRef = useRef(false);
  const pendingJdNextTaskRef = useRef(false);
  const onNextTaskRef = useRef(onNextTask);
  onNextTaskRef.current = onNextTask;

  const { t: originalT } = useTranslation();
  const { staffs } = useStaffs();

  const isJobIntakeChat = chatType === "jobRequirementDoc";
  const groupChatMode = isJobIntakeChat && isGroupChatMode(memberships);
  const ownerStaff = staffs.find((s) => s.id === job?.staff_id);
  const currentStaff = staffs.find(
    (s) => s.account?.username === globalStore.email,
  );
  const ownerName = guestContext?.ownerName || ownerStaff?.name || "Owner";
  const ownerEmail = isGuestViewer ? undefined : getStaffEmail(ownerStaff);
  const isJobOwner =
    !isGuestViewer &&
    !!job &&
    !!currentStaff &&
    currentStaff.id === job.staff_id;
  const myMembershipId = isGuestViewer
    ? guestContext?.membershipId
    : memberships.find((m) => m.staff_id === currentStaff?.id && !m.deleted_at)
        ?.id;
  const myMembershipName = memberships.find(
    (m) => m.id === myMembershipId,
  )?.name;

  useEffect(() => {
    if (!isGuestViewer) {
      initProfile();
    }
    if (typeof document !== "undefined" && !originalTitleRef.current) {
      originalTitleRef.current = document.title;
    }
  }, []);

  useEffect(() => {
    initConversation();
  }, [jobId, chatType, jrdEditConversationId]);

  useEffect(() => {
    onMembershipsChange?.(memberships);
  }, [memberships]);

  useEffect(() => {
    if (isJobIntakeChat && !isGuestViewer) {
      fetchCollaborators();
    }
  }, [isJobIntakeChat, jobId, isGuestViewer]);

  const [isTabActive, setIsTabActive] = useState(
    () => typeof document === "undefined" || !document.hidden,
  );

  // 轮询策略：群聊模式下窗口非激活时停止 polling
  useEffect(() => {
    if (isJobIntakeChat) {
      if (groupChatMode && !isTabActive) {
        return;
      }

      const intervalFetchMessage = setInterval(() => {
        fetchMessages();
        if (loadingStartedAtRef.current) {
          fetchStreamingMessage();
        }
      }, 3000);
      return () => clearInterval(intervalFetchMessage);
    }

    if (isLoading) {
      loadingStartedAtRef.current = dayjs();
      const intervalFetchMessage = setInterval(() => {
        fetchMessages();
        fetchStreamingMessage();
      }, 3000);

      return () => {
        clearInterval(intervalFetchMessage);
      };
    }
  }, [isLoading, isJobIntakeChat, jobId, chatType, groupChatMode, isTabActive]);

  // 开启/停止流式输出
  useEffect(() => {
    if (isLoading) {
      loadingStartedAtRef.current = dayjs();
    } else {
      loadingStartedAtRef.current = undefined;
      setStreamingLoadingText("");
    }
  }, [isLoading]);

  useEffect(() => {
    if (messages.length === 0) return;

    if (messages.length > 2 && needScrollToBottom.current) {
      childrenFunctionsRef.current.scrollToBottom?.();
      needScrollToBottom.current = false;
    }
  }, [messages]);

  // 同步侧边栏文档内容
  useEffect(() => {
    if (jrdContextDocumentJsonRef.current) {
      setSideDocumentContent(
        jrdContextDocumentJsonRef.current[sideDocumentType ?? ""] ?? "",
      );
    }
  }, [job]);

  // 同步 tab 激活状态；恢复前台时清除未读红点
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      const active = !document.hidden;
      setIsTabActive(active);
      if (active) {
        setHasUnreadInInactiveTab(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 根据未读状态更新浏览器 tab 标题（在标题前加一个红点）
  useEffect(() => {
    if (typeof document === "undefined" || !originalTitleRef.current) return;

    if (hasUnreadInInactiveTab) {
      const prefix = "● ";
      if (!document.title.startsWith(prefix)) {
        document.title = `${prefix}${originalTitleRef.current}`;
      }
    } else {
      document.title = originalTitleRef.current;
    }
  }, [hasUnreadInInactiveTab]);

  // 大模型回复结束时，如果当前 tab 不在前台，则播放提示音并标记未读
  useEffect(() => {
    if (typeof document === "undefined") return;

    const wasLoading = prevIsLoadingRef.current;
    prevIsLoadingRef.current = isLoading;

    // 仅在从 loading -> 非 loading 的瞬间判断
    if (wasLoading && !isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "ai" && document.hidden) {
        playNotificationBeep();
        setHasUnreadInInactiveTab(true);
      }
    }
  }, [isLoading, messages]);

  // 当 sideDocument 打开时，滚动到触发打开的消息
  useEffect(() => {
    if (sideDocumentVisible && sideDocumentTriggerMessageIdRef.current) {
      // 延迟执行，确保布局已经更新
      setTimeout(() => {
        childrenFunctionsRef.current.scrollToMessage?.(
          sideDocumentTriggerMessageIdRef.current!,
        );
      }, 100);
    }
  }, [sideDocumentVisible]);

  useEffect(() => {
    if (membershipsRefreshSignal > 0) {
      fetchMessages();
    }
  }, [membershipsRefreshSignal]);

  const fetchCollaborators = async () => {
    if (!isJobIntakeChat) return;
    const { code, data } = await Get<TJobCollaboratorsResponse>(
      `/api/jobs/${jobId}/collaborators`,
    );
    if (code === 0) {
      setCollaborators(data.job_collaborators ?? []);
    }
  };

  const resolveCollaboratorRole = (
    staffId?: number,
  ): "hiring_manager" | "recruiter" => {
    const collab = collaborators.find((c) => c.staff_id === staffId);
    return collab?.role === "recruiter" ? "recruiter" : "hiring_manager";
  };

  const mentionRoleLabel = (key: string) =>
    originalT(`chat.mention_role_${key}`);

  const mentionOptions: TMentionOption[] = isJobIntakeChat
    ? [
        {
          id: MENTION_VIONA_ID,
          name: "Viona",
          memberType: "ai",
          roleKey: "ai",
          roleLabel: mentionRoleLabel("ai"),
        },
        {
          id: MENTION_OWNER_ID,
          name: ownerName,
          memberType: "owner",
          email: ownerEmail,
          roleKey: isJobOwner ? "you" : "owner",
          roleLabel: mentionRoleLabel(isJobOwner ? "you" : "owner"),
        },
        ...getActiveMemberships(memberships).map((m) => {
          const isMe = isGuestViewer
            ? m.member_type === "guest" && m.guest_id === guestContext?.guestId
            : m.member_type === "staff" &&
              currentStaff != null &&
              m.staff_id === currentStaff.id;
          if (m.member_type === "guest") {
            return {
              id: m.id,
              name: m.name,
              memberType: "guest" as const,
              roleKey: (isMe ? "you" : "guest") as TMentionRoleKey,
              roleLabel: mentionRoleLabel(isMe ? "you" : "guest"),
            };
          }
          const staff = staffs.find((s) => s.id === m.staff_id);
          const collabRole = resolveCollaboratorRole(m.staff_id);
          const roleKey = isMe ? "you" : collabRole;
          return {
            id: m.id,
            name: m.name,
            email: isGuestViewer ? undefined : getStaffEmail(staff),
            memberType: "staff" as const,
            roleKey: roleKey as "you" | "hiring_manager" | "recruiter",
            roleLabel: mentionRoleLabel(roleKey),
          };
        }),
      ]
    : [];

  const resolveMentionName = (id: number) => {
    if (id === MENTION_VIONA_ID) return "Viona";
    if (id === MENTION_OWNER_ID) return ownerName;
    return memberships.find((m) => m.id === id)?.name;
  };

  const handleIntakeDoneNextTask = () => {
    if (showJdProgressRef.current) {
      pendingJdNextTaskRef.current = true;
      return;
    }
    onNextTaskRef.current?.();
  };

  const fetchStreamingMessage = async () => {
    let streamingUrl;
    if (apiMapping[chatType as TChatType]?.streaming) {
      streamingUrl = apiMapping[chatType as TChatType]?.streaming;
    }

    const streamChatType = apiMapping[chatType as TChatType]?.chatType;
    if (streamChatType) {
      streamingUrl = formatUrl(
        `/api/jobs/${jobId}/chat/${streamChatType}/streaming_message`,
      );
    }

    if (!streamingUrl) return;

    const { code, data } = await Get(streamingUrl);

    if (code === 0 && !!loadingStartedAtRef.current) {
      setStreamingLoadingText((current) => {
        const message = data?.message ?? "";
        if (current.length === 0 && message.length < 15) {
          // 第一轮如果字太少，就先跳过
          return "";
        }
        return message;
      });
    }
  };

  const playNotificationBeep = () => {
    if (typeof window === "undefined") return;

    try {
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.12;

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 200);
    } catch {
      // 忽略浏览器不支持或被用户禁用声音的情况
    }
  };

  const t = (key: string) => {
    return originalT(`chat.${key}`);
  };

  const formatUrl = (url: string) => {
    if (isGuestViewer && url.startsWith("/api/jobs/")) {
      return url.replace("/api/jobs/", "/api/guest/jobs/");
    }
    return url;
  };

  const apiMapping: Record<
    TChatType,
    { get: string; send: string; chatType?: string; streaming?: string }
  > = {
    jobRequirementDoc: {
      chatType: "JOB_REQUIREMENT",
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_REQUIREMENT/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_REQUIREMENT/send`),
      streaming: formatUrl(
        `/api/jobs/${jobId}/chat/JOB_REQUIREMENT/streaming_message`,
      ),
    },
    jobDescription: {
      chatType: "JOB_DESCRIPTION",
      get: formatUrl(`/api/jobs/${jobId}/chat/JOB_DESCRIPTION/messages`),
      send: formatUrl(`/api/jobs/${jobId}/chat/JOB_DESCRIPTION/send`),
    },
    jobTalentEvaluateFeedback: {
      get: formatUrl(`/api/jobs/${jobId}/talents/${talentId}/chat/messages`),
      send: formatUrl(`/api/jobs/${jobId}/talents/${talentId}/chat/send`),
    },
    jobJrdEdit:
      jrdEditConversationId != null
        ? {
            get: formatUrl(
              `/api/jobs/${jobId}/jrd-edit-conversations/${jrdEditConversationId}/messages`,
            ),
            send: formatUrl(
              `/api/jobs/${jobId}/jrd-edit-conversations/${jrdEditConversationId}/send`,
            ),
            streaming: formatUrl(
              `/api/jobs/${jobId}/jrd-edit-conversations/${jrdEditConversationId}/streaming_message`,
            ),
          }
        : { get: "", send: "", streaming: "" },
    companyOnboardingNarrative: {
      get: formatUrl(`/api/onboarding/company-narrative/chat/messages`),
      send: formatUrl(`/api/onboarding/company-narrative/chat/send`),
      streaming: formatUrl(
        `/api/onboarding/company-narrative/chat/streaming_message`,
      ),
    },
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
            sendMessageWithMentionViona(
              "好的，请你用中文和我进行接下来的对话。",
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
            sendMessageWithMentionViona(
              "Sure. Please speak with me in English.",
            ),
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
              sendMessageWithMentionViona(
                "请用中文来撰写这个职位的JD。请你在把JD发给我之前确保你的语言是正宗地道的适合在职位描述中使用的中文。",
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
              sendMessageWithMentionViona(
                "Please use English to draft the JD. Please make sure you use authentic English that is appropriate for the use in an official Job Description.",
              );
            } else {
              message.error(t("update_job_failed"));
            }
          },
        },
      ],
    },
    {
      key: "intake-done",
      title: t("view_jrd"),
      ...(onNextTask
        ? { autoTrigger: true, handler: () => handleIntakeDoneNextTask() }
        : { handler: () => viewDoc?.("job-requirement") }),
    },
    {
      key: "jd-done",
      title: t("view_jd"),
      ...(onNextTask
        ? { autoTrigger: true, handler: () => onNextTask?.() }
        : { handler: () => viewDoc?.("job-description") }),
    },
    ...(!isJobOwner
      ? []
      : [
          {
            key: "copy-link" as TExtraTagName,
            title: t("invite_collaborators_cta"),
            handler: async () => {
              if (isJobIntakeChat) {
                setIsInviteCollaboratorsOpen(true);
              }
            },
          },
        ]),
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
      key: "realreq",
      title: t("edit_real_requirement"),
      handler: (tag) => {
        setJrdRealRequirementFormValue(tag?.content);
        setShowJrdRealRequirementForm(true);
        messageListScrollTopRef.current =
          document.querySelector("." + styles.listArea)?.scrollTop ?? 0;
      },
      autoTrigger: true,
    },
    {
      key: "refined-jrd",
      style: "hidden",
      handler: () => {
        setConversationFinished(true);
      },
      autoTrigger: true,
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
              jrdContextDocumentJsonRef.current?.[documentType] ?? "",
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
    showJdProgressRef.current = false;
    pendingJdNextTaskRef.current = false;
    setShowJdProgress(false);
    setJdProgressStatus(false);
    setWaitingType("");
    if (
      !isGuestViewer &&
      chatType !== "companyOnboardingNarrative" &&
      chatType !== "jobJrdEdit"
    ) {
      await fetchJob();
    }
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

  const updateJob = async (payload: {
    jd_language?: IJob["jd_language"];
    intake_mode?: IJob["intake_mode"];
  }) => {
    const { code } = await Post(formatUrl(`/api/jobs/${jobId}`), payload);
    return code === 0;
  };

  const selectIntakeMode = async (mode: NonNullable<IJob["intake_mode"]>) => {
    if (job?.intake_mode) return;

    const success = await updateJob({ intake_mode: mode });
    if (success) {
      await fetchMessages();
    } else {
      message.error(t("update_job_failed"));
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
    if (code === 10001 && isGuestViewer) {
      onGuestAuthFailure?.();
      return;
    }
    if (code === 0) {
      const currentJob: IJob | undefined = data.job;
      if (
        chatType !== "companyOnboardingNarrative" &&
        chatType !== "jobJrdEdit"
      ) {
        setJob(currentJob);
      }

      const messageHistory = formatMessages(data.messages, currentJob);
      const isLoading = data.is_invoking === 1;
      const nextWaitingType = (data.waiting_type ?? "") as TWaitingType;
      setWaitingType(nextWaitingType);
      setIsLoading(isLoading);
      if (isJobIntakeChat) {
        setMemberships(data.memberships ?? []);
      }

      if (nextWaitingType === "waiting_for_jd") {
        showJdProgressRef.current = true;
        setShowJdProgress(true);
      }

      if (messageHistory.length === 0 && !isLoading && autoStart) {
        sendMessage("Start", {
          metadata: {
            hide_for_roles: ["staff"],
          },
          hide: true,
        });
        return;
      }

      // 自动执行标签逻辑
      const lastMessage = messageHistory[messageHistory.length - 1];
      if (lastMessage) {
        if (lastMessage.id !== lastMessageIdRef.current) {
          if (
            chatType === "companyOnboardingNarrative" &&
            (lastMessage.extraTags ?? []).some(
              (tag) => tag.name === "onboarding-narrative-done",
            )
          ) {
            onNextTask?.();
          }
          // 如果没有打开文档的按钮，则关闭文档
          if (
            lastMessage.role === "ai" &&
            !SIDE_DOCUMENT_TYPES.find((type) =>
              (lastMessage.extraTags ?? []).find((tag) => tag.name === type),
            )
          ) {
            setSideDocumentVisible(false);
          }
          // 如果最后一条消息需要弹表单或者抽屉，则直接打开
          let extraTag;
          const autoTriggerTag = supportTags.find((supportTag) => {
            extraTag = (lastMessage.extraTags ?? []).find(
              (tag) => supportTag.key === tag.name && supportTag.autoTrigger,
            );
            return !!extraTag;
          });
          autoTriggerTag?.handler?.(extraTag);
          sideDocumentTriggerMessageIdRef.current = lastMessage.id;
        }
        lastMessageIdRef.current = lastMessage.id;

        if (
          showJdProgressRef.current &&
          (lastMessage.extraTags ?? []).some(
            (tag) => tag.name === "intake-done" || tag.name === "jrd-done",
          )
        ) {
          setJdProgressStatus(true);
        }
      }

      // 如果正在 loading，添加 fake 消息（waiting_for_jd 进度卡替代 loading 点）
      if (isLoading && !showJdProgressRef.current) {
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
      },
    );
    if (code === 0) {
      message.success(originalT("submit_succeed"));
      setIsEditingSideDocument(false);
      fetchJob();
    }
  };

  const formatMessages = (
    messages: TMessageFromApi[],
    job?: IJob,
  ): TMessage[] => {
    // 根据 extraTag 添加系统消息
    const resultMessages: TMessage[] = [];
    let intakeModeMessageInserted = false;

    messages.forEach((item) => {
      const hideForRoles = item.content.metadata.hide_for_roles ?? [];
      // 过滤对该角色隐藏的消息
      if ((hideForRoles.length && share) || hideForRoles.includes("staff"))
        return;

      const extraTagsRaw = item.content.metadata.extra_tags || [];
      const hasJrdLanguage = extraTagsRaw.some(
        (tag) => tag.name === "jrd-language",
      );

      if (
        chatType === "jobRequirementDoc" &&
        hasJrdLanguage &&
        !intakeModeMessageInserted
      ) {
        intakeModeMessageInserted = true;
        resultMessages.push({
          id: "intake-mode-selection",
          role: "ai",
          content: t("intake_mode_ask"),
          updated_at: item.updated_at,
          messageType: "normal",
          extraTags: [
            {
              name: "jrd-intake-mode",
              content: job?.intake_mode ?? "",
            },
          ],
        });

        if (!job?.intake_mode) {
          return;
        }
      }

      if (
        item.content.content ||
        item.content.metadata.message_sub_type === "error"
      ) {
        const extraTags = item.content.metadata.extra_tags || [];
        resultMessages.push({
          id: item.id.toString(),
          role: item.content.role === "assistant" ? "ai" : "user",
          content: item.content.content,
          thinking: item.content.thinking ?? "",
          updated_at: item.updated_at,
          messageType: item.content.metadata.message_type || "normal",
          messageSubType: item.content.metadata.message_sub_type || "normal",
          extraTags: extraTags,
          senderMembershipId: item.content.sender_membership_id,
          senderName: item.content.sender_name,
          mentions: item.content.mentions,
        });
      }
    });

    return resultMessages;
  };

  const sendMessageWithMentionViona = async (rawMessage: string) => {
    sendMessage(rawMessage, {
      mentions: groupChatMode ? [MENTION_VIONA_ID] : undefined,
    });
  };

  const sendMessage = async (
    rawMessage: string,
    options?: {
      voice_payload_id?: number;
      metadata?: {
        before_text?: string;
        after_text?: string;
        hide_for_roles?: ("staff" | "coworker" | "candidate" | "trial_user")[];
      };
      hide?: boolean;
      mentions?: number[];
    },
  ) => {
    const mentions = options?.mentions ?? [];
    const willInvokeLlm = !groupChatMode || mentionsIncludeViona(mentions);

    if (isLoading && (!groupChatMode || willInvokeLlm)) {
      if (groupChatMode && willInvokeLlm) {
        message.warning(t("cannot_mention_viona_while_thinking"));
      }
      return;
    }

    const { voice_payload_id, metadata, hide } = options ?? {};
    const formattedMessage = rawMessage.trim();
    needScrollToBottom.current = true;

    const optimisticUser = hide
      ? []
      : [
          {
            id: `fake_user_${Date.now()}`,
            role: "user" as const,
            content: formattedMessage,
            updated_at: dayjs().format(datetimeFormat),
            mentions,
            ...(isJobOwner
              ? {}
              : {
                  senderMembershipId: myMembershipId,
                  senderName: myMembershipName,
                }),
          },
        ];

    if (willInvokeLlm) {
      setMessages([
        ...messages,
        ...optimisticUser,
        {
          id: "fake_ai_id",
          role: "ai",
          content: "",
          updated_at: dayjs().format(datetimeFormat),
        },
      ]);
      setIsLoading(true);
      loadingStartedAtRef.current = dayjs();
    } else {
      // 群聊未 @Viona：用户消息插在 thinking 前（若有）
      const withoutFakeAi = messages.filter((m) => m.id !== "fake_ai_id");
      const next = [...withoutFakeAi, ...optimisticUser];
      if (isLoading) {
        next.push({
          id: "fake_ai_id",
          role: "ai",
          content: "",
          updated_at: dayjs().format(datetimeFormat),
        });
      }
      setMessages(next);
    }

    const { code } = await Post(apiMapping[chatType as TChatType].send, {
      content: formattedMessage,
      voice_payload_id: voice_payload_id,
      metadata: metadata,
      mentions,
    });

    // 仅限额时报错。其它情况，不用报错。轮询会保证最终结果一致
    if (code === 10001) {
      setIsLoading(false);
      message.error(t("viona_is_thinking"));
    } else if (code === 10011) {
      setIsLoading(false);
      setMessages(messages);
      message.error(t("quota_exhausted"));
    } else if (!willInvokeLlm) {
      fetchMessages();
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
    const url = `/api/jobs/${jobId}/messages`;

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
                onClick={() => sendMessageWithMentionViona(text)}
                style={{ borderRadius: 12 }}
              >
                <span style={{ color: "#c1c1c1" }}>→</span> {text}
              </Button>
            );
          },
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div
        className={classnames(styles.conversation, {
          [styles.collapsed]: sideDocumentVisible,
        })}
      >
        <div className={styles.chatArea}>
          {showJrdRealRequirementForm ? (
            <JrdRealRequirementForm
              onSubmit={(result: string) => {
                if (!isLoading) {
                  sendMessageWithMentionViona(result);
                  setShowJrdRealRequirementForm(false);
                }
              }}
              onBack={() => {
                setShowJrdRealRequirementForm(false);
              }}
              onAgree={() => {
                if (!isLoading) {
                  sendMessageWithMentionViona(t("agree"));
                  setShowJrdRealRequirementForm(false);
                }
              }}
              initialValue={jrdRealRequirementFormValue ?? ""}
            />
          ) : (
            <>
              <ChatMessageList
                messages={messages.map((m) => ({
                  ...m,
                  content: buildMentionDisplayContent(
                    m.content,
                    m.mentions,
                    resolveMentionName,
                  ),
                }))}
                groupLayout={isJobIntakeChat}
                ownerName={ownerName}
                isOwnUserMessage={(item) => {
                  if (item.role !== "user") return false;
                  if (isJobOwner) {
                    return (
                      item.senderMembershipId == null ||
                      item.senderMembershipId === undefined
                    );
                  }
                  return (
                    myMembershipId != null &&
                    item.senderMembershipId === myMembershipId
                  );
                }}
                isLoading={isLoading}
                className={styles.listArea}
                childrenFunctionsRef={childrenFunctionsRef}
                showCustomThinkingText={() => {
                  return waitingType === "generate_jrd_strategy"
                    ? originalT("chat.viona_is_generating_jrd_strategy")
                    : "";
                }}
                streamingMessage={streamingLoadingText}
                footerContent={
                  showJdProgress ? (
                    <JdProgressCard
                      status={jdProgressStatus}
                      onComplete={() => {
                        showJdProgressRef.current = false;
                        setShowJdProgress(false);
                        setJdProgressStatus(false);
                        if (pendingJdNextTaskRef.current) {
                          pendingJdNextTaskRef.current = false;
                          onNextTaskRef.current?.();
                        }
                      }}
                    />
                  ) : null
                }
                renderTagsContent={(item) => {
                  const hasIntakeModeTag = (item.extraTags ?? []).some(
                    (tag) => tag.name === "jrd-intake-mode",
                  );
                  if (hasIntakeModeTag) {
                    const intakeModes = [
                      {
                        key: "standard" as const,
                        label: t("intake_mode_standard_button"),
                      },
                      {
                        key: "fast" as const,
                        label: t("intake_mode_fast_button"),
                      },
                    ];
                    return (
                      <div className={styles.inlineButtonWrapper}>
                        {intakeModes.map((modeOption) =>
                          !job?.intake_mode ||
                          job.intake_mode === modeOption.key ? (
                            <div
                              style={{ marginBottom: 16 }}
                              key={modeOption.key}
                            >
                              <Button
                                type="primary"
                                className={styles.inlineButton}
                                disabled={!!job?.intake_mode}
                                onClick={() => selectIntakeMode(modeOption.key)}
                              >
                                {modeOption.label}
                              </Button>
                            </div>
                          ) : null,
                        )}
                      </div>
                    );
                  }

                  const visibleTags = (item.extraTags ?? [])
                    .map((extraTag) => {
                      return supportTags.find(
                        (tag) => tag.key === extraTag.name,
                      );
                    })
                    .filter(Boolean) as TSupportTag[];

                  return (
                    visibleTags.length > 0 && (
                      <div className={styles.inlineButtonWrapper}>
                        {visibleTags.map((tag) => {
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
                                        tag.key as any,
                                      )
                                    ) {
                                      sideDocumentTriggerMessageIdRef.current =
                                        item.id;
                                    }
                                    const extraTag = (
                                      item.extraTags ?? []
                                    ).find(
                                      (extraTag) => extraTag.name === tag.key,
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
                    )
                  );
                }}
                renderOperationContent={(item, isLast) => {
                  const canDelete =
                    (isJobIntakeChat ? isJobOwner : !!profile?.is_admin) &&
                    chatType !== "jobTalentEvaluateFeedback" &&
                    chatType !== "jobJrdEdit" &&
                    item.messageType === "normal" &&
                    !item.id.startsWith("fake_");
                  // 操作区. 用户消息 &&普通类型消息 && 大模型生成 && 不是 mock 消息 && 非编辑状态

                  const canRetry =
                    !hideRetry && isLast && item.messageSubType === "error";

                  return canDelete || canRetry ? (
                    <div
                      className={classnames(
                        styles.operationArea,
                        styles[item.role],
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
                {!hidePredefinedButtons && (
                  <div className={classnames("flex-center")}>
                    {genPredefinedButton()}
                  </div>
                )}
                <ChatInputArea
                  onSubmit={(value, options) => {
                    sendMessage(value, options);
                  }}
                  isLoading={isLoading || conversationFinished}
                  disabledVoiceInput={
                    conversationFinished || (isLoading && !groupChatMode)
                  }
                  isCollapsed={sideDocumentVisible}
                  lastMessage={lastAiMessageForVoice}
                  enableMentions={isJobIntakeChat}
                  mentionOptions={mentionOptions}
                  mentionChatMode={groupChatMode ? "group" : "one_to_one"}
                />
              </div>
            </>
          )}
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

      {!isGuestViewer && (
        <InviteCollaboratorsModal
          open={isInviteCollaboratorsOpen}
          onCancel={() => setIsInviteCollaboratorsOpen(false)}
          jobId={jobId}
        />
      )}
    </div>
  );
};

export default observer(StaffChat);
