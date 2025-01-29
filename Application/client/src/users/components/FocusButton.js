import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

// FocusButton Component - สำหรับปุ่มแต่ละปุ่ม
const FocusButton = ({ 
  text,                    // ข้อความในปุ่ม
  icon,                    // ไอคอนในปุ่ม (optional)
  onSelect,               // callback เมื่อเลือกปุ่ม
  focusTimeRequired = 3,  // เวลาที่ต้องโฟกัส (วินาที)
  isHighlighted = false,  // สถานะไฮไลท์จาก eye tracking
  className = '',         // custom className
  disabled = false        // สถานะปิดการใช้งาน
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [focusTimer, setFocusTimer] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    let timer;
    if (isFocused && !disabled) {
      timer = setInterval(() => {
        setFocusTimer(prev => {
          if (prev >= focusTimeRequired) {
            clearInterval(timer);
            setShowConfirm(true);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isFocused, focusTimeRequired, disabled]);

  useEffect(() => {
    setIsFocused(isHighlighted);
  }, [isHighlighted]);

  const handleConfirm = () => {
    onSelect(text);
    setShowConfirm(false);
    setIsFocused(false);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setIsFocused(false);
  };

  return (
    <>
      <button
        className={`relative p-4 rounded-lg border-2 transition-all duration-200
          ${isFocused ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}
          ${className}`}
        disabled={disabled}
        onMouseEnter={() => !disabled && setIsFocused(true)}
        onMouseLeave={() => !disabled && setIsFocused(false)}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          {icon && <div className="text-2xl">{icon}</div>}
          <span>{text}</span>
          {isFocused && (
            <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {focusTimeRequired - focusTimer}s
            </div>
          )}
        </div>
      </button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-center">
              คุณต้องการเลือก "{text}" ใช่หรือไม่?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center gap-4">
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              onClick={handleConfirm}
            >
              ใช่
            </AlertDialogAction>
            <AlertDialogAction
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3"
              onClick={handleCancel}
            >
              ไม่
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// FocusButtonGrid Component - สำหรับจัดการกลุ่มปุ่มทั้งหมด
const FocusButtonGrid = ({
  buttons,                // array ของปุ่มทั้งหมด
  onSelectButton,        // callback เมื่อเลือกปุ่ม
  highlightedIndex = -1, // index ของปุ่มที่ถูกไฮไลท์
  gridCols = 4,         // จำนวนคอลัมน์
  focusTime = 3,        // เวลาโฟกัสเริ่มต้น
}) => {
  return (
    <div className={`grid grid-cols-${gridCols} gap-4`}>
      {buttons.map((button, index) => (
        <FocusButton
          key={index}
          text={button.text}
          icon={button.icon}
          onSelect={onSelectButton}
          focusTimeRequired={focusTime}
          isHighlighted={index === highlightedIndex}
          className={button.className}
          disabled={button.disabled}
        />
      ))}
    </div>
  );
};

export { FocusButton, FocusButtonGrid };