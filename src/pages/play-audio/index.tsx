import voicePayload from "./voice_payload";
import usePlayAudio from "@/hooks/usePlayAudio";
const PlayAudio = () => {
  const { initAudio, playAudio, totalSeconds, currentSeconds, isPlaying } =
    usePlayAudio();

  return (
    <div>
      <div>{`${currentSeconds}/${totalSeconds}`}</div>
      <div>{isPlaying ? "playing" : "paused"}</div>
      <button
        onClick={() => {
          initAudio(voicePayload);
          playAudio();
        }}
      >
        play
      </button>
    </div>
  );
};

export default PlayAudio;
