import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import "./AlertPage.css";
import Header from "../components/Header";
import VideoFeed from "../components/VideoFeed";
import GazeSettings from "../components/GazeSettings";
import { io } from 'socket.io-client';
import useDingSound from "../hooks/useDingSound";

const AlertPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [highlightedButton, setHighlightedButton] = useState("ใช่");
  const [isEmergencySent, setIsEmergencySent] = useState(false);
  // eslint-disable-next-line
  const [isPageReady, setIsPageReady] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [isHighlightPaused, setIsHighlightPaused] = useState(false);

  const playDingSound = useDingSound();
  const socket = useRef(null);
  
  // ฟังก์ชันสำหรับรีเซ็ตหน้า
  const resetPageState = useCallback(() => {
    setIsPageReady(true);
    setIsEmergencySent(false);
    // รีเซ็ตค่าอื่นๆ ตามต้องการ
    console.log("Page state reset");
  }, []);

  // จัดการกับการเชื่อมต่อ socket
  useEffect(() => {
    socket.current = io(`${process.env.REACT_APP_GAZEMODEL_URL}`, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    
    socket.current.on('connect', () => {
      console.log('Socket connected');
      setIsSocketConnected(true);
    });
    
    socket.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsSocketConnected(false);
    });
    
    socket.current.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setIsSocketConnected(true);
    });
    
    socket.current.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  // ตรวจจับเมื่อกลับมาใช้งานหลังจากเปลี่ยนแท็บหรือพักหน้าจอ
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page is now visible again');
        resetPageState();
        
        // สั่ง reconnect socket ถ้าจำเป็น
        if (socket.current && !socket.current.connected) {
          socket.current.connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // ตั้งค่าเริ่มต้น
    setTimeout(() => {
      setIsPageReady(true);
    }, 800);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetPageState]);

  // ตรวจจับการไม่ได้ใช้งานเป็นเวลานาน
  useEffect(() => {
    let inactivityTimer;
    
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.log('User inactive for 10 minutes, resetting page state');
        resetPageState();
        
        // แสดงข้อความแจ้งเตือน
        Swal.fire({
          title: "กลับมาใช้งาน",
          text: "เราตรวจพบว่าไม่มีการใช้งานเป็นเวลานาน ระบบได้รีเซ็ตสถานะแล้ว",
          icon: "info",
          timer: 3000,
          showConfirmButton: false,
        });
      }, 600000); 
    };

    // เริ่มต้นจับเวลา
    resetInactivityTimer();

    // รีเซ็ตเวลาเมื่อมีการทำงาน
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [resetPageState]);

  // ตรวจสอบสถานะการเชื่อมต่อเป็นระยะ
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (socket.current) {
        if (!socket.current.connected) {
          console.log('Socket disconnected, attempting to reconnect...');
          socket.current.connect();
        }
      }
    }, 30000); // ตรวจสอบทุก 30 วินาที
    
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, []);

  const canSendEmergencyAlert = useCallback(() => {
    const lastSent = localStorage.getItem("lastEmergencySent");
    if (!lastSent) return true;
    return Date.now() - parseInt(lastSent, 10) >= 60000;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsButtonEnabled(true); 
    }, 3000); 
  
    return () => clearTimeout(timer); 
  }, []); 
  
  const handleYesClick = useCallback(async () => {
    // เช็คเฉพาะว่าได้ส่งแจ้งเตือนไปแล้วหรือไม่
    if (!isButtonEnabled || isEmergencySent) return
  
    playDingSound();
  
    if (!canSendEmergencyAlert()) {
      Swal.fire({
        title: "แจ้งเตือนซ้ำเร็วเกินไป!",
        text: "กรุณารอ 1 นาที ก่อนแจ้งเตือนอีกครั้ง",
        icon: "warning",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }
  
    setIsEmergencySent(true);
    localStorage.setItem("lastEmergencySent", Date.now().toString());
    const patient_id = localStorage.getItem("patient_id");
  
    if (!patient_id) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: "ไม่พบข้อมูลผู้ป่วย กรุณาเข้าสู่ระบบใหม่",
        icon: "error",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsEmergencySent(false); // รีเซ็ตสถานะเพื่อให้ลองใหม่ได้
      return;
    }
  
    try {
      const response = await fetch(
        `${process.env.REACT_APP_GAZETALK_URL}/api/patients/${patient_id}/send-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "🚨 แจ้งเตือนฉุกเฉิน: ต้องการความช่วยเหลือด่วน!",
          }),
        }
      );
  
      if (!response.ok) throw new Error("Failed to send emergency alert");
  
      Swal.fire({
        title: "แจ้งเตือนสำเร็จ!",
        text: "ระบบจะกลับไปยังหน้าก่อนหน้าใน 3 วินาที",
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
        didClose: () => navigate(location.state?.returnTo || "/"),
      });
    } catch (error) {
      console.error("Error sending emergency alert:", error);
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: "ไม่สามารถส่งการแจ้งเตือนได้ กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsEmergencySent(false); // รีเซ็ตสถานะเพื่อให้ลองใหม่ได้
    }
  }, [isEmergencySent, playDingSound, canSendEmergencyAlert, navigate, location, isButtonEnabled]); // เพิ่ม isButtonEnabled
  ;

  const handleNoClick = useCallback(() => {
    // เช็คเฉพาะว่าได้ส่งแจ้งเตือนไปแล้วหรือไม่
    if (isEmergencySent) return;
    
    playDingSound();
    setIsEmergencySent(true);
    navigate(location.state?.returnTo || "/");
  }, [isEmergencySent, playDingSound, navigate, location]);

  const toggleHighlight = () => {
    setIsHighlightPaused((prev) => !prev);
  };

  const handleGazeData = useCallback(
    (data) => {
      const { direction, blink_detected } = data;
      // หากการไฮไลท์ถูกหยุด ไม่ให้ดำเนินการใดๆ
      if (isHighlightPaused) {
        return; 
      }

      if (direction === "right") setHighlightedButton("ไม่ใช่");
      else if (direction === "left") setHighlightedButton("ใช่");

      if (blink_detected && !isEmergencySent ) { 
        highlightedButton === "ใช่" ? handleYesClick() : handleNoClick();
      }

      if (socket.current) {
        socket.current.emit('reset-eye-state');
      }
      
    },
    [highlightedButton, isEmergencySent, handleYesClick, handleNoClick, isHighlightPaused]
  );

  const handleThresholdChange = (right, left) => {
    console.log("New gaze thresholds:", right, left);
    if (socket.current && socket.current.connected) {
      socket.current.emit("update-thresholds", { right, left });
    } else {
      console.log("Socket not connected, trying to reconnect...");
      socket.current.connect();
      // ลองส่งอีกครั้งหลังจากพยายามเชื่อมต่อ
      setTimeout(() => {
        if (socket.current.connected) {
          socket.current.emit("update-thresholds", { right, left });
        }
      }, 1000);
    }
  };

  return (
    <div className="alert-page">
      <Header isHighlightPaused={isHighlightPaused} toggleHighlight={toggleHighlight} />
      {!isSocketConnected && (
        <div className="connection-warning">
          กำลังเชื่อมต่อระบบตรวจจับสายตา...
          <button onClick={() => socket.current.connect()}>ลองใหม่</button>
        </div>
      )}
      <GazeSettings onThresholdChange={handleThresholdChange} />
      <div className="webcam-container">
        <VideoFeed width="100%" borderRadius="10px" onGazeDataReceived={handleGazeData} />
      </div>
      <h1>ยืนยันการแจ้งเตือน</h1>
      <p>คุณต้องการส่งการแจ้งเตือนหรือไม่?</p>
      <div className="alert-buttons">
        <button 
          className={`alert-button ${highlightedButton === "ใช่" ? "highlighted" : ""}`} 
          onClick={handleYesClick}
          disabled={!isButtonEnabled || isEmergencySent}
        >
          ใช่
        </button>
        <button 
          className={`alert-button ${highlightedButton === "ไม่ใช่" ? "highlighted" : ""}`} 
          onClick={handleNoClick}
          disabled={isEmergencySent}
        >
          ไม่ใช่
        </button>
      </div>
    </div>
  );
};

export default AlertPage;