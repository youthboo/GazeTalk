import React from "react";
import logo from "../assets/hospital.png";
import { GuideIcon, LogoutIcon } from "./HeaderIcons"; // นำเข้าไอคอน

const Header = () => {
  return (
    <div className="header">
      {/* ไอคอนด้านซ้าย */}
      <div className="header-icons">
        <GuideIcon />
        <LogoutIcon />
      </div>

      {/* โลโก้ตรงกลาง */}
      <div className="header-logo">
        <img src={logo} alt="Logo" className="logo-image" />
        <h1 className="logo-text">GazeTalk</h1>
      </div>
    </div>
  );
};

export default Header;
