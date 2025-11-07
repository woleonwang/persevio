import { useEffect, useRef, useState } from "react";
import { List, Avatar } from "antd";
import classnames from "classnames";
import dayjs, { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";

import VionaAvatar from "@/assets/viona-avatar.png";
import MarkdownContainer from "../MarkdownContainer";
import styles from "./style.module.less";

interface IProps {
  messages: TMessage[];
  isLoading: boolean;
  childrenFunctionsRef?: React.RefObject<{
    scrollToBottom?: (() => void) | undefined;
  }>;
  className?: string;
  style?: React.CSSProperties;
  renderTagsContent?: (item: TMessage) => React.ReactNode;
  renderOperationContent?: (
    item: TMessage,
    isLast: boolean,
    isFirst: boolean
  ) => React.ReactNode;
}

const datetimeFormat = "YYYY/MM/DD HH:mm:ss";
const ChatMessageList = (props: IProps) => {
  const {
    messages,
    isLoading,
    className,
    style,
    childrenFunctionsRef,
    renderTagsContent,
    renderOperationContent,
  } = props;

  const [loadingText, setLoadingText] = useState(".");

  const loadingStartedAtRef = useRef<Dayjs>();
  const listContainerRef = useRef<HTMLDivElement | null>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`chat.${key}`);

  useEffect(() => {
    if (childrenFunctionsRef?.current) {
      childrenFunctionsRef.current.scrollToBottom = scrollToBottom;
    }
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      loadingStartedAtRef.current = dayjs();
      const intervalText = setInterval(() => {
        setLoadingText((prev) => (prev === "..." ? "." : prev + "."));
      }, 500);

      return () => {
        clearInterval(intervalText);
      };
    } else {
      loadingStartedAtRef.current = undefined;
    }
  }, [isLoading]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // 先滚动到底部，再向上滚动 100px
      messagesEndRef.current.scrollIntoView();
      if (messagesEndRef.current.parentElement) {
        messagesEndRef.current.parentElement.scrollTop -= 120;
      }
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
          return (
            <List.Item
              style={{
                ...(isLast
                  ? {
                      minHeight:
                        (listContainerRef.current?.clientHeight ?? 80) - 8, // 32 is container's padding
                      alignItems: "flex-start",
                    }
                  : {}),
              }}
            >
              <List.Item.Meta
                avatar={
                  item.role === "ai" && (
                    <Avatar
                      style={{
                        border: "none",
                        background: "none",
                        width: 40,
                        height: 40,
                      }}
                      icon={<img src={VionaAvatar} />}
                    />
                  )
                }
                title={
                  item.role === "ai" && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 18 }}>
                        {`Viona, ${t("viona_intro_staff")}`}
                      </span>
                      <span className={styles.timestamp}>
                        {dayjs(item.updated_at).format(datetimeFormat)}
                      </span>
                    </div>
                  )
                }
                description={
                  <div
                    className={classnames(styles.messageContainer, {
                      [styles.lastMessage]: index === messages.length - 1,
                      [styles.user]: item.role === "user",
                    })}
                  >
                    <div className={styles.messageContent}>
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
                    </div>
                    {renderTagsContent?.(item)}
                    {renderOperationContent?.(item, isLast, isFirst)}
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessageList;
