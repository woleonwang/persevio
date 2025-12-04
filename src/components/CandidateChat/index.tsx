import React, { useState, useRef, useEffect } from "react";
import { Button, message, Tooltip } from "antd";
import dayjs, { Dayjs } from "dayjs";
import classnames from "classnames";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { Get, Post } from "@/utils/request";

import styles from "./style.module.less";

import ChatInputArea from "../ChatInputArea";
import ChatMessageList from "../ChatMessageList";
import Icon from "../Icon";
import Delete from "@/assets/icons/delete";
import AudioPlayer from "../AudioPlayer";

const datetimeFormat = "YYYY/MM/DD HH:mm:ss";

type TSupportTag = {
  key: TExtraTagName;
  title: string;
  handler: (tag?: { name: string; content: string }) => void;
  autoTrigger?: boolean;
};

interface IProps {
  chatType:
    | "profile"
    | "deep_aspirations"
    | "job_interview"
    | "work_experience"
    | "network_profile";
  jobApplyId?: number;
  onFinish?: () => void;
  workExperienceCompanyName?: string;
  candidate?: ICandidateSettings;
}

const ChatTypeMappings = {
  profile: "CANDIDATE_PROFILE_CHAT",
  deep_aspirations: "CANDIDATE_DEEP_CAREER_ASPIRATION_CHAT",
  job_interview: "CANDIDATE_JOB_INTERVIEW_CHAT",
  work_experience: "CANDIDATE_WORK_EXPERIENCE_CHAT",
  network_profile: "CANDIDATE_NETWORK_PROFILE_CHAT",
};

const CandidateChat: React.FC<IProps> = (props) => {
  const { chatType, onFinish, jobApplyId, workExperienceCompanyName } = props;

  const [messages, setMessages] = useState<TMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [_, setPlayingAudioMessageId] = useState<number>(0);

  // 最后一条消息的 id，用于控制新增消息的自动弹出
  const lastMessageIdRef = useRef<string>();

  const needScrollToBottom = useRef(false);
  const loadingStartedAtRef = useRef<Dayjs>();
  const childrenFunctionsRef = useRef<{
    scrollToBottom?: () => void;
  }>({});

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`chat.${key}`);

  useEffect(() => {
    needScrollToBottom.current = true;
    fetchMessages();
  }, []);

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

    if (needScrollToBottom.current) {
      childrenFunctionsRef.current.scrollToBottom?.();
      needScrollToBottom.current = false;
    }
  }, [messages]);

  const supportTags: TSupportTag[] = [
    {
      key: "interview-done",
      title: "",
      handler: () => {
        message.success(
          "This conversation has been finished, redirect to dashboard in 5 seconds",
          5,
          () => onFinish?.()
        );
      },
      autoTrigger: true,
    },
    {
      key: "job-interview-done",
      title: "",
      handler: () => {
        message.success(
          "This conversation has been finished, redirect to dashboard in 5 seconds",
          5,
          () => onFinish?.()
        );
      },
      autoTrigger: true,
    },
    {
      key: "conversation-done",
      title: t("finish_conversation"),
      handler: () => onFinish?.(),
    },
  ];

  const fetchMessages = async () => {
    if (chatType === "work_experience") {
      setMessages([
        {
          id: "chatbot-message-greeting-1",
          role: "ai",
          content: `Hi, it's me, Viona, your dedicated career copilot again. This time, I'd like to further understand your experience at ${workExperienceCompanyName} so I send you even more accurate job recommendations. 

Shall we start now?`,
          updated_at: dayjs().format(datetimeFormat),
          messageType: "system",
        },
      ]);
      return;
    }

    const { code, data } = await Get(
      `/api/candidate/chat/${ChatTypeMappings[chatType]}${
        jobApplyId ? `/${jobApplyId}` : ""
      }/messages`
    );

    if (code === 0) {
      const messageHistory = formatMessages(data.messages);
      const isLoading = data.is_invoking === 1;
      setIsLoading(isLoading);

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

  const formatMessages = (messages: TMessageFromApi[]): TMessage[] => {
    // 根据 extraTag 添加系统消息
    const resultMessages: TMessage[] = [];

    messages.forEach((item) => {
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
          payloadId: item.payload_id,
          duration: item.payload?.duration,
        });
      }
    });

    return resultMessages;
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

    const { voice_payload_id, metadata } = options ?? {};

    setIsLoading(true);

    const { code } = await Post(
      `/api/candidate/chat/${ChatTypeMappings[chatType]}${
        jobApplyId ? `/${jobApplyId}` : ""
      }/send`,
      {
        content: formattedMessage,
        voice_payload_id: voice_payload_id,
        metadata: metadata,
      }
    );
    if (code === 0) {
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
    } else {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (messageId: number) => {
    const { code } = await Post(
      `/api/candidate/chat/${ChatTypeMappings[chatType]}${
        jobApplyId ? `/${jobApplyId}` : ""
      }/clear_messages`,
      {
        message_id: messageId,
      }
    );

    if (code === 0) {
      message.success(t("message_delete_success"));
      fetchMessages();
    } else {
      message.error(t("message_delete_failed"));
    }
  };

  return (
    <div className={styles.container}>
      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        className={styles.listArea}
        childrenFunctionsRef={childrenFunctionsRef}
        renderTagsContent={(item) => {
          const canPlayAudio = !!item.payloadId && item.duration;

          const visibleTags = (item.extraTags ?? [])
            .map((extraTag) => {
              return supportTags.find(
                (tag) => tag.key === extraTag.name && tag.title
              );
            })
            .filter(Boolean) as TSupportTag[];

          return (
            <>
              {visibleTags.length > 0 && (
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
                            const extraTag = (item.extraTags ?? []).find(
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
              )}
              {canPlayAudio && (
                <AudioPlayer
                  duration={item.duration ?? 0}
                  payloadUrl={`/api/candidate/chat/${
                    ChatTypeMappings[chatType]
                  }${jobApplyId ? `/${jobApplyId}` : ""}/messages/${item.id}`}
                  onPlay={() => setPlayingAudioMessageId(parseInt(item.id))}
                  onStop={() => setPlayingAudioMessageId(0)}
                />
              )}
            </>
          );
        }}
        renderOperationContent={(item) => {
          const canDelete =
            item.role === "user" &&
            item.messageType === "normal" &&
            !["fake_ai_id", "fake_user_id"].includes(item.id);

          return (
            canDelete && (
              <div className={classnames(styles.operationArea, styles.user)}>
                <Tooltip title={originalT("delete")}>
                  <div
                    onClick={() => {
                      if (confirm(t("confirm_delete_message"))) {
                        deleteMessage(parseInt(item.id));
                      }
                    }}
                  >
                    <Icon icon={<Delete />} />
                  </div>
                </Tooltip>
              </div>
            )
          );
        }}
      />

      <div className={styles.footer}>
        <ChatInputArea
          onSubmit={(value, options) => {
            sendMessage(value, options);
          }}
          isLoading={isLoading}
          disabledVoiceInput={isLoading}
        />
      </div>
    </div>
  );
};

export default observer(CandidateChat);
