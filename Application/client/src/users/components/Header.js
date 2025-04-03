import React from "react";
import { GuideIcon, LogoutIcon, VolumeControlIcon, PauseHighlightIcon } from "./HeaderIcons";
import logo from "../assets/hospital.png";
import { useSound } from "../context/SoundContext"; 

const Header = ({ isHighlightPaused, toggleHighlight }) => {
  const { isMuted, toggleMute } = useSound(); 

  return (
    <div className="header">
      <div className="header-icons">
        <VolumeControlIcon isMuted={isMuted} toggleVolume={toggleMute} />
        <PauseHighlightIcon isPaused={isHighlightPaused} togglePause={toggleHighlight} />
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
