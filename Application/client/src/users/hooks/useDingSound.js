import { useEffect, useState } from "react";
import { useSound } from "../context/SoundContext"; // นำเข้า Context
import dingSound from "../assets/pick.mp3";

const useDingSound = () => {
  const { isMuted } = useSound(); // ใช้ค่า isMuted จาก Context
  const [audioContext, setAudioContext] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [audioSource, setAudioSource] = useState(null); // ใช้เพื่อควบคุมการเล่นเสียง

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

  useEffect(() => {
    // หากค่า isMuted เปลี่ยนแปลง ให้หยุดเสียงทันที
    if (audioSource) {
      audioSource.stop(); // หยุดเสียงก่อนหน้า
    }

    if (audioContext && audioBuffer && !isMuted) {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      setAudioSource(source); // ตั้งค่า audioSource สำหรับการหยุดเสียงในอนาคต
    }
  }, [isMuted, audioContext, audioBuffer]); // ติดตามการเปลี่ยนแปลงของ isMuted

  const playDingSound = () => {
    if (audioContext && audioBuffer && !isMuted) {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    }
  };

  return playDingSound;
};

export default useDingSound;
