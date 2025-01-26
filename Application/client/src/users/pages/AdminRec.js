import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import logo from "../assets/hospital.png";
import Swal from "sweetalert2";
import './BasicPage.css';
import bellIcon from "../assets/bell.png";
import deleteIcon from "../assets/delete.png";
import VideoFeed from "../components/VideoFeed";
import { GuideIcon, LogoutIcon } from "../components/HeaderIcons";

const AdminRec = () => {
  const [inputText, setInputText] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [recommendedWords, setRecommendedWords] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendedWords = async () => {
      try {
        const patientGender = sessionStorage.getItem('patient_gender');
        const patientAgeRange = sessionStorage.getItem('patient_age_range');

        console.log('Fetching words with:', patientGender, patientAgeRange);

        const response = await fetch(
          `http://localhost:3008/api/words?gender=${patientGender}&ageRange=${patientAgeRange}`
        );

        if (!response.ok) {
          throw new Error('Error fetching words');
        }

        const data = await response.json();
        console.log('Fetched words:', data.words);
        setRecommendedWords(data.words);
      } catch (error) {
        console.error('Error fetching recommended words:', error.message);
      }
    };

    fetchRecommendedWords();
  }, []);

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
      const dbResponse = await fetch('http://localhost:3008/api/messages/send-message', {
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
      const telegramResponse = await fetch(`http://localhost:3008/api/patients/${patient_id}/send-message`, {
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

  const handleKeyInput = useCallback(
    (phrase) => {
      switch (phrase) {
        case "ลบ":
          setInputText("");
          break;
        case "ตกลง":
          handleSubmit();
          break;
        case "กลับ":
          navigate("/");
          break;
        case "Alert":
          navigate("/alert", { state: { returnTo: "/admin-rec" } });
          break;
        default:
          setInputText(phrase);
      }
    },
    // eslint-disable-next-line
    [inputText, navigate, handleSubmit]
  );

  const totalButtons = 1 + recommendedWords.length + 3;

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
              handleKeyInput("กลับ");
            } else if (highlightedIndex <= recommendedWords.length) {
              handleKeyInput(recommendedWords[highlightedIndex - 1]);
            } else if (highlightedIndex === recommendedWords.length + 1) {
              handleKeyInput("ลบ");
            } else if (highlightedIndex === recommendedWords.length + 2) {
              handleKeyInput("ตกลง");
            } else if (highlightedIndex === recommendedWords.length + 3) {
              handleKeyInput("Alert");
            }
          }
        })
        .catch((error) => console.error("Error fetching gaze data:", error));
    }, 500);

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [highlightedIndex, handleKeyInput, recommendedWords.length]);

  return (
    <div className="basic-page">
      <div className="header-icons">
        <GuideIcon />
        <LogoutIcon />
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
        <div className="keyboard-row" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <button
            className={`key-button special-key ${highlightedIndex === 0 ? "highlighted" : ""}`}
            onClick={() => handleKeyInput("กลับ")}
            style={{ padding: "20px" }} // ลบ fontSize ออกถ้าไม่ใช้
          >
            <img
              src={require('../assets/back.png')} // ใส่ path ของไฟล์ back.png
              alt="Back"
              style={{ width: "40px", height: "40px" }} // กำหนดขนาดของรูปภาพ
            />
          </button>
          {recommendedWords.map((word, index) => (
            <button
              key={index}
              className={`key-button ${highlightedIndex === index + 1 ? "highlighted" : ""}`}
              onClick={() => handleKeyInput(word)}
              style={{ fontSize: "24px", padding: "20px" }}
            >
              {word}
            </button>
          ))}
        </div>

        <div className="keyboard-bottom" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          <button
            className={`key-button delete-key ${highlightedIndex === recommendedWords.length + 1 ? "highlighted" : ""}`}
            onClick={() => handleKeyInput("ลบ")}
          >
            <img src={deleteIcon} alt="Delete" className="icon-image" />
          </button>
          <button
            className={`key-button confirm-key ${highlightedIndex === recommendedWords.length + 2 ? "highlighted" : ""}`}
            onClick={() => handleKeyInput("ตกลง")}
          >
            ตกลง
          </button>
          <button
            className={`key-button alert-key ${highlightedIndex === recommendedWords.length + 3 ? "highlighted" : ""}`}
            onClick={() => handleKeyInput("Alert")}
          >
            <img src={bellIcon} alt="Alert" className="icon-image" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminRec;
