import useRecorder from "@/hooks/useRecorder";
import { Get, Post } from "@/utils/request";
import { Button, message } from "antd";
import { useRef, useState } from "react";

const audioContext = new AudioContext({ sampleRate: 24000 });
const gain = audioContext.createGain();
gain.gain.value = 0.8;
gain.connect(audioContext.destination);
const VoiceChat = () => {
  const pcmDataRef = useRef<string>("");
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const [isStart, setIsStart] = useState(false);
  const [isResponse, setIsResponse] = useState(false);

  const { start, stop, isRecording } = useRecorder({
    onAudioData: (buffer) => {
      let binary = "";
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      pcmDataRef.current = pcmDataRef.current + window.btoa(binary);
    },
  });

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
        nextNode.start();
      } else {
        setIsResponse(false);
      }
    };
    audioQueueRef.current.push(source);
    if (audioQueueRef.current.length === 1) {
      source.start();
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

  return (
    <div>
      {!isStart && (
        <Button
          onClick={async () => {
            const { code } = await Post("/api/candidate/voice_chat/start", {
              payload: pcmDataRef.current,
            });

            if (code === 0) {
              setIsStart(true);
            }
          }}
        >
          开始对话
        </Button>
      )}

      {!!isStart &&
        (isRecording ? (
          <Button
            onClick={async () => {
              stop();
              const { code } = await Post("/api/candidate/voice_chat/send", {
                payload: pcmDataRef.current,
              });
              if (code === 0) {
                message.success("Message Send");

                setIsResponse(true);
                const intervalId = setInterval(async () => {
                  const { code, data } = await Get(
                    "/api/candidate/voice_chat/message"
                  );

                  if (code === 0) {
                    if (data.payload) {
                      playPcmFromData(data.payload);
                    }
                    if (data.status === "IDLE") {
                      clearInterval(intervalId);
                    }
                  }
                }, 1000);
              }
            }}
          >
            停止录音
          </Button>
        ) : (
          <Button onClick={() => start()} disabled={isResponse}>
            开始录音
          </Button>
        ))}
    </div>
  );
};

export default VoiceChat;
