import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { FaRedo } from "react-icons/fa";
import styles from "./GazeSettings.module.css";
import { BsSliders } from "react-icons/bs"; 
import { message } from 'antd';

const GazeSettings = ({ onThresholdChange }) => {
  const [rightThreshold, setRightThreshold] = useState(() => {
    const savedRightThreshold = localStorage.getItem("rightThreshold");
    return savedRightThreshold ? parseFloat(savedRightThreshold) : 0.55;
  });

  const [leftThreshold, setLeftThreshold] = useState(() => {
    const savedLeftThreshold = localStorage.getItem("leftThreshold");
    return savedLeftThreshold ? parseFloat(savedLeftThreshold) : 0.75;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [validationError, setValidationError] = useState("");

  // คำนวณค่าช่องว่างระหว่าง threshold
  const thresholdGap = leftThreshold - rightThreshold;

  // ตรวจสอบความถูกต้องของค่า
  useEffect(() => {
    if (thresholdGap < 0.15) {
      setValidationError("⚠️ ไม่แนะนำให้ปรับน้อยกว่า 0.15");
    } else {
      setValidationError("");
    }
  }, [rightThreshold, leftThreshold, thresholdGap]);

  const handleSave = () => {
    // บันทึกค่าโดยไม่สนใจเงื่อนไข thresholdGap
    localStorage.setItem("rightThreshold", rightThreshold);
    localStorage.setItem("leftThreshold", leftThreshold);
    onThresholdChange(rightThreshold, leftThreshold);
    setIsOpen(false);

    message.success("บันทึกการตั้งค่าเรียบร้อย", 2);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const resetToDefaults = () => {
    setRightThreshold(0.55);
    setLeftThreshold(0.75);
    localStorage.removeItem("rightThreshold");
    localStorage.removeItem("leftThreshold");
    setValidationError("");
  };

  const updateRightThreshold = (value) => {
    const newValue = parseFloat(value);
    // ลบการบังคับให้ค่า leftThreshold ต้องเปลี่ยนตาม
    setRightThreshold(newValue);
  };

  const updateLeftThreshold = (value) => {
    const newValue = parseFloat(value);
    // ลบการบังคับให้ค่า rightThreshold ต้องเปลี่ยนตาม
    setLeftThreshold(newValue);
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
              <span className={styles.labelText}><strong>Left Threshold:</strong> ปรับค่าระยะการมองไปทางซ้าย (ถ้าค่ามาก จะต้องเหลือกตาไปทางซ้ายมากขึ้น)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={leftThreshold}
                onChange={(e) => updateLeftThreshold(e.target.value)}
              />
            </label>

            <label>
              <span className={styles.labelText}><strong>Right Threshold:</strong> ปรับค่าระยะการมองไปทางขวา (ถ้าค่าน้อย จะต้องเหลือกตาไปทางขวามากขึ้น)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={rightThreshold}
                onChange={(e) => updateRightThreshold(e.target.value)}
              />
            </label>
                    
            <div className={styles.gapDisplay} style={{marginTop: "1px", marginBottom: "15px", fontSize: "16px"}}>
              <div className={styles.gapInfo}>
                ระยะห่างระหว่าง Left Threshold และ Right Threshold: <strong>{thresholdGap.toFixed(2)}</strong>
                <span 
                  className={styles.gapStatus} 
                  style={{
                    color: thresholdGap >= 0.15 ? "green" : "orange", 
                    marginLeft: "10px",
                    fontWeight: "bold"
                  }}
                >
                  {thresholdGap >= 0.15 ? "✓" : validationError}
                </span>
              </div>
            </div>
            
            <button 
              className={styles.saveBtn} 
              onClick={handleSave}
            >
              บันทึกการตั้งค่า
            </button>
            
            <button className={styles.resetBtn} onClick={resetToDefaults}>
              <FaRedo size={18} />
              <span className={styles.resetText}>รีเซ็ตเป็นค่าเริ่มต้น</span>
            </button>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default GazeSettings;