import React from "react";
import Swal from "sweetalert2";

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
        localStorage.clear(); 
        
        if (onLogout) {
          onLogout();
        }

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
