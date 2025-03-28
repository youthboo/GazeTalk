import React, { useEffect, useState, useCallback } from "react"; // Import useCallback
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import "./AlertPage.css";
import Header from "../components/Header";
import dingSound from "../assets/pick.mp3";
import VideoFeed from "../components/VideoFeed";

const AlertPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [highlightedButton, setHighlightedButton] = useState("ใช่");
  const [isEmergencySent, setIsEmergencySent] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);

  const playDingSound = () => {
    const audio = new Audio(dingSound);
    audio.play();
  };

  // ตรวจสอบเวลาการแจ้งเตือนล่าสุดจาก localStorage
  const canSendEmergencyAlert = () => {
    const lastSent = localStorage.getItem("lastEmergencySent");
    if (!lastSent) return true;

    const lastSentTime = parseInt(lastSent, 10);
    const currentTime = Date.now();
    return currentTime - lastSentTime >= 60000;
  };

  const handleYesClick = async () => {
    if (isEmergencySent || !isPageReady) return; // เพิ่มเงื่อนไข !isPageReady
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

    const patient_id = sessionStorage.getItem("patient_id");

    if (!patient_id) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: "ไม่พบข้อมูลผู้ป่วย กรุณาเข้าสู่ระบบใหม่",
        icon: "error",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_GAZETALK_URL}/api/patients/${patient_id}/send-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "🚨 แจ้งเตือนฉุกเฉิน: ต้องการความช่วยเหลือด่วน!",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send emergency alert");
      }

      Swal.fire({
        title: "แจ้งเตือนสำเร็จ!",
        text: "ระบบจะกลับไปยังหน้าก่อนหน้าใน 3 วินาที",
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
        didClose: () => {
          const returnPath = location.state?.returnTo || "/";
          navigate(returnPath);
        },
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
    }
  };

  const handleNoClick = () => {
    if (isEmergencySent || !isPageReady) return; // เพิ่มเงื่อนไข !isPageReady
    playDingSound();
    setIsEmergencySent(true);

    const returnPath = location.state?.returnTo || "/";
    navigate(returnPath);
  };

  // เพิ่ม useEffect สำหรับการหน่วงเวลาเริ่มต้น
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 700); // หน่วงเวลา

    return () => clearTimeout(timer);
  }, []);

  // Fix here by properly passing the parameter `data`
  const handleGazeData = useCallback((data) => {
    const { direction, double_blink } = data;

    if (direction === "right") {
      setHighlightedButton("ไม่ใช่");
    } else if (direction === "left") {
      setHighlightedButton("ใช่");
    }

    if (double_blink && !isEmergencySent && isPageReady) { // เพิ่มเงื่อนไข isPageReady
      if (highlightedButton === "ใช่") {
        handleYesClick();
      } else if (highlightedButton === "ไม่ใช่") {
        handleNoClick();
      }
    }
  }, [highlightedButton, isEmergencySent, isPageReady]); // Now correctly uses `useCallback`

  return (
    <div className="alert-page">
      <Header />
      <div className="webcam-container">
        <VideoFeed width="100%" borderRadius="10px" onGazeDataReceived={handleGazeData} />
      </div>
      <h1>ยืนยันการแจ้งเตือน</h1>
      <p>คุณต้องการส่งการแจ้งเตือนหรือไม่?</p>
      
      <div className="alert-buttons">
        <button
          className={`alert-button ${highlightedButton === "ใช่" ? "highlighted" : ""}`}
          onClick={handleYesClick}
        >
          ใช่
        </button>
        <button
          className={`alert-button ${highlightedButton === "ไม่ใช่" ? "highlighted" : ""}`}
          onClick={handleNoClick}
        >
          ไม่ใช่
        </button>
      </div>
    </div>
  );
};

export default AlertPage;
