import logging
from flask import Flask, jsonify
from gaze_tracking import GazeTracking
import cv2
import time
import atexit
from flask_cors import CORS
import threading
import numpy as np

# ตั้งค่าการบันทึกล็อก
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

gaze = GazeTracking()


# ฟังก์ชันตรวจสอบและเปิดใช้งานกล้องอย่างปลอดภัย
def safe_initialize_webcam():
    camera_ids = [1, 0, -1]  
    for camera_id in camera_ids:
        try:
            webcam = cv2.VideoCapture(camera_id)
            webcam.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            webcam.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            webcam.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            ret, frame = webcam.read()
            if ret and frame is not None and frame.size > 0:
                logger.info(f"Camera {camera_id} initialized successfully.")
                return webcam
            
            webcam.release()
        except Exception as e:
            logger.error(f"Failed to initialize camera {camera_id}: {e}")
    
    logger.error("No available cameras found.")
    return None

def safe_read_frame(webcam):
    try:
        ret, frame = webcam.read()
        if not ret or frame is None or frame.size == 0:
            logger.warning("Frame capture failed, retrying...")
            return False, None
        return ret, frame
    except cv2.error as e:
        logger.error(f"OpenCV error: {e}")
        webcam.release()
        time.sleep(1)
        webcam = safe_initialize_webcam()
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
    return False, None

# โหลด Haar Cascade Classifier สำหรับตรวจจับใบหน้า
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def select_nearest_face(faces):
    """เลือกใบหน้าที่ใกล้ที่สุด"""
    if len(faces) > 0:
        return max(faces, key=lambda f: f[2] * f[3])
    return None

webcam = safe_initialize_webcam()

blink_count = 0
last_blink_time = 0
DOUBLE_BLINK_THRESHOLD = 0.8  
BLINKING_RATIO_THRESHOLD = 6  

eye_closed_start_time = None  
EYE_CLOSED_TIMEOUT = 60  

@app.route('/gaze', methods=['GET'])
def get_gaze_data():
    global blink_count, last_blink_time, eye_closed_start_time

    if webcam is None or not webcam.isOpened():
        return jsonify({"error": "No active webcam available."}), 500

    ret, frame = safe_read_frame(webcam)
    if not ret:
        return jsonify({"error": "Unable to access webcam. Please check the camera connection."}), 500

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    nearest_face = select_nearest_face(faces)

    gaze_direction = "center"
    blink_detected = False
    eye_closed = False  
    eye_closed_too_long = False  # เพิ่มตัวแปรตรวจจับว่าหลับตานานเกินไปหรือไม่

    if nearest_face is not None:
        x, y, w, h = nearest_face
        roi = frame[y:y+h, x:x+w]
        gaze.refresh(roi)

        if gaze.eye_left is not None and gaze.eye_right is not None:
            blinking_left = gaze.eye_left.blinking or 0.0
            blinking_right = gaze.eye_right.blinking or 0.0
            blinking_ratio = (blinking_left + blinking_right) / 2

            eye_closed = blinking_ratio > BLINKING_RATIO_THRESHOLD  

            if eye_closed:
                if eye_closed_start_time is None:
                    eye_closed_start_time = time.time()  # เริ่มจับเวลาหลับตา
                elif time.time() - eye_closed_start_time > EYE_CLOSED_TIMEOUT:
                    eye_closed_too_long = True  # ✅ ตรวจจับว่าหลับตานานเกินไป
            else:
                eye_closed_start_time = None  # รีเซ็ตเวลาถ้าลืมตา

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
                blink_count = 0

        # ✅ ป้องกันไม่ให้ gaze เคลื่อนที่หรือเลือกปุ่มถ้าหลับตานานเกิน 1 นาที
        if not eye_closed and not eye_closed_too_long:
            if gaze.is_right():
                gaze_direction = "right"
            elif gaze.is_left():
                gaze_direction = "left"
            elif gaze.is_center():
                gaze_direction = "center"

    return jsonify({
        "direction": gaze_direction,
        "double_blink": blink_detected,
        "eye_closed": eye_closed,
        "eye_closed_too_long": eye_closed_too_long  # ✅ ส่งค่า eye_closed_too_long ไปที่ frontend
    })

@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        "status": "Server is running",
        "camera_connected": webcam.isOpened() if webcam else False
    })

@app.route('/shutdown', methods=['POST'])
def shutdown():
    try:
        if webcam and webcam.isOpened():
            webcam.release()
            logger.info("Camera released on shutdown request.")
        return jsonify({"message": "Server shutting down..."}), 200
    except Exception as e:
        logger.error(f"Shutdown error: {e}")
        return jsonify({"error": str(e)}), 500

def release_resources():
    global webcam
    if webcam and webcam.isOpened():
        webcam.release()
        logger.info("Released camera resources.")

atexit.register(release_resources)

if __name__ == "__main__":
    if not webcam:
        logger.error("No available cameras. Exiting.")
    else:
        app.run(host="0.0.0.0", port=5006, debug=False)
