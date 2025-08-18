import React, { useState, useRef, useEffect } from "react";
import { Avatar, List, Input, Button, message } from "antd";
import classnames from "classnames";
import dayjs, { Dayjs } from "dayjs";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import "@mdxeditor/editor/style.css";

import { Get, Post } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import { IProps, TMessage, TMessageFromApi } from "./type";

import VionaAvatar from "@/assets/viona-avatar.png";
import UserAvatar from "@/assets/user-avatar.png";
import styles from "./style.module.less";
import BarsOutlined from "@ant-design/icons/lib/icons/BarsOutlined";

const datetimeFormat = "YYYY/MM/DD HH:mm:ss";

const ChatRoom: React.FC<IProps> = (props) => {
  const { jobId, sessionId } = props;

  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(".");
  const [preDefinedQuestionsVisible, setPreDefinedQuestionsVisible] =
    useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isCompositingRef = useRef(false);
  const needScrollToBottom = useRef(false);
  const loadingStartedAtRef = useRef<Dayjs>();
  const listContainerRef = useRef<HTMLDivElement | null>();

  const { t: originalT } = useTranslation();

  useEffect(() => {
    setMessages([]);
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
  }, [messages]);

  const t = (key: string) => {
    return originalT(`chat.${key}`);
  };

  const apiMapping: { get: string; send: string } = {
    get: `/api/public/jobs/${jobId}/candidate_chat/${sessionId}`,
    send: `/api/public/jobs/${jobId}/candidate_chat/${sessionId}/send`,
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

  const fetchMessages = async () => {
    const { code, data } = await Get(apiMapping.get);
    if (code === 0) {
      const messageHistory = formatMessages(data.messages);
      const isLoading = data.is_invoking === 1;
      setIsLoading(isLoading);

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

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // 先滚动到底部，再向上滚动 100px
      messagesEndRef.current.scrollIntoView();
      if (messagesEndRef.current.parentElement) {
        messagesEndRef.current.parentElement.scrollTop -= 120;
      }
    }
  };

  const formatMessages = (messages: TMessageFromApi[]): TMessage[] => {
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
          thinking: item.content.thinking ?? "",
          updated_at: item.updated_at,
          messageType: item.content.metadata.message_type || "normal",
          messageSubType: item.content.metadata.message_sub_type || "normal",
          extraTags: item.content.metadata.extra_tags || [],
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

    const { code } = await Post(apiMapping.send, {
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

  return (
    <div className={styles.container}>
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
                          (listContainerRef.current?.clientHeight ?? 80) - 8,
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
                          : `Viona, ${t("viona_intro_candidate")}`}
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
                              ? "Something wrong with Viona, please retry."
                              : item.content
                          }
                        />
                      )}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.preDefinedQuestionContainer}>
        <div
          className={classnames(styles.questionsContainer, {
            [styles.show]: preDefinedQuestionsVisible,
          })}
        >
          {PreDefinedMessages.slice(1).map((message) => {
            return (
              <div
                className={styles.messageCard}
                onClick={() => {
                  sendMessage(message);
                  setPreDefinedQuestionsVisible(false);
                }}
                key={message}
              >
                <div>{message}</div>
              </div>
            );
          })}
        </div>
        <div
          className={styles.messageCard}
          onClick={() => {
            sendMessage(PreDefinedMessages[0]);
            setPreDefinedQuestionsVisible(false);
          }}
        >
          <div>{PreDefinedMessages[0]}</div>
        </div>
        <div
          onClick={() =>
            setPreDefinedQuestionsVisible(!preDefinedQuestionsVisible)
          }
        >
          <Button
            size="large"
            variant="outlined"
            color="primary"
            icon={<BarsOutlined />}
          />
        </div>
      </div>

      <div className={styles.inputArea}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Input.TextArea
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            placeholder={t("reply_viona")}
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

          <div style={{ display: "flex", gap: 10 }}>
            <Button type="primary" onClick={submit} disabled={!canSubmit()}>
              {originalT("submit")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(ChatRoom);
