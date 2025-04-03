import { useEffect, useState } from "react";
import dingSound from "../assets/pick.mp3";

const useDingSound = () => {
  const [audioContext, setAudioContext] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);

  useEffect(() => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);

    fetch(dingSound)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
      .then((decodedBuffer) => setAudioBuffer(decodedBuffer))
      .catch((error) => console.error("Error loading sound:", error));

    return () => context.close();
  }, []);

  const playDingSound = () => {
    if (audioContext && audioBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    }
  };

  return playDingSound;
};

export default useDingSound;
