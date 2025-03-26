import logging
from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from gaze_tracking import GazeTracking
import cv2
import time
from flask_cors import CORS
import threading
import numpy as np
from PIL import Image
import io

# ตั้งค่าการบันทึกล็อก
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")  # เปิดใช้ WebSocket

gaze = GazeTracking()

# ตัวแปรเก็บเฟรมล่าสุด
latest_frame = None
frame_lock = threading.Lock()

# โหลด Haar Cascade Classifier สำหรับตรวจจับใบหน้า
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def select_nearest_face(faces):
    """เลือกใบหน้าที่ใกล้ที่สุด"""
    if len(faces) > 0:
        return max(faces, key=lambda f: f[2] * f[3])
    return None

# ตัวแปรสำหรับการติดตามการกะพริบตา
blink_count = 0
last_blink_time = 0
DOUBLE_BLINK_THRESHOLD = 0.6  
BLINKING_RATIO_THRESHOLD = 6  

eye_closed_start_time = None  
EYE_CLOSED_TIMEOUT = 0.5  

@socketio.on('send_frame')
def handle_frame(data):
    global latest_frame
    
    try:
        # รับเฟรมจาก client
        image_bytes = io.BytesIO(data)
        image = Image.open(image_bytes)
        
        # แปลงเป็น OpenCV format
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # อัพเดทเฟรมล่าสุด
        with frame_lock:
            latest_frame = frame
        
        # ประมวลผล gaze
        gaze_direction = "center"
        blink_detected = False
        eye_closed = False  
        eye_closed_too_long = False

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        nearest_face = select_nearest_face(faces)

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
                    blink_count = 0

                if not eye_closed and not eye_closed_too_long:
                    if gaze.is_right():
                        gaze_direction = "right"
                    elif gaze.is_left():
                        gaze_direction = "left"
                    elif gaze.is_center():
                        gaze_direction = "center"

        # ส่งผลลัพธ์กลับไปที่ client
        emit('gaze_data', {
            "direction": gaze_direction,
            "double_blink": blink_detected,
            "eye_closed": eye_closed,
            "eye_closed_too_long": eye_closed_too_long
        })
        
    except Exception as e:
        logger.error(f"Error processing frame: {e}")
        emit('error', {"error": str(e)})

@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        "status": "Server is running",
        "frame_available": latest_frame is not None
    })

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=81, debug=False)
