import React, { useEffect, useRef, useState } from "react";
import "./Webcam.css";

const Webcam = () => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="webcam-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="webcam-video"
      />
    </div>
  );
};

export default Webcam;
