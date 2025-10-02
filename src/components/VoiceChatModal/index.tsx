import useVoice from "@/hooks/useVoiceChat";
import { Post } from "@/utils/request";
import { Button, message, Modal } from "antd";
import { useEffect, useRef, useState } from "react";

import {
  AudioMutedOutlined,
  AudioOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import VionaAvatar from "@/assets/viona-avatar-large.png";

const audioContext = new AudioContext({ sampleRate: 16000 });
const gain = audioContext.createGain();
gain.gain.value = 0.8;
gain.connect(audioContext.destination);

interface IProps {
  onClose: () => void;
  model: "qwen" | "chatgpt" | "gemini";
}

const VoiceChatModal: React.FC<IProps> = (props) => {
  const { onClose, model } = props;
  const [status, setStatus] = useState<
    "init" | "listening" | "waiting" | "speaking"
  >("init");
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [disabled, setDisabled] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());

  const lastAudioDataLengthRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const isAudioResponseDoneRef = useRef(true);
  const isInitintgConnectionRef = useRef(false);
  const isDestroyedRef = useRef(false);

  useEffect(() => {
    isDestroyedRef.current = false;
    initConnection();

    return () => {
      isDestroyedRef.current = true;
      // 停止所有正在播放的音频
      if (audioQueueRef.current.length > 0) {
        audioQueueRef.current.forEach((source) => {
          try {
            source.onended = null;
            source.stop();
          } catch (e) {
            // 忽略已停止的 source
          }
        });
        audioQueueRef.current = [];
      }
    };
  }, []);

  useVoice({
    onFinish: (result) => {
      sendMessageAudio(result);
    },
    disabled: disabled || status !== "listening",
  });

  const initConnection = async () => {
    if (model === "qwen") {
      setStatus("listening");
      setCurrentTime(Date.now());
      startTimeRef.current = Date.now();
      setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return;
    }

    if (isInitintgConnectionRef.current) return;
    isInitintgConnectionRef.current = true;

    const { code } = await Post("/api/candidate/voice_chat/session/start", {
      voice: "shimmer",
      model: model,
    });
    if (code === 0) {
      setStatus("listening");
      setCurrentTime(Date.now());
      startTimeRef.current = Date.now();
      setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    } else {
      message.error("对话初始化失败");
    }

    isInitintgConnectionRef.current = false;
  };

  const pollAudio = async () => {
    const { code, data } = await Post(
      "/api/candidate/voice_chat/session/poll",
      {
        offset: lastAudioDataLengthRef.current,
      }
    );
    if (isDestroyedRef.current) return;

    if (code === 0) {
      const audioData = (data.audio_data as string) ?? "";
      lastAudioDataLengthRef.current =
        lastAudioDataLengthRef.current + audioData.length;

      if (audioData.length > 0) {
        playPcmFromData(audioData);
      }

      // 大模型回复完毕，并且没有存货了，结束
      if (data.is_invoking === 0 && data.is_finished == 1) {
        isAudioResponseDoneRef.current = true;
      } else if (audioData.length === 0) {
        setTimeout(() => {
          pollAudio();
        }, 200);
      } else {
        pollAudio();
      }
    }
  };

  const playPcmFromData = async (base64Data: string) => {
    const buffer = base64ToArrayBuffer(base64Data);

    // 假设为 16bit 小端单声道 PCM
    const pcm16 = new Int16Array(buffer);
    const float32 = new Float32Array(pcm16.length);

    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }

    // 创建 AudioBuffer
    const audioBuffer = audioContext.createBuffer(1, float32.length, 24000); // 单声道，16kHz
    audioBuffer.copyToChannel(float32, 0);

    // 播放音频
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gain);
    source.onended = () => {
      audioQueueRef.current = audioQueueRef.current.slice(1);
      const nextNode = audioQueueRef.current[0];
      if (nextNode) {
        console.log("nextNode start");
        nextNode.start();
      } else if (isAudioResponseDoneRef.current) {
        setStatus("listening");
      }
    };
    audioQueueRef.current.push(source);
    if (audioQueueRef.current.length === 2) {
      try {
        setStatus("speaking");
        audioQueueRef.current[0].start();
      } catch (e) {
        // 忽略已停止的 source
      }
    }
  };

  function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64); // 解码 Base64 字符串
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
  }

  const sendMessageAudio = async (audioData: string) => {
    setStatus("waiting");
    const { code } = await Post("/api/candidate/voice_chat/session/audio", {
      audio_data: audioData,
      model: model,
    });

    if (code === 0) {
      isAudioResponseDoneRef.current = false;
      lastAudioDataLengthRef.current = 0;
      pollAudio();
    } else {
      setStatus("listening");
      message.error("Message Send Failed");
    }
  };

  const genRecordButtonAudio = () => {
    return disabled ? (
      <Button
        style={{
          width: 64,
          height: 64,
          backgroundColor: "#f1f1f1",
          border: "none",
          color: "rgb(224, 46, 42)",
        }}
        shape="circle"
        type="default"
        onClick={() => setDisabled(false)}
        icon={<AudioMutedOutlined style={{ fontSize: 36 }} />}
        iconPosition="start"
      />
    ) : (
      <Button
        style={{
          width: 64,
          height: 64,
          backgroundColor: "#f1f1f1",
          border: "none",
          color: "#1FAC6A",
        }}
        shape="circle"
        type="default"
        onClick={() => {
          setDisabled(true);
        }}
        icon={<AudioOutlined style={{ fontSize: 36 }} />}
        iconPosition="start"
      />
    );
  };

  const duration = Math.floor((currentTime - startTimeRef.current) / 1000);
  return (
    <div>
      <Modal
        onCancel={onClose}
        footer={null}
        open={true}
        width={1200}
        styles={{
          content: {
            height: 600,
          },
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 6,
              height: 6,
              backgroundColor: "red",
              borderRadius: 3,
              marginRight: 4,
            }}
          />
          {Math.floor(duration / 60) < 10 ? "0" : ""}
          {Math.floor(duration / 60)}:{duration % 60 < 10 ? "0" : ""}
          {duration % 60}
        </div>
        <div
          style={{
            height: 400,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={VionaAvatar}
            style={{ borderRadius: 150, width: 300, height: 300 }}
          />
        </div>
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {status === "init" && <div>创建会话中...</div>}
          {status === "listening" && <div>Viona 正在听...</div>}
          {status === "waiting" && <div>等待 Viona 说话...</div>}
          {status === "speaking" && <div>Viona 正在说话中...</div>}
        </div>
        {status !== "init" && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 40,
            }}
          >
            {genRecordButtonAudio()}
            <Button
              style={{
                width: 64,
                height: 64,
                color: "rgb(224, 46, 42)",
                backgroundColor: "#f1f1f1",
                border: "none",
              }}
              shape="circle"
              type="default"
              onClick={onClose}
              icon={<CloseOutlined style={{ fontSize: 24 }} />}
              iconPosition="start"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VoiceChatModal;
