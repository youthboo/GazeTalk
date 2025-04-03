import eventlet
eventlet.monkey_patch()  # เพื่อให้รองรับ eventlet กับการทำงานของ Flask-SocketIO

import base64
import cv2
import numpy as np
from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from gaze_tracking import GazeTracking
import time
import logging

# ตั้งค่าระบบ logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app)  # อนุญาต CORS
socketio = SocketIO(app, cors_allowed_origins="*", max_http_buffer_size=10_000_000, compress=True)  # กำหนดให้เชื่อมต่อจากทุกแหล่ง

gaze = GazeTracking()

# โหลด Haar Cascade Classifier สำหรับตรวจจับใบหน้า
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

blink_count = 0
last_blink_time = 0
DOUBLE_BLINK_THRESHOLD = 0.6
BLINKING_RATIO_THRESHOLD = 6

eye_closed_start_time = None
EYE_CLOSED_TIMEOUT = 0.5

def decode_base64_image(image_base64):
    """แปลง base64 string เป็น numpy array (OpenCV)"""
    try:
        image_data = base64.b64decode(image_base64.split(",")[1])  
        np_arr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        return None

@socketio.on("upload-frame")
def handle_frame(data):
    """รับเฟรมจาก client และประมวลผลการติดตามสายตา"""
    global last_blink_time, eye_closed_start_time

    try:
        if "frame" not in data:
            emit("error", {"error": "Frame data missing"})
            return

        frame = decode_base64_image(data["frame"])
        if frame is None:
            return

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)

        gaze_direction = "center"
        eye_closed = False
        eye_closed_too_long = False  

        gaze.refresh(frame)  # วิเคราะห์ภาพ

        if gaze.eye_left is not None and gaze.eye_right is not None:
            blinking_left = gaze.eye_left.blinking or 0.0
            blinking_right = gaze.eye_right.blinking or 0.0
            blinking_ratio = (blinking_left + blinking_right) / 2

            eye_closed = blinking_ratio > BLINKING_RATIO_THRESHOLD

            # ตรวจจับว่าหลับตานานเกิน 3 วินาที
            if eye_closed:
                if eye_closed_start_time is None:
                    eye_closed_start_time = time.time()  # บันทึกเวลาที่เริ่มหลับตา
                else:
                    blink_duration = time.time() - eye_closed_start_time  

                    if blink_duration > 0.6: 
                        eye_closed_too_long = True
            else:
                eye_closed_start_time = None  

            if not eye_closed and not eye_closed_too_long:
                if gaze.is_right():
                    gaze_direction = "right"
                elif gaze.is_left():
                    gaze_direction = "left"
                elif gaze.is_center():
                    gaze_direction = "center"

        # ส่งข้อมูล gaze กลับไปยัง frontend
        emit("gaze-data", {
            "direction": gaze_direction,
            "eye_closed": eye_closed,
            "eye_closed_too_long": eye_closed_too_long,  # ใช้ตัวแปรนี้เป็น trigger ให้คลิก
        })

    except Exception as e:
        emit("error", {"error": str(e)})


@socketio.on("update-thresholds")
def update_thresholds(data):
    """อัปเดตค่าการมองซ้าย/ขวาตามที่ผู้ใช้กำหนด"""
    try:
        right_threshold = float(data.get("right", 0.53))  # ค่า default
        left_threshold = float(data.get("left", 0.73))

        logging.debug(f"Received thresholds update: Right = {right_threshold}, Left = {left_threshold}")

        # การอัปเดตค่าการมอง
        gaze.set_thresholds(right_threshold, left_threshold)  

        emit("threshold-updated", {"success": True, "right": right_threshold, "left": left_threshold})
        logging.debug(f"Thresholds updated successfully: Right = {right_threshold}, Left = {left_threshold}")

    except Exception as e:
        logging.error(f"Error updating thresholds: {str(e)}")
        emit("error", {"error": str(e)})

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=82) 
