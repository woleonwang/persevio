import { message } from "antd";
import { useEffect, useRef, useState } from "react";

const WebmMimePrefix = "GkXfo59ChoEBQveBAULyg";

const usePlayAudio = () => {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>();
  const urlRef = useRef<string>("");

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
      }
    };
  }, []);

  const playAudio = () => {
    if (isPlaying) return;
    audioRef.current?.play();
  };

  const pauseAudio = () => {
    if (!isPlaying) return;
    audioRef.current?.pause();
  };

  const setCurrentTime = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
  };

  const initAudio = (base64String: string) => {
    try {
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
      urlRef.current = url;

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

      audio.onpause = () => {
        setIsPlaying(false);
      };

      // 播放结束后清理 URL
      audio.onended = () => {
        console.log("playBase64Audio ended");
        setIsPlaying(false);
        audio.currentTime = 0;
      };

      // 如果播放出错，也清理 URL
      audio.onerror = (e) => {
        console.log("playBase64Audio error");
        URL.revokeObjectURL(url);
        console.error("音频播放出错: " + e.toString());
      };

      audioRef.current = audio;
    } catch (error) {
      console.error("解析 base64 音频失败:", error);
      message.error("解析音频失败");
    }
  };

  return {
    initAudio,
    playAudio,
    pauseAudio,
    setCurrentTime,
    totalSeconds: totalSeconds,
    currentSeconds: currentSeconds,
    isPlaying,
  };
};

export default usePlayAudio;
