import React, { useState, useRef, useEffect } from "react";
import {
  Avatar,
  List,
  Input,
  Button,
  message,
  Tooltip,
  Spin,
  Select,
} from "antd";
import {
  AudioMutedOutlined,
  AudioOutlined,
  DeleteOutlined,
  EditOutlined,
  SendOutlined,
} from "@ant-design/icons";
import classnames from "classnames";
import dayjs, { Dayjs } from "dayjs";
import "@mdxeditor/editor/style.css";

import { Get, Post } from "../../utils/request";

import VionaAvatar from "../../assets/viona-avatar.png";
import UserAvatar from "../../assets/user-avatar.png";
import styles from "./style.module.less";
import { TExtraTagName, TMessage, TMessageFromApi } from "../ChatRoomNew/type";

import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import MarkdownContainer from "../MarkdownContainer";
import useAssemblyOffline from "@/hooks/useAssemblyOffline";
import ReactDOM from "react-dom";
import { ScaleLoader } from "react-spinners";
import VoiceChatModal from "../VoiceChatModal";
import { checkIsAdmin } from "@/utils";

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
  const {
    chatType,
    onFinish,
    jobApplyId,
    workExperienceCompanyName,
    candidate,
  } = props;
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(".");
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [inputPlaceholder, setInputPlaceholder] = useState("");
  const [audioHintVisible, setAudioHintVisible] = useState(false);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [model, setModel] = useState<"chatgpt" | "gemini">("chatgpt");
  // 最后一条消息的 id，用于控制新增消息的自动弹出
  const lastMessageIdRef = useRef<string>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isCompositingRef = useRef(false);

  const needScrollToBottom = useRef(false);
  const loadingStartedAtRef = useRef<Dayjs>();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`chat.${key}`);

  const {
    startTranscription,
    endTranscription,
    isRecording,
    volume,
    isTranscribing,
    isStartRecordingOutside,
  } = useAssemblyOffline({
    onFinish: (result) => {
      // console.log("handle result:", result);
      sendMessage(result);
    },
    disabled: isLoading,
  });

  useEffect(() => {
    needScrollToBottom.current = true;
    fetchMessages();

    setTimeout(() => setAudioHintVisible(true), 300);
    setTimeout(() => setAudioHintVisible(false), 5000);
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

  const isAdmin = checkIsAdmin(candidate);

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
      key: "network-profile-done",
      title: "完成对话",
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
      message.success("消息删除成功");
      fetchMessages();
    } else {
      message.error("消息删除失败");
    }
  };

  const genRecordButton = () => {
    return (
      <Tooltip
        styles={{
          body: {
            width: 400,
          },
        }}
        placement="top"
        title={
          "长按【Ctrl】键可直接与Viona对话（备注：连按两次 Ctrl 键即可快速启动录音，再单次按下则结束录音）"
        }
        open={audioHintVisible}
      >
        {!isRecording && !isTranscribing ? (
          <Button
            style={{
              width: 48,
              height: 48,
            }}
            shape="circle"
            type="primary"
            onClick={() => startTranscription()}
            icon={<AudioOutlined style={{ fontSize: 24 }} />}
            iconPosition="start"
          />
        ) : (
          <Button
            style={{
              width: 48,
              height: 48,
              backgroundColor: "rgba(224, 46, 42, 0.1)",
              color: "rgb(224, 46, 42)",
            }}
            shape="circle"
            type="primary"
            disabled={isTranscribing || !isStartRecordingOutside}
            onClick={() => endTranscription()}
            icon={<AudioMutedOutlined style={{ fontSize: 24 }} />}
            iconPosition="start"
          />
        )}
      </Tooltip>
    );
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
                      {item.role === "user" ? "You" : `Viona`}
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

                    {/* 删除按钮 - 只有非 fake 消息且为 AI 消息时才显示 */}
                    {item.id !== "fake_ai_id" && item.id !== "fake_user_id" && (
                      <div className={styles.operationArea}>
                        <Button.Group>
                          <Button
                            shape="round"
                            onClick={() => {
                              if (confirm("确定要删除这条消息吗？")) {
                                deleteMessage(parseInt(item.id));
                              }
                            }}
                            icon={<DeleteOutlined />}
                          />
                        </Button.Group>
                      </div>
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

      <div className={styles.inputArea}>
        <div className={classnames("flex-center")} style={{ marginTop: 12 }}>
          {genRecordButton()}

          {isAdmin && (
            <Button
              type="primary"
              onClick={() => setIsAudioMode(true)}
              style={{
                width: 48,
                height: 48,
                backgroundColor: "#f1f1f1",
                border: "3px solid #1FAC6A",
                color: "#1FAC6A",
                marginLeft: 12,
              }}
              shape="circle"
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon"
                >
                  <path d="M7.167 15.416V4.583a.75.75 0 0 1 1.5 0v10.833a.75.75 0 0 1-1.5 0Zm4.166-2.5V7.083a.75.75 0 0 1 1.5 0v5.833a.75.75 0 0 1-1.5 0ZM3 11.25V8.75a.75.75 0 0 1 1.5 0v2.5a.75.75 0 0 1-1.5 0Zm12.5 0V8.75a.75.75 0 0 1 1.5 0v2.5a.75.75 0 0 1-1.5 0Z"></path>
                </svg>
              }
            />
          )}

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
                    marginRight: 8,
                    marginLeft: 12,
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
            onCompositionStartCapture={() => (isCompositingRef.current = true)}
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
            id="message-textarea"
          />

          {textInputVisible && (
            <SendOutlined
              onClick={() => submit()}
              style={{ fontSize: 24, color: "#1FAC6A" }}
            />
          )}

          <Button
            style={{
              width: 48,
              height: 48,
              backgroundColor: "#f1f1f1",
              border: "3px solid #1FAC6A",
              color: "#1FAC6A",
              marginLeft: 12,
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

          {isAdmin && chatType === "network_profile" && (
            <Button
              type="primary"
              onClick={() => onFinish?.()}
              style={{ marginLeft: 12 }}
            >
              完成对话
            </Button>
          )}

          {isAdmin && (
            <Select
              value={model}
              onChange={(value: "chatgpt" | "gemini") => setModel(value)}
              options={[
                { label: "ChatGPT", value: "chatgpt" },
                { label: "Gemini", value: "gemini" },
              ]}
              popupMatchSelectWidth={false}
            />
          )}

          {isAudioMode && (
            <VoiceChatModal
              model={model}
              onClose={() => {
                setIsAudioMode(false);
                fetchMessages();
              }}
            />
          )}
        </div>
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
            {isRecording ? (
              <ScaleLoader
                color="#1FAC6A"
                height={75 * Math.min(1, volume * 3) + 5}
                width={10}
              />
            ) : (
              <Spin size="large" />
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default observer(CandidateChat);
