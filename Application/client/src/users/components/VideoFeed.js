import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { io } from "socket.io-client";

const VideoFeed = ({ width, borderRadius, onGazeDataReceived }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const socket = useRef(null);

  useEffect(() => {
    if (!socket.current) {
      // สร้าง WebSocket ครั้งเดียว
      socket.current = io(`${process.env.REACT_APP_GAZEMODEL_URL}`);

      socket.current.on("connect", () => {
        console.log("Connected to server via WebSocket");
      });

      socket.current.on("gaze-data", (data) => {
        if (onGazeDataReceived) {
          onGazeDataReceived(data);
        }
      });

      socket.current.on("error", (error) => {
        console.error("Error from server:", error);
      });
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [onGazeDataReceived]); 

  useEffect(() => {
    let videoElement = videoRef.current;
    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            frameRate: { ideal: 10 },
          },
        });

        if (videoElement) {
          videoElement.srcObject = stream;
        }
        setIsCameraActive(true);

        const canvas = canvasRef.current;
        if (canvas) {
          setIsCanvasReady(true);
        }

        startSendingFrames();
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setIsCameraActive(false);
      }
    };

    const startSendingFrames = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.log("Canvas is not available");
        return;
      }

      const context = canvas.getContext("2d");

      frameIntervalRef.current = setInterval(() => {
        const videoElement = videoRef.current;
        if (videoElement && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

          // แปลงภาพเป็น base64
          const frameData = canvas.toDataURL("image/jpeg", 0.3);

          if (socket.current) {
            socket.current.emit("upload-frame", { frame: frameData });
          }
        }
      }, 500);
    };

    startCamera();

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // ใช้ [] เพื่อให้รันครั้งเดียวตอน mount

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
              transform: "scaleX(-1)",
            }}
          />
          <canvas ref={canvasRef} width="320" height="240" style={{ display: "none" }} />
        </>
      ) : (
        <div style={{ color: "red", fontSize: "18px", fontWeight: "bold" }}>
          ไม่พบกล้อง กรุณาตรวจสอบการเชื่อมต่อ...
        </div>
      )}
      {!isCanvasReady}
    </div>
  );
};

VideoFeed.propTypes = {
  width: PropTypes.string,
  borderRadius: PropTypes.string,
  onGazeDataReceived: PropTypes.func.isRequired,
};

export default VideoFeed;
