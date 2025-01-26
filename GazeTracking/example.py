from flask import Flask, jsonify, Response
from gaze_tracking import GazeTracking
import cv2
import time
import atexit
from flask_cors import CORS
import threading

app = Flask(__name__)
CORS(app)

gaze = GazeTracking()

# ฟังก์ชันตรวจสอบและเปิดใช้งานกล้อง
def initialize_webcam():
    """
    ตรวจสอบและเปิดใช้งานกล้องที่พร้อมใช้งาน
    """
    for camera_id in [1, 0]:  
        webcam = cv2.VideoCapture(camera_id)
        if webcam.isOpened():
            print(f"Camera {camera_id} is active.")
            return webcam
        webcam.release()
    print("No cameras available.")
    return None

# ฟังก์ชันที่พยายามเปิดกล้องใหม่เมื่อปิด
def ensure_webcam_running():
    global webcam
    while True:
        if webcam is None or not webcam.isOpened():
            print("Attempting to reinitialize the webcam...")
            webcam = initialize_webcam()
        time.sleep(5)  # ตรวจสอบทุกๆ 5 วินาที

webcam = initialize_webcam()  # เริ่มต้นการใช้งานกล้อง

# เริ่ม Thread เพื่อตรวจสอบการเชื่อมต่อกล้อง
threading.Thread(target=ensure_webcam_running, daemon=True).start()

blink_count = 0
last_blink_time = 0
DOUBLE_BLINK_THRESHOLD = 1  
BLINKING_RATIO_THRESHOLD = 4.5  

@app.route('/video_feed')
def video_feed():
    """
    Endpoint สำหรับแสดงวิดีโอสดจากกล้อง
    """
    def generate_frames():
        while True:
            if webcam is None or not webcam.isOpened():
                continue  # รอจนกว่าจะเชื่อมต่อกล้องได้ใหม่
            success, frame = webcam.read()
            if not success:
                continue
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/gaze', methods=['GET'])
def get_gaze_data():
    """
    Endpoint สำหรับตรวจสอบข้อมูลทิศทางสายตาและ double blink
    """
    global blink_count, last_blink_time

    if webcam is None or not webcam.isOpened():
        return jsonify({"error": "No active webcam available."}), 500

    ret, frame = webcam.read()
    if not ret or frame is None:
        return jsonify({
            "error": "Unable to access webcam. Please check the camera connection."
        }), 500

    gaze.refresh(frame)

    gaze_direction = "center"
    blink_detected = False

    if gaze.eye_left is not None and gaze.eye_right is not None:
        blinking_left = gaze.eye_left.blinking or 0.0
        blinking_right = gaze.eye_right.blinking or 0.0
        blinking_ratio = (blinking_left + blinking_right) / 2

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


@app.route('/status', methods=['GET'])
def status():
    """
    Endpoint สำหรับตรวจสอบสถานะของเซิร์ฟเวอร์และกล้อง
    """
    return jsonify({
        "status": "Server is running",
        "camera_connected": webcam.isOpened() if webcam else False
    })


@app.route('/shutdown', methods=['POST'])
def shutdown():
    """
    Endpoint สำหรับปิดเซิร์ฟเวอร์และปล่อยทรัพยากรของกล้อง
    """
    try:
        if webcam and webcam.isOpened():
            webcam.release()
            print("Camera released on shutdown request.")
        return jsonify({"message": "Server shutting down..."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ฟังก์ชันปล่อยทรัพยากรกล้องเมื่อเซิร์ฟเวอร์ปิด
def release_resources():
    if webcam and webcam.isOpened():
        webcam.release()
        print("Camera resource released on exit.")

atexit.register(release_resources)

if __name__ == "__main__":
    try:
        if not webcam:
            print("No available cameras. Exiting.")
        else:
            app.run(host="0.0.0.0", port=5006, debug=False)
    except KeyboardInterrupt:
        print("Shutting down server...")
    finally:
        release_resources()
        print("Cleanup completed.")
