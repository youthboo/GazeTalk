import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

const VideoFeed = ({ width, borderRadius }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  
  useEffect(() => {
    let videoElement = videoRef.current;
    let stream = null;
    let frameInterval = null;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            frameRate: { ideal: 10 } // ลดเฟรมเรทเพื่อประหยัด bandwidth
          } 
        });
        
        if (videoElement) {
          videoElement.srcObject = stream;
        }
        setIsCameraActive(true);
        
        // เริ่มส่งเฟรมไปยัง backend
        startSendingFrames();
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setIsCameraActive(false);
      }
    };
    
    const startSendingFrames = () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      frameInterval = setInterval(() => {
        if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
          // วาดภาพจากวิดีโอลงบน canvas
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          
          // แปลง canvas เป็น blob
          canvas.toBlob(async (blob) => {
            try {
              // ส่งภาพไปยัง backend
              const formData = new FormData();
              formData.append('frame', blob, 'frame.jpg');
              
              await fetch(`${process.env.REACT_APP_GAZEMODEL_URL}/upload-frame`, {
                method: 'POST',
                body: formData
              });
            } catch (error) {
              console.error("Error sending frame:", error);
            }
          }, 'image/jpeg', 0.6); // คุณภาพ 70% เพื่อลดขนาดข้อมูล
        }
      }, 200); // ส่งทุก 100ms (10 fps)
    };
    
    startCamera();
    
    return () => {
      clearInterval(frameInterval);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  return (
    <div className="video-feed-container" style={{ textAlign: "center", marginTop: "20px" }}>
      {isCameraActive ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: width || "100%",
              borderRadius: borderRadius || "20px",
              border: "2px solid #ccc",
              transform: "scaleX(-1)"
            }}
          />
          <canvas 
            ref={canvasRef} 
            width="640" 
            height="480" 
            style={{ display: "none" }} // ซ่อน canvas
          />
        </>
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