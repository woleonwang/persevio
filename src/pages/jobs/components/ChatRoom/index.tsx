import React, { useState, useRef, useEffect } from "react";
import { Avatar, List, Input, Button, message } from "antd";
import Icon, {
  UserOutlined,
  RobotOutlined,
  AudioMutedOutlined,
  AudioOutlined,
} from "@ant-design/icons";
import { Get, Post } from "../../../../utils/request";
import Markdown from "react-markdown";
import styles from "./style.module.less";

type TMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
};

interface IProps {
  jobId: number;
}
const ChatRoom: React.FC<IProps> = (props) => {
  const { jobId } = props;
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isCompositingRef = useRef(false);
  const recognitionRef = useRef<any>();

  useEffect(() => {
    initMessages();
  }, [jobId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initMessages = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}/requirement_chat`);
    if (code === 0) {
      setMessages(formatMessages(data.messages));
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

  const submit = async () => {
    if (!inputValue || isLoading) return;

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

    const { code, data } = await Post(
      `/api/jobs/${jobId}/send_message_for_job_requirement_chat`,
      {
        content: inputValue,
      }
    );

    if (code === 0) {
      setMessages(formatMessages(data.messages));
    }

    setIsLoading(false);
  };

  const handleInputChange = (e) => {
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
                  <div style={{ color: "rgb(20, 20, 19)" }}>
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
          onPressEnter={() => {
            if (!isCompositingRef.current) {
              submit();
            }
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
          <Button
            type="primary"
            onClick={submit}
            disabled={!inputValue || isLoading}
          >
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
