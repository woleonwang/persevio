import React, { useState, useEffect } from "react";
import { Avatar, List, Button, message } from "antd";
import { AudioMutedOutlined, AudioOutlined } from "@ant-design/icons";
import classnames from "classnames";
import dayjs from "dayjs";
import "@mdxeditor/editor/style.css";
import { v4 as uuidV4 } from "uuid";

import { Get } from "../../utils/request";

import VionaAvatar from "../../assets/viona-avatar.png";
import UserAvatar from "../../assets/user-avatar.png";
import styles from "./style.module.less";
import { TMessage, TMessageFromApi } from "../ChatRoom/type";

import { observer } from "mobx-react-lite";
import MarkdownContainer from "../MarkdownContainer";
import useAssemblyOffline from "@/hooks/useAssemblyOffline";

const datetimeFormat = "YYYY/MM/DD HH:mm:ss";

interface IProps {
  chatType:
    | "profile"
    | "deep_aspirations"
    | "job_interview"
    | "work_experience";
  jobApplyId?: number;
  onFinish?: () => void;
}

const ChatTypeMappings = {
  profile: "CANDIDATE_PROFILE_CHAT",
  deep_aspirations: "CANDIDATE_DEEP_CAREER_ASPIRATION_CHAT",
  job_interview: "CANDIDATE_JOB_INTERVIEW_CHAT",
  work_experience: "CANDIDATE_WORK_EXPERIENCE_CHAT",
};

const CandidateChatVoice: React.FC<IProps> = (props) => {
  const { chatType, jobApplyId } = props;
  const [messages, setMessages] = useState<TMessage[]>([]);

  const { isRecording, startTranscription, endTranscription } =
    useAssemblyOffline({
      onFinish: (result) => {
        sendMessage(result);
      },
    });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { code, data } = await Get(
      `/api/candidate/chat/${ChatTypeMappings[chatType]}${
        jobApplyId ? `/${jobApplyId}` : ""
      }/messages`
    );

    if (code === 0) {
      const messageHistory = formatMessages(data.messages);
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
        });
      }
    });

    return resultMessages;
  };

  const sendMessage = async (rawMessage: string) => {
    const formattedMessage = rawMessage.trim();
    setMessages([
      ...messages,
      {
        id: "fake_user_id",
        role: "user",
        content: formattedMessage,
        updated_at: dayjs().format(datetimeFormat),
      },
    ]);

    const uuid = uuidV4();
    const response = await fetch(
      `/api/candidate/chat/${ChatTypeMappings[chatType]}${
        jobApplyId ? `/${jobApplyId}` : ""
      }/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("candidate_token") ?? "",
        },
        body: JSON.stringify({
          content: formattedMessage,
          mode: "voice",
          uuid,
        }),
      }
    );

    const intervalId = setInterval(async () => {
      const { code, data } = await Get(`/api/candidate/voice_text/${uuid}`);
      if (code === 0) {
        setMessages((messages) => {
          return [
            ...messages,
            {
              id: "fake_ai_id",
              role: "ai",
              content: data.content,
              updated_at: dayjs().format(datetimeFormat),
            },
          ];
        });
      }
    }, 1000);

    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
    source.onended = () => {
      message.success("播放完毕");
      clearInterval(intervalId);
      fetchMessages();
    };
  };

  const startRecord = async () => {
    startTranscription();
  };

  const stopRecord = () => {
    endTranscription();
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
                    <MarkdownContainer
                      content={
                        item.messageSubType === "error"
                          ? "Something wrong with Viona, please retry."
                          : item.content
                      }
                    />
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>

      {
        <div className={styles.inputArea}>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div></div>
            <div style={{ display: "flex", gap: 10 }}>
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
      }
    </div>
  );
};

export default observer(CandidateChatVoice);
