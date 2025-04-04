import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { io } from "socket.io-client";
import { Film, X } from "lucide-react";
import "./VideoFeed.css";

const VideoFeed = ({ width, borderRadius, onGazeDataReceived }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const socket = useRef(null);
  const [frameInterval, setFrameInterval] = useState(1000);
  const [sliderValue, setSliderValue] = useState(1000);

  useEffect(() => {
    const savedFrameInterval = localStorage.getItem('frameInterval');
    if (savedFrameInterval) {
      const parsedInterval = parseInt(savedFrameInterval, 10);
      // ตรวจสอบว่าค่าอยู่ในช่วงที่ถูกต้องหรือไม่
      if (parsedInterval >= 300 && parsedInterval <= 1600) {
        setFrameInterval(parsedInterval);
        setSliderValue(parsedInterval);
      } else {
        // ถ้าค่าไม่อยู่ในช่วงที่ถูกต้อง ให้ใช้ค่าเริ่มต้น
        setFrameInterval(1000);
        setSliderValue(1000);
        // อัพเดทค่าใน localStorage ใหม่
        localStorage.setItem('frameInterval', '1000');
      }
    }
  }, []);

  useEffect(() => {
    if (!socket.current) {
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

  const startSendingFrames = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }

    const context = canvas.getContext("2d");

    frameIntervalRef.current = setInterval(() => {
      const videoElement = videoRef.current;
      if (videoElement && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const frameData = canvas.toDataURL("image/jpeg", 0.3);

        if (socket.current) {
          socket.current.emit("upload-frame", { frame: frameData });
        }
      }
    }, frameInterval);
  }, [frameInterval]);

  useEffect(() => {
    let videoElement = videoRef.current;
    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { ideal: 10 } },
        });

        if (videoElement) {
          videoElement.srcObject = stream;
        }
        setIsCameraActive(true);
        setIsCanvasReady(true);
        startSendingFrames();
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setIsCameraActive(false);
      }
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
  }, [startSendingFrames]);

  useEffect(() => {
    if (isCanvasReady) {
      startSendingFrames();
    }
  }, [frameInterval, isCanvasReady, startSendingFrames]);

  const handleSliderChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    setSliderValue(newValue);
  };

  const handleSliderRelease = () => {
    setFrameInterval(sliderValue);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('frameInterval', frameInterval);
    setIsSettingsOpen(false);

    // สร้างการแจ้งเตือน
    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.textContent = 'บันทึกการตั้งค่าเรียบร้อย';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  };

  // ฟังก์ชันสำหรับแสดงค่า FPS จากช่วงเวลา
  const getFPS = (interval) => {
    return (1000 / interval).toFixed(1);
  };

  return (
    <div className="video-feed-container">
      {isCameraActive ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="video-feed"
            style={{ width: width || "100%", borderRadius: borderRadius || "20px" }}
          />
          <canvas ref={canvasRef} width="320" height="240" style={{ display: "none" }} />

          <button 
            className={`settings-button ${isSettingsOpen ? 'active' : ''}`} 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            aria-label="ตั้งค่าการส่งเฟรม"
          >
            <Film size={22} />
          </button>

          {isSettingsOpen && (
            <div className="settings-panel">
              <button className="close-button" onClick={() => setIsSettingsOpen(false)}>
                <X size={18} />
              </button>
              <h3>ตั้งค่าการส่งเฟรม</h3>
              
              <div className="slider-container">
                <label htmlFor="frameInterval">ความถี่ในการส่งเฟรม: {sliderValue} ms ({getFPS(sliderValue)} ครั้ง/วินาที)</label>
                
                <div className="slider-with-values">

                  <input
                    id="frameInterval"
                    type="range"
                    min="300"
                    max="1600"
                    step="100"
                    value={sliderValue}
                    onChange={handleSliderChange}
                    onMouseUp={handleSliderRelease}
                    onTouchEnd={handleSliderRelease}
                    className="frame-slider"
                  />

                </div>
                
                <div className="slider-info">

                </div>
              </div>
              
              <button className="save-button" onClick={handleSaveSettings}>
                บันทึกการตั้งค่า
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="error-message">ไม่พบกล้อง กรุณาตรวจสอบการเชื่อมต่อ...</div>
      )}
    </div>
  );
};

VideoFeed.propTypes = {
  width: PropTypes.string,
  borderRadius: PropTypes.string,
  onGazeDataReceived: PropTypes.func.isRequired,
};

export default VideoFeed;