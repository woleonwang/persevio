import React, { useState, useRef, useEffect } from "react";
import { Avatar, List, Input, Button } from "antd";
import {
  UserOutlined,
  RobotOutlined,
  AudioMutedOutlined,
  AudioOutlined,
} from "@ant-design/icons";
import { Get, Post } from "../../utils/request";
import Markdown from "react-markdown";
import styles from "./style.module.less";

type TMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
};

interface IProps {
  jobId: number;
  type: "job_requirement" | "candidate";
  sessionId?: string;
}

const ChatRoom: React.FC<IProps> = (props) => {
  const { jobId, type = "job_requirement", sessionId } = props;
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isCompositingRef = useRef(false);
  const recognitionRef = useRef<any>();

  useEffect(() => {
    fetchMessages();
  }, [jobId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const apiMapping: Record<IProps["type"], { get: string; send: string }> = {
    job_requirement: {
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
      setMessages(
        type === "job_requirement"
          ? [
              ...formatMessages(data.context.messages),
              ...formatMessages(data.requirement.messages),
            ]
          : formatMessages(data.messages)
      );
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const formatMessages = (
    messages: {
      id: string;
      content: { content: string; role: "user" | "assistant" };
    }[]
  ): TMessage[] => {
    return messages.map((m) => ({
      id: m.id,
      role: m.content.role === "assistant" ? "ai" : "user",
      content: m.content.content,
    }));
  };

  const canSubmit = () => {
    return inputValue && !isLoading && !isCompositingRef.current;
  };

  const submit = async () => {
    if (!canSubmit()) return;

    setIsLoading(true);
    setInputValue("");

    setMessages([
      ...messages,
      {
        id: "fake_user_id",
        role: "user",
        content: inputValue,
      },
      {
        id: "fake_ai_id",
        role: "ai",
        content: "...",
      },
    ]);

    stopRecord();

    const { code } = await Post(apiMapping[type].send, {
      content: inputValue,
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
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        console.log(event);
        let result = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          result += event.results[i][0].transcript ?? "";
        }
        setInputValue((input) => input + result);
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
    recognitionRef.current?.start();
  };

  const stopRecord = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className={styles.container}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <List
          dataSource={messages}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={
                      item.role === "user" ? (
                        <UserOutlined />
                      ) : (
                        <RobotOutlined />
                      )
                    }
                  />
                }
                title={<span>{item.role === "user" ? "You" : "Viona"}</span>}
                description={
                  <div className={styles.markdownContainer}>
                    <Markdown>{item.content}</Markdown>
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
          placeholder="Enter message"
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
  );
};

export default ChatRoom;
