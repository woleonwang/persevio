import { useEffect, useRef, useState } from "react";

import { AssemblyAI } from "assemblyai";

const client = new AssemblyAI({
  apiKey: "d708a718408d4c718c165013ee1365a4", // 替换成你的 AssemblyAI API Key
});
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
    mediaRecorderRef.current = new MediaRecorder(stream);
    const recorder = mediaRecorderRef.current;

    recorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    recorder.onstart = () => {
      console.log("Recording started");
    };

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      console.log("data length: ", audioBlob.size);
      const transcript = await client.transcripts.transcribe({
        audio: audioBlob,
      });
      console.log("finished, result is: ");
      console.log(transcript.text);
      onFinish(transcript.text ?? "");
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
