import React, { useState } from "react";

import {
  Participant,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
  TranscriptionSegment,
} from "livekit-client";
import styles from "./style.module.less";
import { Button, Input, message } from "antd";
import dayjs from "dayjs";
import { Get } from "@/utils/request";
import { jrd as jrdText, resume as resumeText } from "./consts";

const serverUrl = "wss://persevio-yitfnnaa.livekit.cloud";
// const token =
//   "eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoibWFydmluIiwidmlkZW8iOnsicm9vbSI6Im1lZXRpbmctcm9vbS1tYXJ2aW4iLCJyb29tSm9pbiI6dHJ1ZSwiY2FuUHVibGlzaCI6dHJ1ZSwiY2FuU3Vic2NyaWJlIjp0cnVlLCJjYW5QdWJsaXNoRGF0YSI6dHJ1ZSwiY2FuVXBkYXRlT3duTWV0YWRhdGEiOnRydWUsImhpZGRlbiI6ZmFsc2UsInJlY29yZGVyIjpmYWxzZX0sImlzcyI6IkFQSW00cGJVU25yZFhaQiIsImV4cCI6MTc2MTExMzM0NywibmJmIjowLCJzdWIiOiJ1c2VyLW1hcnZpbiJ9.L2To6GGVutSJ9Lqyo3K6Hlwx7b-M6PGud4YVXQBFrUI";
const LivekitVoiceChat: React.FC = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      content: string;
      timestamp: number;
    }[]
  >([]);
  const [jrd, setJrd] = useState(jrdText);
  const [resume, setResume] = useState(resumeText);
  const initConnection = async () => {
    const { code, data } = await Get("/api/public/live_kit/token");
    if (code === 0) {
      const token = data.token;
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      room.prepareConnection(serverUrl, token);

      room
        .on(RoomEvent.Connected, () => {
          console.log("房间连接成功");
        })
        .on(RoomEvent.Disconnected, () => {
          console.log("房间断开连接");
        })
        .on(
          RoomEvent.TrackSubscribed,
          (track: RemoteTrack, publication: RemoteTrackPublication) => {
            console.log("轨道订阅成功", track, publication);
            if (track.kind === Track.Kind.Audio) {
              track.attach();
            }
          }
        )
        .on(
          RoomEvent.TrackUnsubscribed,
          (track: RemoteTrack, publication: RemoteTrackPublication) => {
            console.log("轨道取消订阅成功", track, publication);
            track.detach();
          }
        )
        .on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
          console.log("活跃说话者", speakers);
          setIsSpeaking(speakers.length > 0);
        })
        .on(
          RoomEvent.TranscriptionReceived,
          (
            transcription: TranscriptionSegment[],
            participant?: Participant
          ) => {
            console.log("转录接收", transcription);
            if (
              participant &&
              transcription.length > 0 &&
              transcription[0].final
            ) {
              setMessages((prev) => [
                ...prev,
                {
                  role:
                    participant.identity === room.localParticipant.identity
                      ? "user"
                      : "assistant",
                  content: transcription[0].text,
                  timestamp: Date.now(),
                },
              ]);
            }
          }
        );

      await room.connect(serverUrl, token);

      await room.localParticipant.setMicrophoneEnabled(true);

      const info = await room.localParticipant.sendText(
        "## Resume\n\n" +
          resume +
          "\n\n" +
          "## Job Requirement Document\n\n" +
          jrd +
          "\n\n",
        {
          topic: "lk.chat",
        }
      );
      console.log("info", info);
    } else {
      message.error("连接失败");
    }
  };

  return (
    <div className={styles.container}>
      <div>
        <div>JRD</div>
        <Input.TextArea value={jrd} onChange={(e) => setJrd(e.target.value)} />
      </div>
      <div>
        <div>简历</div>
        <Input.TextArea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
        />
      </div>
      <div className={styles.header}>
        <Button onClick={initConnection}>开始</Button>
        <h2>LiveKit 语音对话: {isSpeaking ? "正在说话" : "未说话"}</h2>
      </div>
      <div className={styles.messages}>
        {messages.map((item, index) => (
          <div key={index}>
            <div>{item.role === "user" ? "You" : "Viona"}</div>
            <div>{item.content}</div>
            <div>{dayjs(item.timestamp).format("YYYY-MM-DD HH:mm:ss")}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LivekitVoiceChat;
