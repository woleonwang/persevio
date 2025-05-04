import { useState } from "react";
import useAssembly from "@/hooks/useAssembly";

const SpeechToText = () => {
  const [text, setText] = useState("");
  const { isRecording, startTranscription, endTranscription } = useAssembly({
    onTextChange: (text) => {
      setText(text);
    },
  });

  return (
    <div className="App">
      {isRecording ? (
        <button
          className="real-time-interface__button"
          onClick={(e) => {
            e.preventDefault();
            endTranscription();
          }}
        >
          Stop recording
        </button>
      ) : (
        <button
          className="real-time-interface__button"
          onClick={startTranscription}
        >
          Record
        </button>
      )}
      <div style={{ marginTop: 20 }}>{text}</div>
    </div>
  );
};

export default SpeechToText;
