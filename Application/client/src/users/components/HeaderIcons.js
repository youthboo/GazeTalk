import React, { useState } from "react";
import Swal from "sweetalert2";
import { FaQuestionCircle, FaSignOutAlt, FaVolumeUp, FaVolumeMute, FaPauseCircle, FaPlayCircle } from "react-icons/fa";

export const GuideIcon = () => {
  const handleGuide = () => {
    Swal.fire({
      title: "คู่มือการใช้งาน",
      html: `
        <div>
          <p>การมองซ้าย-ขวา: มองซ้ายหรือขวาเพื่อเลื่อนไฮไลท์ไปยังทิศทางที่ต้องการ</p>
          <p>หลับตาค้าง 5 วินาที: หลับตาค้างเพื่อยืนยันการเลือก</p>
          <div style="margin-top: 1px;">
            <iframe width="100%" height="300" 
              src="https://www.youtube.com/embed/OA4VYkpIUV8" 
              title="คู่มือการใช้งาน" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>
        </div>
      `,
      icon: "info",
      showCloseButton: true,  
      closeButtonHtml: '<i class="fa fa-times" style="font-size: 20px;"></i>', 
      showConfirmButton: false, 
    });
  };

  return (
    <button className="icon-button" onClick={handleGuide}>
      <FaQuestionCircle size={24} />
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
        localStorage.clear();
        if (onLogout) onLogout();
        window.location.href = "/login";
      }
    });
  };

  return (
    <button className="icon-button" onClick={handleLogout}>
      <FaSignOutAlt size={24} />
    </button>
  );
};

export const VolumeControlIcon = ({ isMuted, toggleVolume }) => {
  return (
    <button className="icon-button" onClick={toggleVolume}>
      {isMuted ? <FaVolumeMute size={24} /> : <FaVolumeUp size={24} />}
    </button>
  );
};

export const PauseHighlightIcon = ({ isPaused, togglePause }) => {
  return (
    <button className="icon-button" onClick={togglePause}>
      {isPaused ? <FaPlayCircle size={24} /> : <FaPauseCircle size={24} />}
    </button>
  );
};
