import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { List, Avatar } from "antd";
import classnames from "classnames";
import dayjs, { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";

import percyHiFace from "@/assets/percy-hi-face.png";
import VionaAvatar from "@/assets/viona-avatar.png";
import MarkdownContainer from "../MarkdownContainer";
import styles from "./style.module.less";
import {
  getAvatarColor,
  getNameInitials,
} from "../StaffChat/intakeCollabUtils";

const ASSISTANT_AVATAR_CONFIG: Record<
  TAssistantPerson,
  { src: string; name: string }
> = {
  viona: { src: VionaAvatar, name: "Viona" },
  percy: { src: percyHiFace, name: "Percy" },
};

interface IProps {
  messages: TMessage[];
  assistantPerson?: TAssistantPerson;
  transparentBackground?: boolean;
  isLoading?: boolean;
  childrenFunctionsRef?: React.RefObject<{
    scrollToBottom?: (() => void) | undefined;
    scrollToMessage?: ((messageId: string) => void) | undefined;
  }>;
  className?: string;
  style?: React.CSSProperties;
  showUserTimestamp?: boolean;
  fontSize?: number;
  renderTagsContent?: (item: TMessage) => ReactNode;
  renderOperationContent?: (
    item: TMessage,
    isLast: boolean,
    isFirst: boolean,
  ) => ReactNode;
  showCustomThinkingText?: () => string;
  streamingMessage?: string;
  preview?: boolean;
  footerContent?: ReactNode;
  /** Job Intake 群聊：他人消息左侧展示 */
  groupLayout?: boolean;
  isOwnUserMessage?: (item: TMessage) => boolean;
  ownerName?: string;
}

const datetimeFormat = "YYYY/MM/DD HH:mm:ss";

const StreamingMarkdownRenderer = memo((props: { content: string }) => {
  const { content } = props;
  const [renderText, setRenderText] = useState("");
  const displayTextRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }

    const targetText = content ?? "";
    const currentText = displayTextRef.current;

    if (!targetText) {
      displayTextRef.current = "";
      setRenderText("");
      return;
    }

    if (!targetText.startsWith(currentText)) {
      displayTextRef.current = targetText;
      setRenderText(targetText);
      return;
    }

    const delta = targetText.slice(currentText.length);
    if (!delta) return;

    const totalTicks = 60;
    const interval = 3000 / totalTicks;
    let tick = 0;
    timerRef.current = setInterval(() => {
      tick += 1;
      const revealLength = Math.ceil((delta.length * tick) / totalTicks);
      const nextText = currentText + delta.slice(0, revealLength);
      displayTextRef.current = nextText;
      setRenderText(nextText);

      if (tick >= totalTicks && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    }, interval);
  }, [content]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return <MarkdownContainer content={renderText} />;
});

const ChatMessageList = (props: IProps) => {
  const {
    messages,
    isLoading = false,
    className,
    style,
    childrenFunctionsRef,
    renderTagsContent,
    renderOperationContent,
    showUserTimestamp = false,
    showCustomThinkingText,
    fontSize = 16,
    streamingMessage,
    preview = false,
    assistantPerson = "viona",
    transparentBackground = false,
    footerContent,
    groupLayout = false,
    ownerName = "You",
    isOwnUserMessage,
  } = props;

  const assistant = ASSISTANT_AVATAR_CONFIG[assistantPerson];
  const loadingStartedAtRef = useRef<Dayjs>();
  const loadingDotsRef = useRef(".");
  const loadingDotsNodeRef = useRef<HTMLSpanElement | null>(null);
  const loadingThinkingNodeRef = useRef<HTMLSpanElement | null>(null);
  const dotsTimerRef = useRef<ReturnType<typeof setInterval>>();
  const thinkingTimerRef = useRef<ReturnType<typeof setInterval>>();
  const listContainerRef = useRef<HTMLDivElement | null>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageRefsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const showCustomThinkingTextFuncRef = useRef<() => string>();
  showCustomThinkingTextFuncRef.current = showCustomThinkingText;

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`chat.${key}`);

  useEffect(() => {
    if (childrenFunctionsRef?.current) {
      childrenFunctionsRef.current.scrollToBottom = scrollToBottom;
      childrenFunctionsRef.current.scrollToMessage = scrollToMessage;
    }
  }, [messages]);

  useEffect(() => {
    const clearLoadingTimers = () => {
      if (dotsTimerRef.current) {
        clearInterval(dotsTimerRef.current);
        dotsTimerRef.current = undefined;
      }
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
        thinkingTimerRef.current = undefined;
      }
    };

    if (isLoading) {
      loadingStartedAtRef.current = dayjs();
      loadingDotsRef.current = ".";
      if (loadingDotsNodeRef.current) {
        loadingDotsNodeRef.current.textContent = ".";
      }
      if (loadingThinkingNodeRef.current) {
        loadingThinkingNodeRef.current.textContent = "";
      }

      dotsTimerRef.current = setInterval(() => {
        loadingDotsRef.current =
          loadingDotsRef.current === "..." ? "." : loadingDotsRef.current + ".";
        if (loadingDotsNodeRef.current) {
          loadingDotsNodeRef.current.textContent = loadingDotsRef.current;
        }
      }, 500);
      thinkingTimerRef.current = setInterval(() => {
        const showThinking =
          dayjs().diff(loadingStartedAtRef.current ?? dayjs(), "second") > 1;
        const thinkingText = showThinking
          ? `(${showCustomThinkingTextFuncRef.current?.() || t(assistantPerson === "percy" ? "percy_is_thinking" : "viona_is_thinking")})`
          : "";

        if (loadingThinkingNodeRef.current) {
          loadingThinkingNodeRef.current.textContent = thinkingText;
        }
      }, 200);

      return () => {
        clearLoadingTimers();
      };
    } else {
      loadingStartedAtRef.current = undefined;
      clearLoadingTimers();
      if (loadingDotsNodeRef.current) {
        loadingDotsNodeRef.current.textContent = ".";
      }
      if (loadingThinkingNodeRef.current) {
        loadingThinkingNodeRef.current.textContent = "";
      }
    }
  }, [isLoading]);

  useEffect(() => {
    return () => {
      if (dotsTimerRef.current) clearInterval(dotsTimerRef.current);
      if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
    };
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // 先滚动到底部，再向上滚动 100px
      messagesEndRef.current.scrollIntoView();
      if (messagesEndRef.current.parentElement) {
        messagesEndRef.current.parentElement.scrollTop -= 120;
      }
    }
  };

  const scrollToMessage = (messageId: string) => {
    const messageElement = messageRefsRef.current.get(messageId);
    if (messageElement && listContainerRef.current) {
      const container = listContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const messageRect = messageElement.getBoundingClientRect();

      // 计算消息相对于容器的位置
      const relativeTop =
        messageRect.top - containerRect.top + container.scrollTop;

      // 滚动到消息位置，保持一些偏移以便更好地查看
      container.scrollTop = relativeTop - 100;
    }
  };

  return (
    <div
      className={classnames(styles.listArea, className)}
      ref={(e) => (listContainerRef.current = e)}
      style={style}
    >
      <List
        dataSource={messages}
        split={false}
        renderItem={(item, index) => {
          const isLast = index === messages.length - 1;
          const isFirst = index === 0;
          const isSystemEvent = item.messageType === "system";
          const isOwn =
            item.role === "user" && (isOwnUserMessage?.(item) ?? true);
          const isOtherParticipant = item.role === "user" && !isOwn;
          const senderName = item.senderName ?? ownerName;
          const otherKey = String(item.senderMembershipId ?? senderName);

          const renderBody = () => (
            <div
              className={classnames(styles.messageContainer, {
                [styles.lastMessage]: index === messages.length - 1,
                [styles.user]: isOwn,
                [styles.participant]: isOtherParticipant,
                [styles.messageContainerBubblePadding]: transparentBackground,
                [styles.showFooter]: isLast && !!footerContent,
              })}
              style={{ fontSize }}
            >
              {!groupLayout && showUserTimestamp && isOwn && (
                <div
                  className={styles.timestamp}
                  style={{ textAlign: "right", marginBottom: 4 }}
                >
                  {dayjs(item.updated_at).format(datetimeFormat)}
                </div>
              )}
              {groupLayout && isOwn && (
                <div className={styles.userMeta}>
                  <span className={styles.userMetaTime}>
                    {dayjs(item.updated_at).format("h:mma")}
                  </span>
                  <span className={styles.userMetaName}>{senderName}</span>
                  <span
                    className={styles.userMetaAvatar}
                    style={{
                      background: getAvatarColor(senderName),
                    }}
                  >
                    {getNameInitials(senderName)}
                  </span>
                </div>
              )}
              <div className={styles.messageContent}>
                {item.id === "fake_ai_id" ? (
                  streamingMessage ? (
                    <StreamingMarkdownRenderer content={streamingMessage} />
                  ) : (
                    <p>
                      <span ref={loadingDotsNodeRef}>.</span>
                      <span ref={loadingThinkingNodeRef} />
                    </p>
                  )
                ) : (
                  <MarkdownContainer
                    content={
                      item.messageSubType === "error"
                        ? t("error_message")
                        : item.content
                    }
                  />
                )}
                {renderTagsContent?.(item)}
              </div>
              {renderOperationContent?.(item, isLast, isFirst)}
              {isLast ? footerContent : null}
            </div>
          );

          if (isSystemEvent) {
            return (
              <List.Item
                ref={(node) => {
                  if (node) {
                    messageRefsRef.current.set(item.id, node);
                  } else {
                    messageRefsRef.current.delete(item.id);
                  }
                }}
                key={item.id}
                className={styles.systemEventItem}
              >
                <div className={styles.systemEvent} role="status">
                  <span className={styles.systemEventLine} aria-hidden />
                  <span className={styles.systemEventText}>{item.content}</span>
                  <span className={styles.systemEventLine} aria-hidden />
                </div>
              </List.Item>
            );
          }

          return (
            <List.Item
              ref={(node) => {
                if (node) {
                  messageRefsRef.current.set(item.id, node);
                } else {
                  messageRefsRef.current.delete(item.id);
                }
              }}
              style={{
                ...(isLast
                  ? {
                      minHeight: preview
                        ? 0
                        : (listContainerRef.current?.clientHeight ?? 80) - 8,
                      alignItems: "flex-start",
                    }
                  : {}),
              }}
              key={item.id}
            >
              <List.Item.Meta
                avatar={
                  item.role === "ai" ? (
                    <Avatar
                      style={{
                        border: "none",
                        background: "none",
                        width: 40,
                        height: 40,
                      }}
                      icon={
                        <img
                          src={assistant.src}
                          alt={assistant.name}
                          style={
                            assistantPerson === "percy"
                              ? {
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  objectPosition: "50% 16%",
                                }
                              : undefined
                          }
                        />
                      }
                    />
                  ) : isOtherParticipant ? (
                    <span
                      className={styles.collaboratorAvatar}
                      style={{ background: getAvatarColor(otherKey) }}
                      aria-label={senderName}
                    >
                      {getNameInitials(senderName)}
                    </span>
                  ) : null
                }
                title={
                  item.role === "ai" ? (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 18 }}>{assistant.name}</span>
                      <span className={styles.timestamp}>
                        {dayjs(item.updated_at).format("h:mma")}
                      </span>
                    </div>
                  ) : isOtherParticipant ? (
                    <div className={styles.collaboratorMeta}>
                      <span className={styles.collaboratorName}>
                        {senderName}
                      </span>
                      <span className={styles.timestamp}>
                        {dayjs(item.updated_at).format("h:mma")}
                      </span>
                    </div>
                  ) : null
                }
                description={renderBody()}
              />
            </List.Item>
          );
        }}
        rowKey={(item) => item.id}
      />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessageList;
