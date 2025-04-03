import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import deleteIcon from "../assets/delete.png";
import bellIcon from "../assets/bell.png";
import Swal from "sweetalert2";
import './BasicPage.css';
import VideoFeed from "../components/VideoFeed";
import Header from "../components/Header";
import GazeSettings from "../components/GazeSettings";
import { io } from 'socket.io-client';
import useDingSound from "../hooks/useDingSound";

const BasicPage = () => {

  const [inputText, setInputText] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const navigate = useNavigate();
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  // eslint-disable-next-line
  const [eyeClosedTooLong, setEyeClosedTooLong] = useState(false);
  const [advanceButtonEnabled, setAdvanceButtonEnabled] = useState(false);
  const [isHighlightPaused, setIsHighlightPaused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAdvanceButtonEnabled(true);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const commonPhrases = useMemo(() => [
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
  ], []);

  const imageMap = useMemo(() => ({
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
  }), []);

  const playDingSound = useDingSound();

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim()) {
      return;
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

    try {
      // บันทึกข้อความลง DB
      const dbResponse = await fetch(`${process.env.REACT_APP_GAZETALK_URL}/api/messages/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          patient_id
        }),
      });

      if (!dbResponse.ok) {
        throw new Error('Failed to save message to database');
      }

      // ส่งข้อความไป Telegram
      const telegramResponse = await fetch(`${process.env.REACT_APP_GAZETALK_URL}/api/patients/${patient_id}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText
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

      setInputText(""); 
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
    playDingSound();

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
        if (advanceButtonEnabled) {
          navigate("/advance");
        }
        break;
      case "อื่นๆ":
        navigate("/admin-rec");
        break;
      default:
        setInputText(phrase);
    }
    // eslint-disable-next-line
  }, [inputText, navigate, handleSubmit, advanceButtonEnabled]);

  const toggleHighlight = () => {
    setIsHighlightPaused((prev) => !prev);
  };

  const handleGazeData = useCallback((data) => {
    const { direction, eye_closed, eye_closed_too_long } = data;
    const totalButtons = 1 + commonPhrases.length + 3;

    // หากการไฮไลท์ถูกหยุด ไม่ให้ดำเนินการใดๆ
    if (isHighlightPaused) {
      return; 
    }

    if (!eye_closed ) {
      setHighlightedIndex((prevIndex) => {
        if (direction === "right") {
          return (prevIndex + 1) % totalButtons;
        } else if (direction === "left") {
          return prevIndex === 0 ? totalButtons - 1 : prevIndex - 1;
        }
        return prevIndex;
      });
    }

    if (eye_closed_too_long && !eyeClosedTooLong) {
      if (highlightedIndex !== lastSelectedIndex) {
        setLastSelectedIndex(highlightedIndex);
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
    }
  }, [
    highlightedIndex,
    handleKeyInput,
    commonPhrases,
    lastSelectedIndex,
    eyeClosedTooLong, isHighlightPaused
]);

  const socket = useRef(null);

  useEffect(() => {
    socket.current = io(`${process.env.REACT_APP_GAZEMODEL_URL}`);

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const handleThresholdChange = (right, left) => {
    console.log("New gaze thresholds:", right, left);
    if (socket.current) {
      socket.current.emit("update-thresholds", { right, left });
    }
  };
  
  return (
    <div className="basic-page">
      <Header isHighlightPaused={isHighlightPaused} toggleHighlight={toggleHighlight} />
      <GazeSettings onThresholdChange={handleThresholdChange} /> {/* เรียกใช้งานที่นี่ */}
      <div className="webcam-container">
        <VideoFeed width="100%" borderRadius="10px" onGazeDataReceived={handleGazeData} />
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
              style={{
                fontSize: '24px',
                padding: '20px',

                opacity: advanceButtonEnabled ? 1 : 0.5,
                cursor: advanceButtonEnabled ? 'pointer' : 'not-allowed'
              }}
              disabled={!advanceButtonEnabled}
            >
              Advance
            </button>
            {commonPhrases.map((phrase, index) => (
              <button
                key={index}
                className={`key-button ${phrase === "อื่นๆ"
                  ? `special-key ${highlightedIndex === index + 1 ? "highlighted" : ""}`
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