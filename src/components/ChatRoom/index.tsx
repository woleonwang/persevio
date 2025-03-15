import React, { useState, useRef, useEffect } from "react";
import { Avatar, List, Input, Button, Upload, message } from "antd";
import { AudioMutedOutlined, AudioOutlined } from "@ant-design/icons";
import { Get, Post, PostFormData } from "../../utils/request";
import Markdown from "react-markdown";
import VionaAvatar from "../../assets/viona-avatar.png";
import UserAvatar from "../../assets/user-avatar.png";
import styles from "./style.module.less";
import dayjs from "dayjs";
import { UploadChangeParam, UploadFile } from "antd/es/upload";

type TMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
  updated_at: string;
};

interface IProps {
  jobId: number;
  type: "job_chat" | "candidate";
  jobName?: string;
  sessionId?: string;
}

const ChatRoom: React.FC<IProps> = (props) => {
  const { jobId, jobName, type = "job_chat", sessionId } = props;
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [loadingText, setLoadingText] = useState(".");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isCompositingRef = useRef(false);
  const recognitionRef = useRef<any>();
  const originalInputRef = useRef<string>("");

  useEffect(() => {
    const interval = setInterval(() => {
      if (isLoading) {
        setLoadingText((prev) => (prev === "..." ? "." : prev + "."));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    fetchMessages();
  }, [jobId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const apiMapping: Record<IProps["type"], { get: string; send: string }> = {
    job_chat: {
      get: `/api/jobs/${jobId}/chat`,
      send: `/api/jobs/${jobId}/chat/send`,
    },
    candidate: {
      get: `/api/public/jobs/${jobId}/candidate_chat/${sessionId}`,
      send: `/api/public/jobs/${jobId}/candidate_chat/${sessionId}/send`,
    },
  };

  const fetchMessages = async () => {
    const { code, data } = await Get(apiMapping[type].get);
    if (code === 0) {
      const messageHistory =
        type === "job_chat"
          ? [
              ...formatMessages(data.context.messages),
              ...formatMessages(data.requirement.messages),
              ...formatMessages(data.jd.messages),
              ...formatMessages(data.interview_plan.messages),
            ]
          : formatMessages(data.messages);

      setMessages(messageHistory);

      if (messageHistory.length === 0 && type === "job_chat") {
        sendMessage(`I want to create a job named ${jobName}`);
      }
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  };

  const formatMessages = (
    messages: {
      id: string;
      content: {
        content: string;
        role: "user" | "assistant";
      };
      updated_at: string;
    }[]
  ): TMessage[] => {
    return messages.map((m) => ({
      id: m.id,
      role: m.content.role === "assistant" ? "ai" : "user",
      content: m.content.content,
      updated_at: m.updated_at,
    }));
  };

  const canSubmit = () => {
    return inputValue && !isLoading && !isCompositingRef.current;
  };

  const submit = async () => {
    if (!canSubmit()) return;

    stopRecord();

    setInputValue("");

    await sendMessage(inputValue);
  };

  const sendMessage = async (message: string) => {
    setIsLoading(true);

    setMessages([
      ...messages,
      {
        id: "fake_user_id",
        role: "user",
        content: message,
        updated_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      },
      {
        id: "fake_ai_id",
        role: "ai",
        content: "",
        updated_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      },
    ]);

    const { code } = await Post(apiMapping[type].send, {
      content: message,
    });

    if (code === 0) {
      fetchMessages();
    }

    setIsLoading(false);
  };

  const handleInputChange = (e: any) => {
    setInputValue(e.target.value);
  };

  const startRecord = async () => {
    if (!recognitionRef.current) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      //@ts-ignore
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        console.log(event);
        let result = "";
        let isFinal = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          result += event.results[i][0].transcript ?? "";
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }
        setInputValue(originalInputRef.current + result);
        if (isFinal) {
          console.log("is final: ", originalInputRef.current + result);
          originalInputRef.current += result;
        }
      };
      recognition.onend = () => {
        console.log("end");
        setIsRecording(false);
      };
      recognition.onerror = () => {
        console.log("error");
      };
      recognitionRef.current = recognition;
    }

    setIsRecording(true);
    originalInputRef.current = inputValue;
    recognitionRef.current?.start();
  };

  const stopRecord = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const uploadPdf = async (fileInfo: UploadChangeParam<UploadFile<any>>) => {
    const file = fileInfo.file;

    if (file && !file.status) {
      const isPDF = file.type === "application/pdf";
      if (!isPDF) {
        message.error("You can only upload PDF file!");
        return;
      }

      const formData = new FormData();
      formData.append("file", file as any);
      const { code } = await PostFormData(
        `/api/public/jobs/${jobId}/candidate_chat/${sessionId}/upload_attachment/pdf`,
        formData
      );

      if (code === 0) {
        message.success("Upload succeed");
      } else {
        message.error("Upload failed");
      }
    }
  };

  const uploadDocx = async (fileInfo: UploadChangeParam<UploadFile<any>>) => {
    const file = fileInfo.file;

    if (file && !file.status) {
      const isDocx =
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (!isDocx) {
        message.error("You can only upload Docx file!");
        return;
      }

      const formData = new FormData();
      formData.append("file", file as any);
      const { code } = await PostFormData(
        `/api/public/jobs/${jobId}/candidate_chat/${sessionId}/upload_attachment/docx`,
        formData
      );

      if (code === 0) {
        message.success("Upload succeed");
      } else {
        message.error("Upload failed");
      }
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <List
          dataSource={messages}
          split={false}
          renderItem={(item) => (
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
                      {item.role === "user" ? "You" : "Viona"}
                    </span>
                    <span
                      style={{
                        color: "#999999",
                        marginLeft: 8,
                        fontSize: 14,
                        fontWeight: "normal",
                      }}
                    >
                      {dayjs(item.updated_at).format("HH:mm")}
                    </span>
                  </div>
                }
                description={
                  <div className={styles.markdownContainer}>
                    {item.id === "fake_ai_id" ? (
                      <p>{loadingText}</p>
                    ) : (
                      <Markdown>{item.content}</Markdown>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: "16px", borderTop: "1px solid #f0f0f0" }}>
        <Input.TextArea
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Reply to Viona"
          style={{
            width: "100%",
            marginRight: "8px",
            resize: "none",
          }}
          onCompositionStart={() => {
            isCompositingRef.current = true;
          }}
          onCompositionEnd={() => {
            isCompositingRef.current = false;
          }}
          onPressEnter={(e) => {
            e.preventDefault();
            submit();
          }}
          rows={4}
        />
        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 10,
            justifyContent: "space-between",
          }}
        >
          <Button type="primary" onClick={submit} disabled={!canSubmit()}>
            Send
          </Button>

          <div style={{ display: "flex", gap: 10 }}>
            {type === "candidate" && (
              <>
                <Upload
                  beforeUpload={() => false}
                  onChange={(fileInfo) => uploadDocx(fileInfo)}
                  showUploadList={false}
                  accept=".docx"
                  multiple={false}
                >
                  <Button type="primary">DOCX</Button>
                </Upload>

                <Upload
                  beforeUpload={() => false}
                  onChange={(fileInfo) => uploadPdf(fileInfo)}
                  showUploadList={false}
                  accept=".pdf"
                  multiple={false}
                >
                  <Button type="primary">PDF</Button>
                </Upload>
              </>
            )}

            <Button
              type="primary"
              danger={isRecording}
              shape="circle"
              icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
              onClick={isRecording ? stopRecord : startRecord}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
