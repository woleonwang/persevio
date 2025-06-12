import { useEffect, useRef, useState } from "react";
import { StreamingTranscriber } from "assemblyai";
import RecordRTC from "recordrtc";
import { Post } from "@/utils/request";

const useAssembly = ({
  onPartialTextChange,
  onFinish,
}: {
  onPartialTextChange: (text: string) => void;
  onFinish: (text: string) => void;
}) => {
  const realtimeTranscriber = useRef<StreamingTranscriber>();
  const recorder = useRef<RecordRTC>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaStreamRef = useRef<MediaStream>();
  const isRecordingRef = useRef(false);
  isRecordingRef.current = isRecording;

  useEffect(() => {
    return () => {
      realtimeTranscriber.current?.close();
      endTranscription();
    };
  }, []);

  const startTranscription = async () => {
    setIsRecording(true);
    if (!realtimeTranscriber.current) {
      await initConnection();
    }

    if (!recorder.current) {
      await initWebRTC();
    }

    recorder.current?.startRecording();
  };

  const endTranscription = async () => {
    setIsRecording(false);
    recorder.current?.destroy();
    recorder.current = undefined;
    (mediaStreamRef.current?.getTracks() ?? []).forEach((track) =>
      track.stop()
    );
  };

  const initConnection = async () => {
    setIsConnecting(true);
    console.log("get token:", new Date().toISOString());
    const { code, data } = await Post("/api/candidate/assembly/token");
    console.log("got token:", new Date().toISOString());
    if (code !== 0 || !data.token) return;

    realtimeTranscriber.current = new StreamingTranscriber({
      token: data.token,
      sampleRate: 16000,
      formatTurns: true,
    });

    realtimeTranscriber.current.on("turn", (event) => {
      const { transcript, turn_is_formatted } = event;
      if (turn_is_formatted) {
        if (isRecordingRef.current) {
          onFinish(transcript + " ");
        }
      } else {
        if (!isRecordingRef.current) return;
        onPartialTextChange(transcript);
      }
    });

    realtimeTranscriber.current.on("error", (event) => {
      console.log(`12345 Connection error`);
      if (!realtimeTranscriber.current) return;

      console.error(event);
      realtimeTranscriber.current.close();
      realtimeTranscriber.current = undefined;
    });

    realtimeTranscriber.current.on("close", (code, reason) => {
      console.log(`12345 Connection closed: ${code} ${reason}`);
      realtimeTranscriber.current = undefined;
    });

    await realtimeTranscriber.current.connect();

    console.log("connected", new Date().toISOString());

    setIsConnecting(false);
  };

  const initWebRTC = async () => {
    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    // @ts-ignore
    recorder.current = RecordRTC(mediaStreamRef.current, {
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
        // console.log("send data:", buffer.byteLength);
        try {
          realtimeTranscriber.current?.sendAudio(buffer);
        } catch (e) {
          console.log("send data error:", e);
          realtimeTranscriber.current = undefined;
          endTranscription();
        }
      },
    });
  };
  return {
    startTranscription,
    endTranscription,
    isRecording,
    isConnecting,
  };
};

export default useAssembly;
