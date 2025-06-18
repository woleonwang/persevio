import { useEffect, useRef, useState } from "react";

// import { AssemblyAI } from "assemblyai";
import { Post } from "@/utils/request";

// const client = new AssemblyAI({
//   apiKey: "d708a718408d4c718c165013ee1365a4", // 替换成你的 AssemblyAI API Key
// });
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

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
    };
  }, []);

  const startTranscription = async () => {
    setIsRecording(true);
    if (!mediaRecorderRef.current) {
      await initConnection();
    }
    audioChunksRef.current = [];
    mediaRecorderRef.current?.start();
  };

  const endTranscription = async () => {
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  };

  const initConnection = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: "audio/webm",
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
      const mergedBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
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
      const { data } = await Post("/api/candidate/stt/send", {
        payload: base64String,
      });
      console.log("end:", new Date().toISOString());
      console.log("finished, result is: ");
      console.log(data.result);
      onFinish(data.result ?? "");
      // 清理 stream tracks
      // stream.getTracks().forEach((track) => track.stop());
    };
  };

  return {
    startTranscription,
    endTranscription,
    isRecording,
  };
};

export default useAssemblyOffline;
