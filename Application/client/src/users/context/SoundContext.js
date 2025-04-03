import { createContext, useContext, useState, useEffect } from "react";

const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [gainNode, setGainNode] = useState(null);

  useEffect(() => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const node = context.createGain();
    node.connect(context.destination);
    setAudioContext(context);
    setGainNode(node);

    // ปิดเสียงเริ่มต้นถ้า isMuted เป็น true
    if (node) {
      node.gain.value = isMuted ? 0 : 1;
    }

    return () => {
      context.close(); 
    };
  }, []);

  const toggleMute = () => {
    if (gainNode) {
      gainNode.gain.value = isMuted ? 1 : 0; 
      setIsMuted((prev) => !prev); 
    }
  };

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, audioContext, gainNode }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => useContext(SoundContext);
