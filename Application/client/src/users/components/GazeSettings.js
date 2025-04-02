import React, { useState, useEffect } from "react";
import {  FaTimes } from "react-icons/fa";
import { FaRedo } from "react-icons/fa";
import styles from "./GazeSettings.module.css";
import { BsSliders } from "react-icons/bs"; // Bootstrap Icons

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
  const [validationError, setValidationError] = useState("");

  // คำนวณค่าช่องว่างระหว่าง threshold
  const thresholdGap = leftThreshold - rightThreshold;
  const isValidGap = thresholdGap >= 0.19;

  // ตรวจสอบความถูกต้องของค่า
  useEffect(() => {
    if (thresholdGap < 0.20) {
      setValidationError("ระยะห่างระหว่างค่า Left และ Right ควรห่างกันอย่างน้อย 0.20");
    } else {
      setValidationError("");
    }
  }, [rightThreshold, leftThreshold, thresholdGap]);

  const handleSave = () => {
    // ตรวจสอบความถูกต้องก่อนบันทึก
    if (isValidGap) {
      // เมื่อบันทึก ให้เก็บค่าที่ปรับไว้ใน localStorage
      localStorage.setItem("rightThreshold", rightThreshold);
      localStorage.setItem("leftThreshold", leftThreshold);
      
      onThresholdChange(rightThreshold, leftThreshold);
      setIsOpen(false);
    }
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
    setValidationError("");
  };

  // อัปเดตค่า right threshold อย่างปลอดภัย
  const updateRightThreshold = (value) => {
    const newValue = parseFloat(value);
    setRightThreshold(newValue);
    
    // ปรับค่า left threshold โดยอัตโนมัติถ้าจำเป็น
    if (leftThreshold - newValue < 0.20) {
      setLeftThreshold(Math.min(newValue + 0.20, 1.0));
    }
  };

  // อัปเดตค่า left threshold อย่างปลอดภัย
  const updateLeftThreshold = (value) => {
    const newValue = parseFloat(value);
    setLeftThreshold(newValue);
    
    // ปรับค่า right threshold โดยอัตโนมัติถ้าจำเป็น
    if (newValue - rightThreshold < 0.20) {
      setRightThreshold(Math.max(newValue - 0.20, 0.0));
    }
  };

  return (
    <div className={styles.gazeSettings}>
      <button 
        className={`${styles.settingsIcon} ${isOpen ? styles.settingsIconActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="เปิดการตั้งค่า Gaze"
      >
        <BsSliders size={18} />
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
              <span className={styles.labelText}><strong>Left Threshold:</strong> ปรับค่าระยะของการตรวจจับการมองไปทางซ้าย</span>
              <input
                type="number"
                step="0.01"
                min={rightThreshold + 0.20}
                max="1"
                value={leftThreshold}
                onChange={(e) => updateLeftThreshold(e.target.value)}
              />
            </label>

            <label>
              <span className={styles.labelText}><strong>Right Threshold:</strong> ปรับค่าระยะของการตรวจจับการมองไปทางขวา</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={leftThreshold - 0.20}
                value={rightThreshold}
                onChange={(e) => updateRightThreshold(e.target.value)}
              />
            </label>
            
            {/* แสดงระยะห่างและสถานะ */}
            <div className={styles.gapDisplay} style={{marginTop: "15px", marginBottom: "15px"}}>
              <div className={styles.gapInfo}>
                <strong>ระยะห่างปัจจุบัน:</strong> {thresholdGap.toFixed(2)}
                <span 
                  className={styles.gapStatus} 
                  style={{
                    color: isValidGap ? "green" : "red", 
                    marginLeft: "10px",
                    fontWeight: "bold"
                  }}
                >
                  {isValidGap ? "✓ เหมาะสม" : "✗ น้อยเกินไป"}
                </span>
              </div>
              <div className={styles.gapVisual}>
                <div className={styles.visualScale}>
                  <div className={styles.leftArea} style={{width: `${rightThreshold * 100}%`}}>ซ้าย</div>
                  <div className={styles.centerArea} style={{width: `${thresholdGap * 100}%`}}>กลาง</div>
                  <div className={styles.rightArea} style={{width: `${(1 - leftThreshold) * 100}%`}}>ขวา</div>
                </div>
              </div>
            </div>
            
            {validationError && (
              <div className={styles.errorMessage} style={{color: "red", marginBottom: "15px"}}>
                {validationError}
              </div>
            )}
            
            <button 
              className={styles.saveBtn} 
              onClick={handleSave}
              disabled={!isValidGap}
            >
              บันทึกการตั้งค่า
            </button>
            
            <button className={styles.resetBtn} onClick={resetToDefaults}>
              <FaRedo size={18} />
              <span className={styles.resetText}>รีเซ็ตเป็นค่าเริ่มต้น</span>
            </button>
            
            <p className={styles.description}>
              การตั้งค่าที่ดีควรมีระยะห่างระหว่าง Left และ Right อย่างน้อย 0.20 เพื่อให้การตรวจจับการมองตรงกลางทำงานได้แม่นยำ
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GazeSettings;