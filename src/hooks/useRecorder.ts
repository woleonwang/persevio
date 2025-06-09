import { useRef, useState } from "react";

interface IParams {
  onAudioData: (data: ArrayBuffer) => void;
}
const useRecorder = (params: IParams) => {
  const { onAudioData } = params;
  const [isRecording, setIsRecording] = useState(false);

  const mediaStreamRef = useRef<MediaStream>();
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode>();
  const audioContextRef = useRef<AudioContext>();
  const pcmNodeRef = useRef<AudioWorkletNode>();

  const start = async () => {
    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    audioContextRef.current = new AudioContext({ sampleRate: 24000 }); // Ensure 24kHz sample rate
    const audioContext = audioContextRef.current;

    // Register the AudioWorkletProcessor
    await audioContext.audioWorklet.addModule("/pcm-processor.js");
    mediaStreamSourceRef.current = audioContext.createMediaStreamSource(
      mediaStreamRef.current
    );

    pcmNodeRef.current = new AudioWorkletNode(audioContext, "pcm-processor");
    const pcmNode = pcmNodeRef.current;

    pcmNode.port.onmessage = (event) => {
      console.log("event data:", event.data);
      console.log("length:", event.data.length);

      onAudioData?.(event.data);
    };

    mediaStreamSourceRef.current.connect(pcmNode);
    pcmNode.connect(audioContext.destination);

    console.log("Recording started...");

    setIsRecording(true);
  };

  const stop = async () => {
    setIsRecording(false);

    mediaStreamSourceRef.current?.disconnect();

    if (pcmNodeRef.current) {
      const pcmNode = pcmNodeRef.current;
      pcmNode.port.postMessage("STOP"); // Send STOP message to the processor
      pcmNode.port.onmessage = null; // Remove the event listener
      pcmNode.disconnect();
    }

    if (audioContextRef.current) {
      await audioContextRef.current.close();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    console.log("Recording stopped...");
  };

  return {
    start,
    stop,
    isRecording,
  };
};

export default useRecorder;
