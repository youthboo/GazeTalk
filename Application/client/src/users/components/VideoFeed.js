import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const VideoFeed = ({ src, width, borderRadius }) => {
  const [timestamp, setTimestamp] = useState(Date.now());
  const [isCameraActive, setIsCameraActive] = useState(true);

  useEffect(() => {
    // ตรวจสอบสถานะของกล้องทุกๆ 5 วินาที
    const checkCameraStatus = () => {
      fetch("http://localhost:5006/status")
        .then((response) => response.json())
        .then((data) => {
          if (!data.camera_connected) {
            setIsCameraActive(false);
            console.warn("Webcam disconnected. Refreshing...");
            setTimestamp(Date.now()); // รีเฟรชกล้องโดยอัปเดต timestamp
          } else {
            setIsCameraActive(true);
          }
        })
        .catch((error) => {
          console.error("Error checking camera status:", error);
          setIsCameraActive(false);
          setTimestamp(Date.now());
        });
    };

    const intervalId = setInterval(checkCameraStatus, 5000); // ตรวจสอบทุก 5 วินาที

    return () => clearInterval(intervalId); // ล้าง interval เมื่อ component ถูก unmount
  }, []);

  return (
    <div className="video-feed-container" style={{ textAlign: "center", marginTop: "20px" }}>
      {isCameraActive ? (
        <img
          src={`${src || "http://localhost:5006/video_feed"}?t=${timestamp}`}
          alt="Webcam Stream"
          className="video-feed"
          style={{ width: width || "100%", borderRadius: borderRadius || "20px", border: "2px solid #ccc" }}
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
  src: PropTypes.string,         
  width: PropTypes.string,       
  borderRadius: PropTypes.string 
};

export default VideoFeed;
