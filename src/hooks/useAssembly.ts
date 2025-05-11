import { useEffect, useRef, useState } from "react";
import {
  FinalTranscript,
  PartialTranscript,
  RealtimeTranscriber,
  RealtimeTranscript,
} from "assemblyai/streaming";
import RecordRTC from "recordrtc";
import { Post } from "@/utils/request";

const useAssembly = ({
  onPartialTextChange,
  onFinish,
}: {
  onPartialTextChange: (text: string) => void;
  onFinish: (text: string) => void;
}) => {
  const realtimeTranscriber = useRef<RealtimeTranscriber>();
  const recorder = useRef<RecordRTC>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textsRef = useRef<Record<number, string>>({});
  const isRecordingRef = useRef(false);
  isRecordingRef.current = isRecording;

  useEffect(() => {
    return () => {
      realtimeTranscriber.current?.close();
      recorder.current?.destroy();
    };
  }, []);

  const startTranscription = async () => {
    setIsRecording(true);
    if (!realtimeTranscriber.current) {
      await initConnection();
    }

    if (recorder.current?.state === "paused") {
      recorder.current?.resumeRecording();
    } else {
      recorder.current?.startRecording();
    }
  };

  const endTranscription = async () => {
    setIsRecording(false);
    recorder.current?.pauseRecording();
  };

  const getTranscription = (transcript: RealtimeTranscript): string => {
    const texts = textsRef.current;
    let msg = "";
    texts[transcript.audio_start] = transcript.text;
    const keys = Object.keys(texts);
    keys.sort((a: string, b: string) => parseInt(a) - parseInt(b));
    for (const key of keys) {
      const intKey = parseInt(key);
      if (texts[intKey]) {
        msg += ` ${texts[intKey]}`;
      }
    }
    return msg;
  };

  const initConnection = async () => {
    setIsConnecting(true);
    const { code, data } = await Post("/api/candidate/assembly/token");
    if (code !== 0) return;

    realtimeTranscriber.current = new RealtimeTranscriber({
      token: data.token,
      sampleRate: 16000,
    });

    realtimeTranscriber.current.configureEndUtteranceSilenceThreshold;

    realtimeTranscriber.current.on(
      "transcript.partial",
      (transcript: PartialTranscript) => {
        if (!isRecordingRef.current) return;
        const msg = getTranscription(transcript);
        onPartialTextChange(msg);
      }
    );

    realtimeTranscriber.current.on(
      "transcript.final",
      (transcript: FinalTranscript) => {
        if (isRecordingRef.current) {
          const msg = getTranscription(transcript);
          onFinish(msg);
        }
        textsRef.current = {};
      }
    );

    realtimeTranscriber.current.on("error", (event) => {
      if (!realtimeTranscriber.current) return;

      console.error(event);
      realtimeTranscriber.current.close();
      realtimeTranscriber.current = undefined;
    });

    realtimeTranscriber.current.on("close", (code, reason) => {
      console.log(`Connection closed: ${code} ${reason}`);
      realtimeTranscriber.current = undefined;
      initConnection();
    });

    await realtimeTranscriber.current.connect();

    if (!recorder.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // @ts-ignore
      recorder.current = RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/webm;codecs=pcm",
        recorderType: RecordRTC.StereoAudioRecorder,
        timeSlice: 250,
        desiredSampRate: 16000,
        numberOfAudioChannels: 1,
        bufferSize: 4096,
        audioBitsPerSecond: 128000,
        ondataavailable: async (blob: Blob) => {
          if (!realtimeTranscriber.current) return;
          const buffer = await blob.arrayBuffer();
          console.log("send data:", buffer.byteLength);
          realtimeTranscriber.current?.sendAudio(buffer);
        },
      });
    }

    setIsConnecting(false);
  };

  return {
    startTranscription,
    endTranscription,
    isRecording,
    isConnecting,
  };
};

export default useAssembly;
