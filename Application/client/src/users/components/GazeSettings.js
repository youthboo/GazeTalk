import React, { useState, useEffect } from "react";
import { FaCog, FaTimes, FaEye } from "react-icons/fa";
import { FaRedo } from "react-icons/fa";
import styles from "./GazeSettings.module.css";

const GazeSettings = ({ onThresholdChange }) => {
  // ใช้ค่าจาก localStorage ถ้ามี หรือใช้ค่าเริ่มต้น
  const [rightThreshold, setRightThreshold] = useState(() => {
    const savedRightThreshold = localStorage.getItem("rightThreshold");
    return savedRightThreshold ? parseFloat(savedRightThreshold) : 0.53;
  });

  const [leftThreshold, setLeftThreshold] = useState(() => {
    const savedLeftThreshold = localStorage.getItem("leftThreshold");
    return savedLeftThreshold ? parseFloat(savedLeftThreshold) : 0.73;
  });

  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    // เมื่อบันทึก ให้เก็บค่าที่ปรับไว้ใน localStorage
    localStorage.setItem("rightThreshold", rightThreshold);
    localStorage.setItem("leftThreshold", leftThreshold);
    
    onThresholdChange(rightThreshold, leftThreshold);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const resetToDefaults = () => {
    setRightThreshold(0.53);
    setLeftThreshold(0.73);
    
    // เมื่อรีเซ็ตให้ลบค่าใน localStorage
    localStorage.removeItem("rightThreshold");
    localStorage.removeItem("leftThreshold");
  };

  useEffect(() => {
    console.log("isOpen changed:", isOpen);
  }, [isOpen]);

  return (
    <div className={styles.gazeSettings}>
      <button 
        className={`${styles.settingsIcon} ${isOpen ? styles.settingsIconActive : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="เปิดการตั้งค่า Gaze"
      >
        <div className={styles.iconWrapper}>
          <FaCog className={styles.cogIcon} size={22} />
          <FaEye className={styles.eyeIcon} size={14} />
        </div>
      </button>
      
      {isOpen && (
        <div className={styles.settingsPanel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>การตั้งค่าระยะการมอง</h3>
            <button className={styles.closeButton} onClick={handleClose}>
              <FaTimes size={16} />
            </button>
          </div>
          
          <div className={styles.panelContent}>
            <label>
              <span className={styles.labelText}><strong>Right Threshold:</strong> ใช้ปรับค่าระยะของการตรวจจับการมองไปทางขวา</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={rightThreshold}
                onChange={(e) => setRightThreshold(parseFloat(e.target.value))}
              />
            </label>
            
            <label>
              <span className={styles.labelText}><strong>Left Threshold:</strong> ใช้ปรับค่าระยะของการตรวจจับการมองไปทางซ้าย</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={leftThreshold}
                onChange={(e) => setLeftThreshold(parseFloat(e.target.value))}
              />
            </label>
            
            <button className={styles.saveBtn} onClick={handleSave}>
              บันทึกการตั้งค่า
            </button>
            
            <button className={styles.resetBtn} onClick={resetToDefaults}>
                <FaRedo size={18} />
            <span className={styles.resetText}>รีเซ็ตเป็นค่าเริ่มต้น</span>
            </button>
          
            <p className={styles.description}>
                หากต้องการคืนค่ากลับไปที่ค่าเริ่มต้นให้กด "รีเซ็ตเป็นค่าเริ่มต้น"
            </p>

          </div>
        </div>
      )}
    </div>
  );
};

export default GazeSettings;
