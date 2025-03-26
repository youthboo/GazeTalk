import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { io } from "socket.io-client"; // นำเข้า socket.io-client

const VideoFeed = ({ width, borderRadius }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameIntervalRef = useRef(null); // ใช้ useRef แทน let
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState(""); // เก็บข้อความข้อผิดพลาดจากการเข้าถึงกล้อง

  // สร้างการเชื่อมต่อกับ socket server
  const socket = useRef(null); 

  useEffect(() => {
    let videoElement = videoRef.current;
    let stream = null;

    // เชื่อมต่อกับ backend ผ่าน WebSocket
    const connectSocket = () => {
      socket.current = io(`${process.env.REACT_APP_GAZEMODEL_URL}`, {
        transports: ["websocket"], // ใช้ websocket transport
      });

      socket.current.on("connect", () => {
        console.log("Connected to server via WebSocket");
      });

      socket.current.on("disconnect", () => {
        console.log("Disconnected from server");
      });

      socket.current.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
      });
    };

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
        setCameraError("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการเชื่อมต่อหรืออนุญาตการเข้าถึงกล้อง");
      }
    };

    const startSendingFrames = () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      frameIntervalRef.current = setInterval(() => {
        if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
          // วาดภาพจากวิดีโอลงบน canvas
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

          // แปลง canvas เป็น blob
          canvas.toBlob(async (blob) => {
            try {
              if (socket.current) {
                // ส่งภาพไปยัง backend ผ่าน WebSocket
                socket.current.emit("frame", blob); // ส่ง blob ไปยัง backend
              }
            } catch (error) {
              console.error("Error sending frame:", error);
            }
          }, "image/jpeg", 0.6); // คุณภาพ 70% เพื่อลดขนาดข้อมูล
        }
      }, 200); // ส่งทุก 200ms (5 fps)
    };

    connectSocket(); // เรียกใช้ฟังก์ชันเชื่อมต่อ WebSocket
    startCamera();

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current); // เคลียร์ interval อย่างถูกต้อง
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (socket.current) {
        socket.current.disconnect(); // ปิดการเชื่อมต่อเมื่อ Component ถูกทำลาย
      }
    };
  }, []);

  return (
    <div className="video-feed-container" style={{ textAlign: "center", marginTop: "20px" }}>
      {cameraError ? (
        <div style={{ color: "red", fontSize: "18px", fontWeight: "bold" }}>
          {cameraError}
        </div>
      ) : isCameraActive ? (
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
          <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }} />
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
