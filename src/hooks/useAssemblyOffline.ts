import { useEffect, useRef, useState } from "react";
import { Post } from "@/utils/request";
import { message } from "antd";

const useAssemblyOffline = ({
  onFinish,
  disabled,
}: {
  onFinish: (text: string) => void;
  disabled?: boolean;
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const isRecordingRef = useRef(false);
  isRecordingRef.current = isRecording;
  // 录音实例
  const mediaRecorderRef = useRef<MediaRecorder>();
  // 存放录音数据
  const audioChunksRef = useRef<Blob[]>([]);
  // stream 实例
  const streamRef = useRef<MediaStream>();

  const volumeMonitorRef = useRef<
    Partial<{
      audioContext: AudioContext;
      analyser: AnalyserNode;
      animationFrameId: number;
    }>
  >({});

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && !isRecording) {
        startTranscription();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control" && isRecording) {
        endTranscription();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isRecording, onFinish, disabled]);

  const startTranscription = async () => {
    if (disabled) return;

    setIsRecording(true);
    await initConnection();
    audioChunksRef.current = [];
    mediaRecorderRef.current?.start();
  };

  const endTranscription = async () => {
    mediaRecorderRef.current?.stop();
    clear();
    setIsRecording(false);
  };

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

    if (!isRecordingRef.current) {
      clear();
      return;
    }

    mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
      mimeType: "audio/webm;codec=Opus",
      audioBitsPerSecond: 8000,
    });
    const recorder = mediaRecorderRef.current;

    recorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    recorder.onstart = () => {
      console.log("Recording started");
    };

    recorder.onstop = async () => {
      console.log("length:", audioChunksRef.current.length);
      if (audioChunksRef.current.length === 0) {
        message.error("No voice recorded.");
      } else {
        // 将 audioChunksRef.current（Blob 数组）合并为一个 Blob，然后转为 base64 字符串
        const mergedBlob = new Blob(audioChunksRef.current);
        const arrayBuffer = await mergedBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64String = window.btoa(binary);

        console.log("data length: ", base64String.length);
        console.log("start:", new Date().toISOString());

        if (base64String.length === 0) {
          message.error("No voice recorded.");
          return;
        }
        setIsTranscribing(true);
        const { code, data } = await Post("/api/stt/send", {
          payload: base64String,
        });
        if (code === 0) {
          console.log("end:", new Date().toISOString());
          console.log("finished, result is: ");
          console.log(data.result);
          onFinish(data.result ?? "");
        } else {
          message.error("Transcription failed, please try again.");
        }
        setIsTranscribing(false);
      }
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
      const rms = Math.sqrt(sumSquares / dataArray.length);

      // RMS 值通常在 0 到 1 之间，0 表示没有声音，1 表示最大音量

      // 更新 ScaleLoading 的高度
      setVolume(rms);

      // 持续监听音频数据
      volumeMonitorRef.current.animationFrameId =
        requestAnimationFrame(processAudio);
    };

    processAudio();
  };

  return {
    startTranscription,
    endTranscription,
    isRecording,
    isTranscribing,
    volume,
  };
};

export default useAssemblyOffline;
