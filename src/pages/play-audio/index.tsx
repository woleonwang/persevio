import voicePayload from "./voice_payload";
import usePlayAudio from "@/hooks/usePlayAudio";
const PlayAudio = () => {
  const { playBase64Audio, totalSeconds, currentSeconds, isPlaying } =
    usePlayAudio();

  return (
    <div>
      <div>{`${currentSeconds}/${totalSeconds}`}</div>
      <div>{isPlaying ? "playing" : "paused"}</div>
      <button onClick={() => playBase64Audio(voicePayload)}>play</button>
    </div>
  );
};

export default PlayAudio;
