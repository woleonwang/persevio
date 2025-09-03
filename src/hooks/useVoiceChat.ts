import { useEffect, useRef } from "react";
import { message } from "antd";

const useVoiceChat = ({
  onFinish,
  disabled,
}: {
  onFinish: (text: string) => void;
  disabled?: boolean;
}) => {
  const disabledRef = useRef(false);
  disabledRef.current = disabled ?? false;

  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initConnectionRef = useRef(false);

  // 录音实例
  const mediaRecorderRef = useRef<MediaRecorder>();
  // 存放录音数据
  const audioChunksRef = useRef<Blob[]>([]);
  // stream 实例
  const streamRef = useRef<MediaStream>();
  // 是否开始录音
  const isRecordingRef = useRef(false);

  const volumeMonitorRef = useRef<
    Partial<{
      audioContext: AudioContext;
      analyser: AnalyserNode;
      animationFrameId: number;
    }>
  >({});

  useEffect(() => {
    if (!initConnectionRef.current) {
      initConnectionRef.current = true;
      initConnection();
    }

    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();

        clear();
      }
    };
  }, []);

  const clear = () => {
    // 清理 stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (volumeMonitorRef.current.animationFrameId) {
      cancelAnimationFrame(volumeMonitorRef.current.animationFrameId);
    }
    volumeMonitorRef.current.audioContext?.close();
    volumeMonitorRef.current.analyser?.disconnect();

    streamRef.current = undefined;
    mediaRecorderRef.current = undefined;
    volumeMonitorRef.current = {};
  };

  const initConnection = async () => {
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
      mimeType: "audio/webm;codec=Opus",
      audioBitsPerSecond: 8000,
    });

    const recorder = mediaRecorderRef.current;
    recorder.ondataavailable = (event) => {
      if (disabledRef.current) return;
      audioChunksRef.current.push(event.data);
      submit();
    };

    recorder.onstart = () => {
      console.log("on start");
    };

    recorder.onstop = () => {
      console.log("on stop");
    };

    const audioContext = new AudioContext();
    volumeMonitorRef.current.audioContext = audioContext;
    const source = audioContext.createMediaStreamSource(streamRef.current);
    const analyser = audioContext.createAnalyser();
    volumeMonitorRef.current.analyser = analyser;
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);

    const processAudio = () => {
      // 获取时域数据
      analyser.getByteTimeDomainData(dataArray);

      // 计算 RMS (Root Mean Square) 来表示音量
      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const amplitude = (dataArray[i] - 128) / 128.0; // 将 0-255 范围映射到 -1 到 1
        sumSquares += amplitude * amplitude;
      }
      const rms = disabledRef.current
        ? 0
        : Math.sqrt(sumSquares / dataArray.length);

      // RMS 值通常在 0 到 1 之间，0 表示没有声音，1 表示最大音量
      // 更新 ScaleLoading 的高度
      if (rms < 0.05) {
        if (isRecordingRef.current && !silenceTimeoutRef.current) {
          console.log("start silence timeout");
          silenceTimeoutRef.current = setTimeout(() => {
            silenceTimeoutRef.current = null;
            isRecordingRef.current = false;
            mediaRecorderRef.current?.stop();
          }, 2000);
        }
      } else {
        if (!isRecordingRef.current) {
          mediaRecorderRef.current?.start();
          isRecordingRef.current = true;
        }

        if (silenceTimeoutRef.current) {
          console.log("clear silence timeout");
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      }

      // 持续监听音频数据
      volumeMonitorRef.current.animationFrameId =
        requestAnimationFrame(processAudio);
    };

    processAudio();
  };

  const submit = async () => {
    if (audioChunksRef.current.length === 0) {
      message.error("No voice submitted.");
    } else {
      // 将 audioChunksRef.current（Blob 数组）合并为一个 Blob，然后转为 base64 字符串
      const mergedBlob = new Blob(audioChunksRef.current.slice(0, 1));
      const arrayBuffer = await mergedBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64String = window.btoa(binary);
      console.log("data length: ", base64String.length);
      if (base64String.length === 0) {
        message.error("No voice submitted.");
        return;
      }

      audioChunksRef.current = [];
      onFinish(base64String);
    }
  };

  return {
    isSpeaking: isRecordingRef.current,
  };
};

export default useVoiceChat;
