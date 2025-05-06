import { useRef, useState } from "react";
import { RealtimeTranscriber, RealtimeTranscript } from "assemblyai/streaming";
import RecordRTC from "recordrtc";
import { Post } from "@/utils/request";

const useAssembly = ({
  onTextChange,
}: {
  onTextChange: (text: string) => void;
}) => {
  const realtimeTranscriber = useRef<RealtimeTranscriber>();
  const recorder = useRef<RecordRTC>();
  const [isRecording, setIsRecording] = useState(false);

  const startTranscription = async () => {
    const { code, data } = await Post("/api/candidate/assembly/token");
    if (code !== 0) return;

    realtimeTranscriber.current = new RealtimeTranscriber({
      token: data.token,
      sampleRate: 16000,
    });

    const texts: Record<number, string> = {};
    realtimeTranscriber.current.on(
      "transcript",
      (transcript: RealtimeTranscript) => {
        console.log("transcript:", transcript);
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
        onTextChange(msg);
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
    });

    console.log("start time:", Date.now());
    await realtimeTranscriber.current.connect();
    console.log("connected time:", Date.now());

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
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
            realtimeTranscriber.current.sendAudio(buffer);
          },
        });

        recorder.current?.startRecording();
      })
      .catch((err) => console.error(err));

    setIsRecording(true);
  };

  const endTranscription = async () => {
    setIsRecording(false);
    if (!realtimeTranscriber.current) return;
    await realtimeTranscriber.current.close();
    realtimeTranscriber.current = undefined;

    if (!recorder.current) return;
    recorder.current.destroy();
    recorder.current = undefined;
  };

  return {
    startTranscription,
    endTranscription,
    isRecording,
  };
};

export default useAssembly;
