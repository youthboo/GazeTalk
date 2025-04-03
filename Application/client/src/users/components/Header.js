import React from "react";
import { GuideIcon, LogoutIcon, VolumeControlIcon } from "./HeaderIcons";
import logo from "../assets/hospital.png";
import { useSound } from "../context/SoundContext"; 

const Header = () => {
  const { isMuted, toggleMute } = useSound(); // ใช้ context เพื่อควบคุมเสียง

  return (
    <div className="header">
      <div className="header-icons">
        <VolumeControlIcon isMuted={isMuted} toggleVolume={toggleMute} /> 
        <GuideIcon />
        <LogoutIcon />
      </div>

      <div className="header-logo">
        <img src={logo} alt="Logo" className="logo-image" />
        <h1 className="logo-text">GazeTalk</h1>
      </div>
    </div>
  );
};

export default Header;
