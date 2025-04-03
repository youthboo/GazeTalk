import { useEffect, useState, useCallback, useRef } from "react";
import { useSound } from "../context/SoundContext";
import dingSound from "../assets/pick.mp3";

const useDingSound = () => {
  const { isMuted } = useSound();
  const [audioContext, setAudioContext] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const audioSourceRef = useRef(null);
  const isMutedRef = useRef(isMuted);

  // อัปเดต ref เมื่อ isMuted เปลี่ยน
  useEffect(() => {
    isMutedRef.current = isMuted;
    
    if (isMuted && audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      } catch (err) {
        console.log("Sound already stopped");
      }
    }
  }, [isMuted]);

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

  const playDingSound = useCallback(() => {
    if (audioContext && audioBuffer && !isMutedRef.current) {
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
        } catch (err) {
        }
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      audioSourceRef.current = source;
    }
  }, [audioContext, audioBuffer]);

  return playDingSound;
};

export default useDingSound;