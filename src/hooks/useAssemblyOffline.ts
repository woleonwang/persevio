import { useEffect, useRef, useState } from "react";
import { Post } from "@/utils/request";
import { message } from "antd";

const useAssemblyOffline = ({
  onFinish,
}: {
  onFinish: (text: string) => void;
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  isRecordingRef.current = isRecording;
  // 录音实例
  const mediaRecorderRef = useRef<MediaRecorder>();
  // 存放录音数据
  const audioChunksRef = useRef<Blob[]>([]);
  // stream 实例
  const streamRef = useRef<MediaStream>();

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
  }, [isRecording, onFinish]);

  const startTranscription = async () => {
    await initConnection();
    audioChunksRef.current = [];
    mediaRecorderRef.current?.start();
    setIsRecording(true);
  };

  const endTranscription = async () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
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
      audioChunksRef.current.push(event.data);
    };

    recorder.onstart = () => {
      console.log("Recording started");
    };

    recorder.onstop = async () => {
      // INSERT_YOUR_CODE
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
      // const transcript = await client.transcripts.transcribe({
      //   audio: audioBlob,
      // });
      const { code, data } = await Post("/api/candidate/stt/send", {
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

      // 清理 stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  };

  return {
    startTranscription,
    endTranscription,
    isRecording,
  };
};

export default useAssemblyOffline;
