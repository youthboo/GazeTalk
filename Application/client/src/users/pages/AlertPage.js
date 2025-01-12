import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { GuideIcon, LogoutIcon } from "../components/HeaderIcons"; 
import "./AlertPage.css";

const AlertPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ปุ่ม "ใช่" เป็นค่าเริ่มต้น
  const [highlightedButton, setHighlightedButton] = useState("ใช่");
  
  // เพิ่ม state นี้เพื่อป้องกันการเรียกซ้ำ
  const [isEmergencySent, setIsEmergencySent] = useState(false);

  const handleYesClick = async () => {
    // เมื่อคลิกหรือกระพริบตาสองครั้งแล้ว ตัดโอกาสไม่ให้กดซ้ำ
    setIsEmergencySent(true);

    const patient_id = sessionStorage.getItem('patient_id');
    
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
      // ส่งข้อความแจ้งเตือนฉุกเฉินไป Telegram
      const response = await fetch(
        `http://localhost:3008/api/patients/${patient_id}/send-message`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: "🚨 แจ้งเตือนฉุกเฉิน: ต้องการความช่วยเหลือด่วน!"
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send emergency alert');
      }

      // แสดง success message และ redirect กลับหน้าที่แล้ว
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
      console.error('Error sending emergency alert:', error);
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
    // เมื่อคลิกหรือกระพริบตาสองครั้งแล้ว ตัดโอกาสไม่ให้กดซ้ำ
    setIsEmergencySent(true);

    const returnPath = location.state?.returnTo || "/";
    navigate(returnPath);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://localhost:5006/gaze")
        .then((response) => response.json())
        .then((data) => {
          const { direction, double_blink } = data;

          // ตรวจจับทิศทางตาเพื่อสลับปุ่มที่ไฮไลต์
          if (direction === "right") {
            setHighlightedButton("ไม่ใช่");
          } else if (direction === "left") {
            setHighlightedButton("ใช่");
          }

          // หากมีการกระพริบตาสองครั้ง (double_blink) และยังไม่เคยกดแจ้งเตือน
          if (double_blink && !isEmergencySent) {
            if (highlightedButton === "ใช่") {
              handleYesClick();
            } else if (highlightedButton === "ไม่ใช่") {
              handleNoClick();
            }
          }
        })
        .catch((error) => console.error("Error fetching gaze data:", error));
    }, 500);

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [highlightedButton, isEmergencySent]);

  return (
    <div className="alert-page">
      <div className="header-icons">
        <GuideIcon />
        <LogoutIcon />
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
