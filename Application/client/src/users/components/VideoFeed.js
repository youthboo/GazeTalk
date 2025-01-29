import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

const VideoFeed = ({ width, borderRadius }) => {
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(true);

  useEffect(() => {
    let videoElement = videoRef.current; // เก็บค่า ref ไว้ในตัวแปร
    let stream = null; // ตัวแปรสำหรับเก็บ stream

    // ฟังก์ชันเปิดกล้อง
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoElement) {
          videoElement.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setIsCameraActive(false);
      }
    };

    startCamera();

    return () => {
      if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
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
            transform: "scaleX(-1)"  // พลิกภาพแนวนอน
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
