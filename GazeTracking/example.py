import eventlet
eventlet.monkey_patch() 
import base64
import cv2
import numpy as np
from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from gaze_tracking import GazeTracking
import time
import logging
from flask import request

# ตั้งค่าระบบ logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", max_http_buffer_size=50_000_000, compress=True)

gaze = GazeTracking()
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

last_blink_time = 0
DOUBLE_BLINK_THRESHOLD = 0.3
BLINKING_RATIO_THRESHOLD = 5 
eye_closed_start_time = None
EYE_CLOSED_TIMEOUT = 0.5
selection_triggered = False

def decode_base64_image(image_base64):
    try:
        image_data = base64.b64decode(image_base64.split(",")[1])  
        np_arr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        return None

@socketio.on("upload-frame")
def handle_frame(data):
    global last_blink_time, eye_closed_start_time

    try:
        if "frame" not in data:
            emit("error", {"error": "Frame data missing"})
            return

        frame = decode_base64_image(data["frame"])
        if frame is None:
            return

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        # ปรับค่าเพื่อตรวจจับใบหน้าที่อยู่ไกลได้ดีขึ้น
        faces = face_cascade.detectMultiScale(gray, 1.05, 1, minSize=(20, 20), maxSize=(300, 300))

        gaze_direction = "center"
        blink_detected = False
        eye_closed = False
        eye_closed_too_long = False

        if len(faces) > 0:
            # ใช้ใบหน้าแรกที่ตรวจจับได้
            (x, y, w, h) = faces[0]
            face_only = frame[y:y+h, x:x+w]
            gaze.refresh(face_only)
        else:
            gaze.refresh(frame)  # fallback ถ้าไม่เจอหน้าเลย

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
            else:
                eye_closed_start_time = None

            if blinking_ratio > BLINKING_RATIO_THRESHOLD:
                current_time = time.time()
                if current_time - last_blink_time > DOUBLE_BLINK_THRESHOLD:
                    blink_detected = True
                last_blink_time = current_time

            if not eye_closed and not eye_closed_too_long:
                if gaze.is_right():
                    gaze_direction = "right"
                elif gaze.is_left():
                    gaze_direction = "left"
                elif gaze.is_center():
                    gaze_direction = "center"

        emit("gaze-data", {
            "direction": gaze_direction,
            "blink_detected": blink_detected,  
            "eye_closed": eye_closed,
            "eye_closed_too_long": eye_closed_too_long,
        })

    except Exception as e:
        emit("error", {"error": str(e)})

@socketio.on('reset-eye-state')
def reset_eye_state():
    global eye_closed_start_time, selection_triggered
    eye_closed_start_time = None
    selection_triggered = False

@socketio.on("update-thresholds")
def update_thresholds(data):
    try:
        right_threshold = float(data.get("right", 0.55))
        left_threshold = float(data.get("left", 0.75))

        logging.debug(f"Received thresholds update: Right = {right_threshold}, Left = {left_threshold}")
        gaze.set_thresholds(right_threshold, left_threshold)  

        emit("threshold-updated", {"success": True, "right": right_threshold, "left": left_threshold})
        logging.debug(f"Thresholds updated successfully: Right = {right_threshold}, Left = {left_threshold}")

    except Exception as e:
        logging.error(f"Error updating thresholds: {str(e)}")
        emit("error", {"error": str(e)})

@socketio.on("update-settings")
def handle_update_settings(data):
    global EYE_CLOSED_TIMEOUT
    print("New settings received:", data)
    EYE_CLOSED_TIMEOUT = float(data.get("eyeClosedTimeout", 0.5))

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=82) #ตอน deploy แก้เป็น port 82/localhost :5006
