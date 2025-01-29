import cv2

cap = cv2.VideoCapture("udp://127.0.0.1:8554", cv2.CAP_FFMPEG)

if cap.isOpened():
    print("✅ Connected to camera stream!")
else:
    print("❌ Failed to connect to camera stream!")

while True:
    ret, frame = cap.read()
    if not ret:
        print("⚠️ Failed to read frame! Retrying...")
        continue

    cv2.imshow("Camera Stream", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
