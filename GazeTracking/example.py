from flask import Flask, jsonify
from gaze_tracking import GazeTracking
import cv2
import time
from flask_cors import CORS

# สร้างแอป Flask
app = Flask(__name__)
CORS(app)  # เปิดใช้งาน CORS

# สร้างออบเจกต์ GazeTracking
gaze = GazeTracking()
webcam = cv2.VideoCapture(0)

# ตัวแปรสำหรับการตรวจจับ double blink
blink_count = 0
last_blink_time = 0
DOUBLE_BLINK_THRESHOLD = 1  # วินาที
BLINKING_RATIO_THRESHOLD = 4.5  # เกณฑ์สำหรับการกระพริบตา


@app.route('/gaze', methods=['GET'])
def get_gaze_data():
    """
    Endpoint สำหรับตรวจสอบข้อมูลทิศทางสายตาและ double blink
    """
    global blink_count, last_blink_time

    try:
        # อ่านเฟรมจากกล้อง
        ret, frame = webcam.read()
        if not ret or frame is None:
            return jsonify({
                "error": "Unable to access webcam. Please check the camera connection."
            }), 500

        # ประมวลผลด้วย GazeTracking
        gaze.refresh(frame)

        # ค่าเริ่มต้น
        gaze_direction = "center"
        blink_detected = False

        # ตรวจสอบว่ามีการตรวจจับดวงตา
        if gaze.eye_left is not None and gaze.eye_right is not None:
            # ตรวจสอบ blinking_ratio
            blinking_left = gaze.eye_left.blinking or 0.0
            blinking_right = gaze.eye_right.blinking or 0.0
            blinking_ratio = (blinking_left + blinking_right) / 2

            # ตรวจจับการกระพริบตา
            if blinking_ratio > BLINKING_RATIO_THRESHOLD:
                current_time = time.time()
                if current_time - last_blink_time <= DOUBLE_BLINK_THRESHOLD:
                    blink_count += 1
                else:
                    blink_count = 1
                last_blink_time = current_time

            if blink_count == 2:
                blink_detected = True
                print("Double blink detected!")
                blink_count = 0

        # ระบุทิศทางสายตา
        if gaze.is_right():
            gaze_direction = "right"
        elif gaze.is_left():
            gaze_direction = "left"
        elif gaze.is_center():
            gaze_direction = "center"

        return jsonify({
            "direction": gaze_direction,
            "double_blink": blink_detected
        })

    except Exception as e:
        print(f"Error in /gaze: {e}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500


@app.route('/status', methods=['GET'])
def status():
    """
    Endpoint สำหรับตรวจสอบสถานะของเซิร์ฟเวอร์และกล้อง
    """
    return jsonify({
        "status": "Server is running",
        "camera_connected": webcam.isOpened()
    })


@app.route('/shutdown', methods=['POST'])
def shutdown():
    """
    Endpoint สำหรับปิดเซิร์ฟเวอร์และปล่อยทรัพยากรของกล้อง
    """
    try:
        if webcam.isOpened():
            webcam.release()
        return jsonify({"message": "Server shutting down..."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    try:
        app.run(host="0.0.0.0", port=5006, debug=True)
    except KeyboardInterrupt:
        print("Shutting down server...")
    finally:
        # ปิดการใช้งานกล้องเมื่อเซิร์ฟเวอร์ปิด
        if webcam.isOpened():
            webcam.release()
        print("Camera released.")
