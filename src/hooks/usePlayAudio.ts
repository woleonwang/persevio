import { message } from "antd";
import { useRef, useState } from "react";

const WebmMimePrefix = "GkXfo59ChoEBQveBAULyg";

const usePlayAudio = () => {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>();

  const playBase64Audio = (base64String: string) => {
    try {
      console.log("playBase64Audio", base64String.length);
      // 将 base64 字符串转换为二进制数据
      const binaryString = window.atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 创建 Blob 对象（假设是 webm 格式，与录音格式一致）
      const blob = new Blob([bytes], {
        type: binaryString.startsWith(WebmMimePrefix)
          ? "audio/webm;codecs=opus"
          : "audio/mp4",
      });
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = url;
      } else {
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
          setTotalSeconds(audio.duration);
        };

        audio.ontimeupdate = () => {
          setCurrentSeconds(audio.currentTime);
        };

        audio.onplaying = () => {
          setIsPlaying(true);
        };

        // 播放结束后清理 URL
        audio.onended = () => {
          console.log("playBase64Audio ended");
          URL.revokeObjectURL(url);
        };

        // 如果播放出错，也清理 URL
        audio.onerror = () => {
          console.log("playBase64Audio error");
          URL.revokeObjectURL(url);
          message.error("音频播放出错");
        };

        audioRef.current = audio;
      }
      const audio = audioRef.current;
      audio.play();
    } catch (error) {
      console.error("解析 base64 音频失败:", error);
      message.error("解析音频失败");
    }
  };

  return { playBase64Audio, totalSeconds, currentSeconds, isPlaying };
};

export default usePlayAudio;
