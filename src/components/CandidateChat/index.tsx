import React, { useState, useRef, useEffect } from "react";
import { Avatar, List, Input, Button } from "antd";
import {
  AudioMutedOutlined,
  AudioOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import classnames from "classnames";
import dayjs, { Dayjs } from "dayjs";
import "@mdxeditor/editor/style.css";

import type { TextAreaRef } from "antd/es/input/TextArea";

import { Get, Post } from "../../utils/request";

import VionaAvatar from "../../assets/viona-avatar.png";
import UserAvatar from "../../assets/user-avatar.png";
import styles from "./style.module.less";
import { TExtraTagName, TMessage, TMessageFromApi } from "../ChatRoom/type";

import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import MarkdownContainer from "../MarkdownContainer";
import useAssembly from "@/hooks/useAssembly";

const datetimeFormat = "YYYY/MM/DD HH:mm:ss";

type TSupportTag = {
  key: TExtraTagName;
  title: string;
  handler: (tag?: { name: string; content: string }) => void;
  autoTrigger?: boolean;
};

interface IProps {
  chatType: "profile" | "deep_aspirations" | "job_interview";
  jobApplyId?: number;
  onFinish?: () => void;
}

const ChatTypeMappings = {
  profile: "CANDIDATE_PROFILE_CHAT",
  deep_aspirations: "CANDIDATE_DEEP_CAREER_ASPIRATION_CHAT",
  job_interview: "CANDIDATE_JOB_INTERVIEW_CHAT",
};

const CandidateChat: React.FC<IProps> = (props) => {
  const { chatType, onFinish, jobApplyId } = props;
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecordingZh, setIsRecordingZh] = useState(false);
  const [loadingText, setLoadingText] = useState(".");

  // 最后一条消息的 id，用于控制新增消息的自动弹出
  const lastMessageIdRef = useRef<string>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isCompositingRef = useRef(false);
  const recognitionRef = useRef<any>();
  const originalInputRef = useRef<string>("");
  const isRecordingRef = useRef(false);
  isRecordingRef.current = isRecordingZh;
  const textInstanceRef = useRef<TextAreaRef | null>();

  const needScrollToBottom = useRef(false);
  const loadingStartedAtRef = useRef<Dayjs>();

  const { t: originalT, i18n } = useTranslation();
  const t = (key: string) => originalT(`chat.${key}`);

  const {
    isConnecting,
    isRecording: isRecordingEn,
    startTranscription,
    endTranscription,
  } = useAssembly({
    onPartialTextChange: (result) => {
      setInputValue(originalInputRef.current + result);
    },
    onFinish: (result) => {
      originalInputRef.current = originalInputRef.current + result;
      setInputValue(originalInputRef.current);
    },
  });

  const isRecording = i18n.language === "zh-CN" ? isRecordingZh : isRecordingEn;

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

  const supportTags: TSupportTag[] = [
    {
      key: "interview-done",
      title: "",
      handler: () => onFinish?.(),
      autoTrigger: true,
    },
  ];

  const fetchMessages = async () => {
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

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
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

    stopRecord();

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

    Post(
      `/api/candidate/chat/${ChatTypeMappings[chatType]}${
        jobApplyId ? `/${jobApplyId}` : ""
      }/send`,
      {
        content: formattedMessage,
        metadata: metadata,
      }
    );
  };

  const startRecord = async () => {
    if (i18n.language === "en-US") {
      startTranscription();
    } else {
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
          setIsRecordingZh(false);
        };
        recognition.onerror = () => {
          console.log("error");
        };
        recognitionRef.current = recognition;
      }

      setIsRecordingZh(true);
      recognitionRef.current?.start();
    }
    originalInputRef.current = inputValue;
    textInstanceRef.current?.focus();
  };

  const stopRecord = () => {
    if (i18n.language === "en-US") {
      endTranscription();
    } else {
      recognitionRef.current?.stop();
      setIsRecordingZh(false);
    }
    originalInputRef.current = "";
  };

  return (
    <div className={styles.container}>
      <div className={styles.listArea}>
        <List
          dataSource={messages}
          split={false}
          renderItem={(item, index) => (
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
                      {item.role === "user" ? "You" : `Viona, AI Recruiter`}
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

                    {(() => {
                      const visibleTags = (item.extraTags ?? [])
                        .map((extraTag) => {
                          return supportTags.find(
                            (tag) => tag.key === extraTag.name && tag.title
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
                  </div>
                }
              />
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </div>

      {
        <div className={styles.inputArea}>
          <Input.TextArea
            ref={(element) => (textInstanceRef.current = element)}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (isRecording) {
                originalInputRef.current = e.target.value;
              }
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

              <Button
                type="primary"
                danger={isRecording}
                shape="circle"
                disabled={isRecording && isConnecting}
                icon={
                  isRecording && isConnecting ? (
                    <LoadingOutlined spin />
                  ) : isRecording ? (
                    <AudioMutedOutlined />
                  ) : (
                    <AudioOutlined />
                  )
                }
                onClick={isRecording ? stopRecord : startRecord}
              />
            </div>
          </div>
        </div>
      }
    </div>
  );
};

export default observer(CandidateChat);
