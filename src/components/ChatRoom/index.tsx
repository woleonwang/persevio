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
import rehypeRaw from "rehype-raw";
import Icon from "../Icon";
import WriteJdIcon from "../../assets/icons/write-jd";
import WriteInterviewPlanIcon from "../../assets/icons/write-interview-plan";
import BagIcon from "../../assets/icons/bag";

type TMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
  messageType?: "normal" | "error";
  updated_at: string;
};

export type TChatType =
  | "jobRequirementDoc"
  | "candidate"
  | "jobDescription"
  | "jobInterviewPlan";

interface IProps {
  jobId: number;
  type: TChatType;
  sessionId?: string;
  onChangeType?: (type: TChatType) => void;
}

const ChatRoom: React.FC<IProps> = (props) => {
  const { jobId, type = "jobRequirementDoc", sessionId, onChangeType } = props;
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [loadingText, setLoadingText] = useState(".");
  const [job, setJob] = useState<IJob>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isCompositingRef = useRef(false);
  const recognitionRef = useRef<any>();
  const originalInputRef = useRef<string>("");
  const intervalFetchMessageRef = useRef<number>();

  useEffect(() => {
    const intervalText = setInterval(() => {
      setLoadingText((prev) => (prev === "..." ? "." : prev + "."));
    }, 500);

    return () => {
      clearInterval(intervalText);
      clearInterval(intervalFetchMessageRef.current);
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      intervalFetchMessageRef.current = setInterval(() => {
        fetchMessages();
      }, 3000);

      return () => {
        clearInterval(intervalFetchMessageRef.current);
      };
    }
  }, [isLoading]);

  useEffect(() => {
    fetchMessages();
  }, [jobId, type]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const apiMapping: Record<IProps["type"], { get: string; send: string }> = {
    jobRequirementDoc: {
      get: `/api/jobs/${jobId}/requirement_doc_chat`,
      send: `/api/jobs/${jobId}/requirement_doc_chat/send`,
    },
    jobDescription: {
      get: `/api/jobs/${jobId}/job_description_chat`,
      send: `/api/jobs/${jobId}/job_description_chat/send`,
    },
    jobInterviewPlan: {
      get: `/api/jobs/${jobId}/interview_plan_chat`,
      send: `/api/jobs/${jobId}/interview_plan_chat/send`,
    },
    candidate: {
      get: `/api/public/jobs/${jobId}/candidate_chat/${sessionId}`,
      send: `/api/public/jobs/${jobId}/candidate_chat/${sessionId}/send`,
    },
  };

  const fetchMessages = async () => {
    const { code, data } = await Get(apiMapping[type].get);
    if (code === 0) {
      const messageHistory = formatMessages(data.messages);
      const isLoading = data.is_invoking === 1;
      setIsLoading(isLoading);
      if (isLoading) {
        messageHistory.push({
          id: "fake_ai_id",
          role: "ai",
          content: "",
          updated_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        });
      }
      setMessages(messageHistory);
      setJob(data.job);
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
        metadata: {
          message_type: string;
          message_sub_type: "error";
        };
      };
      updated_at: string;
    }[]
  ): TMessage[] => {
    return messages.map((m) => ({
      id: m.id,
      role: m.content.role === "assistant" ? "ai" : "user",
      content: m.content.content || `&nbsp;`,
      updated_at: m.updated_at,
      messageType: m.content.metadata.message_sub_type || "normal",
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
      setIsLoading(true);
    }
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
                      <Markdown rehypePlugins={[rehypeRaw]}>
                        {item.messageType === "error"
                          ? "Something wrong with Viona, please retry."
                          : item.content}
                      </Markdown>
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
        <div style={{ marginBottom: 12, display: "flex", gap: 10 }}>
          {(type === "jobDescription" || type === "jobInterviewPlan") && (
            <Button
              type="default"
              shape="round"
              icon={<Icon icon={<BagIcon />} style={{ fontSize: 20 }} />}
              onClick={() => onChangeType?.("jobRequirementDoc")}
            >
              Write Requirement Document
            </Button>
          )}
          {!!job?.requirement_doc_id && (
            <>
              {type !== "jobDescription" && (
                <Button
                  type="default"
                  shape="round"
                  icon={
                    <Icon icon={<WriteJdIcon />} style={{ fontSize: 20 }} />
                  }
                  onClick={() => onChangeType?.("jobDescription")}
                >
                  Write Job Description
                </Button>
              )}
              {type !== "jobInterviewPlan" && (
                <Button
                  type="default"
                  shape="round"
                  icon={
                    <Icon
                      icon={<WriteInterviewPlanIcon />}
                      style={{ fontSize: 20 }}
                    />
                  }
                  onClick={() => onChangeType?.("jobInterviewPlan")}
                >
                  Write Interview Plan
                </Button>
              )}
            </>
          )}
          {!!job?.jd_doc_id && (
            <Button
              shape="round"
              onClick={async () => {
                const url = `${window.location.origin}/jobs/${job.id}/show`;
                await navigator.clipboard.writeText(url);
                message.success("Copied");
              }}
            >
              Copy Link
            </Button>
          )}
        </div>
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
