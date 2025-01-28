import React, { useState, useMemo, useEffect, useCallback } from "react";
import deleteIcon from "../assets/delete.png";
import bellIcon from "../assets/bell.png";
import bin from "../assets/trash.png";
import "./AdvancePage.css";
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import VideoFeed from "../components/VideoFeed";
import Header from "../components/Header";
import dingSound from "../assets/pick.mp3";

const AdvancePage = () => {
  const [isShifted, setIsShifted] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [suggestHighlightedIndex, setSuggestHighlightedIndex] = useState(0);
  const [inputText, setInputText] = useState("");
  const [predictedWords, setPredictedWords] = useState([]);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const navigate = useNavigate();
  

  const consonants = useMemo(
    () => [
      "ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ",
      "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ",
      "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม",
      "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"
    ],
    []
  );

  const vowelsAndTones = useMemo(
    () => [
      "ะ", "า", "ิ", "ี", "ึ", "ื", "ุ", "ู", "เ", "แ", "โ", "ใ", "ไ",
      "ำ", "ๅ", "ั", "ฤ", "ฦ", "่", "้", "๊", "๋", "็", "์"
    ],
    []
  );

  const playDingSound = () => {
      const audio = new Audio(dingSound);
      audio.play();
    };

  const fetchPredictions = async (text) => {
    if (!text.trim()) {
      setPredictedWords([]);
      return;
    }

    try {
      const response = await fetch("http://localhost:5009/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input_text: text }),
      });
      const data = await response.json();
      if (data.predictions) {
        const words = data.predictions.map((prediction) => prediction.word);
        setPredictedWords(words.slice(0, 3));
        setShowCloseButton(true);
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
    }
  };


  const handleShift = useCallback(() => {
    setIsShifted(prev => !prev);
    setHighlightedIndex(0);
  }, []);

  const handleDelete = useCallback(() => {
    setInputText(prev => {
      const newText = prev.slice(0, -1);
      fetchPredictions(newText);
      return newText;
    });
  }, []);

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


  const handleAlert = useCallback(() => {
    navigate("/alert", { state: { returnTo: "/advance" } });
  }, [navigate]);

  const handleBasic = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleClosePredictions = useCallback(() => {
    setPredictedWords([]);
    setShowCloseButton(false);
  }, []);

  const handlePredictionClick = useCallback((word) => {
    setInputText(word);
    setPredictedWords([]);
    setShowCloseButton(false);
  }, []);

  const handleClear = useCallback(() => {
    setInputText("");
    setPredictedWords([]);
    setShowCloseButton(false);
  }, []);

  useEffect(() => {
    if (predictedWords.length === 2) {
      setPredictedWords(prevWords => [...prevWords, ""]);
    }
  }, [predictedWords]);

  const keyboardLayout = useMemo(() => {
    const currentSet = isShifted ? vowelsAndTones : consonants;
    return {
      row1: ["Basic", ...currentSet.slice(0, 7), "ลบ"],
      row2: [...currentSet.slice(7, 16), "Shift"],
      row3: currentSet.slice(16, 27),
      row4: currentSet.slice(27, 38),

      row5: ["Shift", ...currentSet.slice(38, 44)],

      bottomRow: ["delete", "ตกลง", "Clear", "Alert"]
    };
  }, [isShifted, consonants, vowelsAndTones]);

  const handleKeyInput = useCallback((key) => {
    playDingSound();
    // eslint-disable-next-line
    const allKeys = Object.values(keyboardLayout).flat();

    switch (key) {
      case "Shift":
        handleShift();
        break;
      case "delete":
      case "ลบ":
        handleDelete();
        break;
      case "ตกลง":
        handleSubmit();
        break;
      case "Alert":
        handleAlert();
        break;
      case "Basic":
        handleBasic();
        break;
      case "Clear":
        handleClear();
        break;
      default:
        setInputText(prev => {
          const newText = prev + key;
          fetchPredictions(newText);
          return newText;
        });
    }
  }, [handleShift, handleDelete, handleSubmit, handleAlert, handleBasic, handleClear, keyboardLayout]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://localhost:5006/gaze")
        .then((response) => response.json())
        .then((data) => {
          const { direction, double_blink } = data;
          const allKeys = Object.values(keyboardLayout).flat();

          if (predictedWords.length > 0) {
            if (direction === "right") {
              setSuggestHighlightedIndex(
                (prevIndex) => (prevIndex + 1) % (predictedWords.length + 1)
              );
            } else if (direction === "left") {
              setSuggestHighlightedIndex(
                (prevIndex) =>
                  prevIndex === 0 ? predictedWords.length : prevIndex - 1
              );
            }

            if (double_blink) {
              if (suggestHighlightedIndex === predictedWords.length) {
                handleClosePredictions();
              } else {
                handlePredictionClick(predictedWords[suggestHighlightedIndex]);
              }
            }
          } else {
            if (direction === "right") {
              setHighlightedIndex((prevIndex) => (prevIndex + 1) % allKeys.length);
            } else if (direction === "left") {
              setHighlightedIndex((prevIndex) =>
                prevIndex === 0 ? allKeys.length - 1 : prevIndex - 1
              );
            }

            if (double_blink) {
              handleKeyInput(allKeys[highlightedIndex]);
            }
          }
        })
        .catch((error) => console.error("Error fetching gaze data:", error));
    }, 500);

    return () => clearInterval(interval);
  }, [keyboardLayout, predictedWords, highlightedIndex, suggestHighlightedIndex, handlePredictionClick, handleKeyInput, handleClosePredictions]);


  return (
    <div className="advance-page">
      <Header />
      <div className="webcam-container">
        <VideoFeed width="100%" borderRadius="10px" />
      </div>

      <div className="input-container">
        <input
          type="text"
          value={inputText}
          readOnly
          placeholder="พิมพ์ข้อความ..."
        />
      </div>

      <div className="prediction-buttons">
        {Array.from({ length: 4 }, (_, index) => (
          <button
            key={index}
            className={`prediction-button ${(index === 3 && suggestHighlightedIndex === 3) ||
                (index !== 3 && predictedWords[index] && index === suggestHighlightedIndex)
                ? "highlighted"
                : ""
              }`}
            onClick={() => index === 3 ? handleClosePredictions() : handlePredictionClick(predictedWords[index] || "")}
          >
            {predictedWords[index] !== undefined ? predictedWords[index] : (index === 3 ? "❌" : "")}
          </button>
        ))}
      </div>

      <div className="keyboard">
        <div className="keyboard-row">
          {keyboardLayout.row1.map((key, index) => (
            <button
              key={index}
              className={`key-button ${key === "Basic" ? "basic-key" : key === "ลบ" ? "delete-key" : ""} ${index === highlightedIndex ? "highlighted" : ""}`}
              onClick={() => handleKeyInput(key)}
            >
              {key === "ลบ" ? <img src={deleteIcon} alt="Delete" className="icon-image" /> : key}
            </button>
          ))}
        </div>

        {[keyboardLayout.row2, keyboardLayout.row3, keyboardLayout.row4,].map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map((key, index) => {
              const currentIndex =
                keyboardLayout.row1.length +
                (rowIndex >= 1 ? keyboardLayout.row2.length : 0) +
                (rowIndex >= 2 ? keyboardLayout.row3.length : 0) +
                (rowIndex >= 3 ? keyboardLayout.row4.length : 0) +
                index;
              return (
                <button
                  key={index}
                  className={`key-button ${currentIndex === highlightedIndex ? "highlighted" : ""
                    } ${key === "Shift" ? "shift-key" : ""}`} // เพิ่ม className "shift-key"
                  onClick={() => handleKeyInput(key)}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}

        <div className="keyboard-row">
          {keyboardLayout.row5.map((key, index) => {
            const currentIndex = index + keyboardLayout.row1.length +
              keyboardLayout.row2.length + keyboardLayout.row3.length +
              keyboardLayout.row4.length;
            return (
              <button
                key={index}
                className={`key-button ${key === "Shift" ? "shift-key" : ""} ${currentIndex === highlightedIndex ? "highlighted" : ""}`}
                onClick={() => handleKeyInput(key)}
              >
                {key}
              </button>
            );
          })}
        </div>

        <div className="keyboard-bottom">
          {keyboardLayout.bottomRow.map((key, index) => {
            const totalPreviousKeys =
              keyboardLayout.row1.length +
              keyboardLayout.row2.length +
              keyboardLayout.row3.length +
              keyboardLayout.row4.length +
              keyboardLayout.row5.length;

            const isHighlighted = (index + totalPreviousKeys) === highlightedIndex;

            return (
              <button
                key={index}
                className={`key-button ${key === "delete" ? "delete-key" : key === "ตกลง" ? "confirm-key" : key === "Clear" ? "clear-key" : key === "Alert" ? "alert-key" : ""} ${isHighlighted ? "highlighted" : ""}`}
                onClick={() => handleKeyInput(key)}
              >
                {key === "delete" ? <img src={deleteIcon} alt="Delete" className="icon-image" /> :
                  key === "Clear" ? <img src={bin} alt="Clear" className="icon-image" /> :
                    key === "Alert" ? <img src={bellIcon} alt="Alert" className="icon-image" /> : key}

              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdvancePage;