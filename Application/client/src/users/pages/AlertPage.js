import React, { useEffect, useState, useCallback } from "react";
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

  const playDingSound = useCallback(() => {
    const audio = new Audio(dingSound);
    audio.play();
  }, []);

  const canSendEmergencyAlert = useCallback(() => {
    const lastSent = localStorage.getItem("lastEmergencySent");
    if (!lastSent) return true;
    return Date.now() - parseInt(lastSent, 10) >= 60000;
  }, []);

  const handleYesClick = useCallback(async () => {
    if (isEmergencySent || !isPageReady) return;
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
    }
  }, [isEmergencySent, isPageReady, playDingSound, canSendEmergencyAlert, navigate, location]);

  const handleNoClick = useCallback(() => {
    if (isEmergencySent || !isPageReady) return;
    playDingSound();
    setIsEmergencySent(true);
    navigate(location.state?.returnTo || "/");
  }, [isEmergencySent, isPageReady, playDingSound, navigate, location]);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleGazeData = useCallback(
    (data) => {
      const { direction, double_blink } = data;
      if (direction === "right") setHighlightedButton("ไม่ใช่");
      else if (direction === "left") setHighlightedButton("ใช่");

      if (double_blink && isPageReady && !isEmergencySent) {
        highlightedButton === "ใช่" ? handleYesClick() : handleNoClick();
      }
    },
    [highlightedButton, isEmergencySent, isPageReady, handleYesClick, handleNoClick]
  );

  return (
    <div className="alert-page">
      <Header />
      <div className="webcam-container">
        <VideoFeed width="100%" borderRadius="10px" onGazeDataReceived={handleGazeData} />
      </div>
      <h1>ยืนยันการแจ้งเตือน</h1>
      <p>คุณต้องการส่งการแจ้งเตือนหรือไม่?</p>
      <div className="alert-buttons">
        <button className={`alert-button ${highlightedButton === "ใช่" ? "highlighted" : ""}`} onClick={handleYesClick}>ใช่</button>
        <button className={`alert-button ${highlightedButton === "ไม่ใช่" ? "highlighted" : ""}`} onClick={handleNoClick}>ไม่ใช่</button>
      </div>
    </div>
  );
};

export default AlertPage;
