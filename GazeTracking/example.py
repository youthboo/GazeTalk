import logging
import base64
import cv2
import numpy as np
from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from gaze_tracking import GazeTracking
import time

# ตั้งค่าการบันทึกล็อก
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

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
        image_data = base64.b64decode(image_base64.split(",")[1])  # ตัด "data:image/jpeg;base64," ออก
        np_arr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        logger.error(f"Error decoding image: {e}")
        return None

@socketio.on("upload-frame")
def handle_frame(data):
    """รับเฟรมจาก client และประมวลผลการติดตามสายตา"""
    global blink_count, last_blink_time, eye_closed_start_time

    try:
        if "frame" not in data:
            logger.error("Frame not found in data")
            emit("error", {"error": "Frame data missing"})
            return

        frame = decode_base64_image(data["frame"])
        if frame is None:
            logger.error("Decoded frame is None")
            return

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)

        gaze_direction = "center"
        blink_detected = False
        eye_closed = False
        eye_closed_too_long = False

        gaze.refresh(frame)  # ใช้เฟรมทั้งภาพ ไม่ใช่เฉพาะใบหน้า

        if gaze.eye_left is not None and gaze.eye_right is not None:
            blinking_left = gaze.eye_left.blinking or 0.0
            blinking_right = gaze.eye_right.blinking or 0.0
            blinking_ratio = (blinking_left + blinking_right) / 2

            eye_closed = blinking_ratio > BLINKING_RATIO_THRESHOLD

            if eye_closed:
                if eye_closed_start_time is None:
                    eye_closed_start_time = time.time()
                elif time.time() - eye_closed_start_time > EYE_CLOSED_TIMEOUT:
                    eye_closed_too_long = True
                    logger.info("User has closed eyes for too long!")
            else:
                eye_closed_start_time = None

            if blinking_ratio > BLINKING_RATIO_THRESHOLD:
                current_time = time.time()
                if current_time - last_blink_time <= DOUBLE_BLINK_THRESHOLD:
                    blink_count += 1
                else:
                    blink_count = 1
                last_blink_time = current_time

            if blink_count == 2:
                blink_detected = True
                logger.info("Double blink detected.")
                blink_count = 0  # รีเซ็ต blink_count

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
            "double_blink": blink_detected,
            "eye_closed": eye_closed,
            "eye_closed_too_long": eye_closed_too_long,
        })

    except Exception as e:
        logger.error(f"Error processing frame: {e}")
        emit("error", {"error": str(e)})

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5006)
