import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import logo from "../assets/hospital.png";
import deleteIcon from "../assets/delete.png";
import bellIcon from "../assets/bell.png";
import Swal from "sweetalert2";
import './BasicPage.css';
import VideoFeed from "../components/VideoFeed";
import { GuideIcon, LogoutIcon } from "../components/HeaderIcons";

const BasicPage = () => {

  const [inputText, setInputText] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const navigate = useNavigate();

  const commonPhrases = [
    "ใช่",
    "ไม่",
    "ขอบคุณ",
    "หมอน",
    "ถ่ายหนัก",
    "ถ่ายเบา",
    "หนาว",
    "ร้อน",
    "หิวข้าว",
    "หิวน้ำ",
    "ปวดท้อง",
    "ปวดหัว",
    "อยากฟังเพลง",
    "อื่นๆ"
  ];

  const imageMap = {
    "ใช่": require("../assets/yes.png"),
    "ไม่": require("../assets/no.png"),
    "ขอบคุณ": require("../assets/thank.png"),
    "หมอน": require("../assets/pillowbasic.png"),
    "ถ่ายหนัก": require("../assets/poop.png"),
    "ถ่ายเบา": require("../assets/peebasic.png"),
    "หนาว": require("../assets/coldbasic.png"),
    "ร้อน": require("../assets/hotbasic.png"),
    "หิวข้าว": require("../assets/hungry.png"),
    "หิวน้ำ": require("../assets/thirsty.png"),
    "ปวดท้อง": require("../assets/stomatch.png"),
    "ปวดหัว": require("../assets/headache.png"),
    "อยากฟังเพลง": require("../assets/music.png"),

  };

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim()) {
      return; // ไม่ทำอะไรถ้าข้อความว่าง
    }

    const patient_id = sessionStorage.getItem('patient_id');

    if (!patient_id) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: "ไม่พบข้อมูลผู้ป่วย กรุณาเข้าสู่ระบบใหม่",
        icon: "error",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      return;
    }

    const isEmergency = inputText.includes("แจ้งเตือนฉุกเฉิน");

    try {
      const telegramResponse = await fetch(`http://localhost:3008/api/patients/${patient_id}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          isEmergency
        }),
      });

      if (!telegramResponse.ok) {
        throw new Error('Failed to send message to Telegram');
      }

      Swal.fire({
        title: "ส่งข้อความสำเร็จ!",
        text: `ข้อความที่ส่ง: ${inputText}`,
        icon: "success",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      setInputText(""); // ล้างข้อความหลังจากส่ง

    } catch (error) {
      console.error('Error sending message:', error);
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: "ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  }, [inputText]);


  const handleKeyInput = useCallback((phrase) => {
    switch (phrase) {
      case "ลบ":
        setInputText("");
        break;
      case "ตกลง":
        handleSubmit();
        break;
      case "Alert":
        navigate("/alert", { state: { returnTo: "/" } });
        break;
      case "Advance":
        navigate("/advance");
        break;
      case "อื่นๆ":
        navigate("/admin-rec");
        break;
      default:
        setInputText(phrase);
    }
    // eslint-disable-next-line
  }, [inputText, navigate, handleSubmit]);

  const totalButtons = 1 + commonPhrases.length + 3;

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://localhost:5006/gaze")
        .then((response) => response.json())
        .then((data) => {
          const { direction, double_blink } = data;

          if (direction === "right") {
            setHighlightedIndex((prevIndex) => (prevIndex + 1) % totalButtons);
          } else if (direction === "left") {
            setHighlightedIndex((prevIndex) =>
              prevIndex === 0 ? totalButtons - 1 : prevIndex - 1
            );
          }

          if (double_blink) {
            if (highlightedIndex === 0) {
              handleKeyInput("Advance");
            } else if (highlightedIndex <= commonPhrases.length) {
              handleKeyInput(commonPhrases[highlightedIndex - 1]);
            } else if (highlightedIndex === commonPhrases.length + 1) {
              handleKeyInput("ลบ");
            } else if (highlightedIndex === commonPhrases.length + 2) {
              handleKeyInput("ตกลง");
            } else if (highlightedIndex === commonPhrases.length + 3) {
              handleKeyInput("Alert");
            }
          }
        })
        .catch((error) => console.error("Error fetching gaze data:", error));
    }, 500);

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [highlightedIndex, handleKeyInput, commonPhrases.length]);

  return (
    <div className="basic-page">
      <div className="header-icons">

        <div className="header-icons">
          <GuideIcon />
          <LogoutIcon />
        </div>

      </div>

      <div className="webcam-container">
        <VideoFeed width="100%" borderRadius="10px" />
      </div>

      <div className="header-logo">
        <img src={logo} alt="Logo" className="logo-image" />
        <h1 className="logo-text">GazeTalk</h1>
      </div>

      <div className="input-container">
        <input
          type="text"
          value={inputText}
          readOnly
          placeholder="เลือกข้อความ..."
        />
      </div>

      <div className="keyboard">
        <div className="keyboard">
          {/* ปรับให้แถวหลักเป็น 5 คอลัมน์ */}
          <div className="keyboard-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            <button
              className={`key-button special-key ${highlightedIndex === 0 ? "highlighted" : ""}`}
              onClick={() => handleKeyInput("Advance")}
              style={{ fontSize: '24px', padding: '20px' }}
            >
              Advance
            </button>
            {commonPhrases.map((phrase, index) => (
              <button
                key={index}
                className={`key-button ${phrase === "อื่นๆ"
                    ? `special-key ${highlightedIndex === index + 1 ? "highlighted" : ""}` // ใช้ className เฉพาะ
                    : `${highlightedIndex === index + 1 ? "highlighted" : ""}`
                  }`}
                onClick={() => handleKeyInput(phrase)}
                style={{ fontSize: '24px', padding: '20px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {imageMap[phrase] ? (
                    <img
                      src={imageMap[phrase]}
                      alt={phrase}
                      className="button-image"
                      style={{ width: '80%', height: 'auto', objectFit: 'contain' }}
                    />
                  ) : null}
                  <span style={{ marginTop: '10px', fontSize: '18px', color: '#333' }}>{phrase}</span>
                </div>
              </button>
            ))}
          </div>


          {/* ปรับแถวล่างให้กระจายตามจำนวนปุ่ม */}
          <div className="keyboard-bottom" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            <button
              className={`key-button delete-key ${highlightedIndex === commonPhrases.length + 1 ? "highlighted" : ""}`}
              onClick={() => handleKeyInput("ลบ")}
            >
              <img src={deleteIcon} alt="Delete" className="icon-image" />
            </button>
            <button
              className={`key-button confirm-key ${highlightedIndex === commonPhrases.length + 2 ? "highlighted" : ""}`}
              onClick={() => handleKeyInput("ตกลง")}
            >
              ตกลง
            </button>
            <button
              className={`key-button alert-key ${highlightedIndex === commonPhrases.length + 3 ? "highlighted" : ""}`}
              onClick={() => handleKeyInput("Alert")}
            >
              <img src={bellIcon} alt="Alert" className="icon-image" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BasicPage;