import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { io } from "socket.io-client";
import { Film, X } from "lucide-react"; 
import "./VideoFeed.css";
import { Slider } from 'antd';  
import { message } from 'antd';

const VideoFeed = ({ width, borderRadius, onGazeDataReceived }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const socket = useRef(null);
  const [frameInterval, setFrameInterval] = useState(1000);
  const [eyeClosedTimeout, setEyeClosedTimeout] = useState(0.5);

  useEffect(() => {
    const savedFrameInterval = localStorage.getItem('frameInterval');
    if (savedFrameInterval) {
      setFrameInterval(parseInt(savedFrameInterval, 10));
    }
    const savedEyeClosedTimeout = localStorage.getItem('eyeClosedTimeout');
    if (savedEyeClosedTimeout) {
      setEyeClosedTimeout(parseFloat(savedEyeClosedTimeout));
  }
  }, []);

  useEffect(() => {
    // สร้าง socket connection ใหม่และกำหนดค่าการเชื่อมต่อที่เหมาะสม
    const setupSocket = () => {
      if (socket.current) {
        socket.current.disconnect();
      }
      
      const serverUrl = process.env.REACT_APP_GAZEMODEL_URL;
      socket.current = io(`${serverUrl}`, {
        reconnection: true,       
        reconnectionAttempts: 5,   
        reconnectionDelay: 1000   
      });

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
    };

    setupSocket();

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
      // เพิ่มการตรวจสอบว่า socket ยังเชื่อมต่ออยู่หรือไม่ก่อนส่งข้อมูล
      if (videoElement && 
          videoElement.readyState === videoElement.HAVE_ENOUGH_DATA && 
          socket.current && 
          socket.current.connected) {  // ตรวจสอบว่า socket ยังเชื่อมต่ออยู่
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const frameData = canvas.toDataURL("image/jpeg", 0.3);

        try {
          socket.current.emit("upload-frame", { frame: frameData });
        } catch (err) {
          console.error("Error sending frame:", err);
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

  const handleSaveSettings = () => {
    localStorage.setItem('frameInterval', frameInterval);
    localStorage.setItem('eyeClosedTimeout', eyeClosedTimeout);
    if (socket.current && socket.current.connected) {
      socket.current.emit("update-settings", {
        frameInterval: frameInterval,
        eyeClosedTimeout: eyeClosedTimeout
      });
    }
    setIsSettingsOpen(false);
    message.success('บันทึกการตั้งค่าเรียบร้อย', 2);
  };

  const handleSliderChange = (value) => {
    setFrameInterval(value);
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
              <label htmlFor="frameInterval">ความถี่ในการส่งเฟรม (มิลลิวินาที)</label>
              <Slider
                min={500}
                max={1500}
                step={100}
                value={frameInterval}
                onChange={handleSliderChange}
                style={{
                  width: '70%',              
                  margin: '0 auto',          
                  height: 30,                 
                }}
              />  
              <div className="slider-info"> 
              </div>
              <p>ค่าปัจจุบัน: {frameInterval} ms</p>
              <p style={{ 
                color: '#888', 
                marginLeft: '40px',
                marginRight: '40px',
                textAlign: 'justify',
                textIndent: '2em', 
                margin: '15px auto',
                maxWidth: '240px'
              }}>
                การตั้งค่าความถี่ในการส่งเฟรมจะช่วยปรับความเร็วในการเคลื่อนที่ของไฮไลท์ ถ้าปรับค่าต่ำ เช่น 500ms ไฮไลท์จะเคลื่อนที่เร็วขึ้นแต่ถ้าปรับค่ามากขึ้น เช่น 1500ms ไฮไลท์จะเคลื่อนที่ช้าลง
              </p>

              <label htmlFor="eyeTimeout">การตรวจจับการหลับตา </label>
              <Slider
                min={0.1}
                max={1.0}
                step={0.1}
                value={eyeClosedTimeout}
                onChange={(value) => setEyeClosedTimeout(value)}
                style={{ width: '70%', margin: '0 auto' }}
              />
              <p>ค่าปัจจุบัน: {eyeClosedTimeout} </p>
              <p style={{
                color: '#888',
                marginLeft: '40px',
                marginRight: '40px',
                textAlign: 'justify',
                textIndent: '2em',
                margin: '15px auto',
                maxWidth: '240px',
              }}>
                การตั้งค่าการตรวจจับการหลับตาจะดูว่าผู้ใช้ต้องหลับตาไว้นานมากน้อยแค่ไหน เช่น ค่าต่ำ การตอบสนองการเลือกคำจะเร็วขึ้น แต่ถ้าค่าสูง การตอบสนองการเลือกคำก็จะช้าลง
              </p>

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