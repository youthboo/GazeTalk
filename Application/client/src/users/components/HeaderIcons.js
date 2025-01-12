import React from "react";
import Swal from "sweetalert2";
import exampleGif from "../assets/example.gif";

export const GuideIcon = () => {
  const handleGuide = () => {
    Swal.fire({
      title: "คู่มือการใช้งาน",
      html: `
        <div>
          <p><b>การมองซ้าย:</b> ใช้เพื่อเลื่อนตัวเลือกไปทางซ้าย</p>
          <p><b>การมองขวา:</b> ใช้เพื่อเลื่อนตัวเลือกไปทางขวา</p>
          <p><b>กระพริบตา 2 ครั้ง:</b> ใช้เพื่อยืนยันการเลือก</p>
          <img src="${exampleGif}" alt="ตัวอย่างการใช้งาน" style="width:100%; margin-top: 10px;">
        </div>
      `,
      icon: "info",
      confirmButtonText: "ปิด",
    });
  };

  return (
    <button className="icon-button" onClick={handleGuide}>
      <i className="fa fa-question-circle" aria-hidden="true"></i>
    </button>
  );
};

export const LogoutIcon = ({ onLogout }) => {
 
  const handleLogout = () => {
    Swal.fire({
      title: "คุณต้องการออกจากระบบหรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        // Clear all stored data
        localStorage.clear(); // ใช้ clear() แทนการลบทีละรายการ
        
        // Call onLogout callback
        if (onLogout) {
          onLogout();
        }

        // Force a page refresh to clear any remaining state
        window.location.href = '/login';
      }
    });
  };

  return (
    <button className="icon-button" onClick={handleLogout}>
      <i className="fa fa-sign-out" aria-hidden="true"></i>
    </button>
  );
};