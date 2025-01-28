import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

const VideoFeed = ({ width, borderRadius }) => {
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(true);

  useEffect(() => {
    // ฟังก์ชันเปิดกล้อง
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setIsCameraActive(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="video-feed-container" style={{ textAlign: "center", marginTop: "20px" }}>
      {isCameraActive ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: width || "100%",
            borderRadius: borderRadius || "20px",
            border: "2px solid #ccc",
            transform: "scaleX(-1)"  // พลิกภาพแนวนอนเหมือนในเดิม
          }}
        />
      ) : (
        <div style={{ color: "red", fontSize: "18px", fontWeight: "bold" }}>
          ไม่พบกล้อง กรุณาตรวจสอบการเชื่อมต่อ...
        </div>
      )}
    </div>
  );
};

VideoFeed.propTypes = {
  width: PropTypes.string,       
  borderRadius: PropTypes.string 
};

export default VideoFeed;
