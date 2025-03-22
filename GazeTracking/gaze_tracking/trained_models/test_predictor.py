import cv2

cap = cv2.VideoCapture(0)  # ใช้กล้องของ MacBook
if not cap.isOpened():
    print("ไม่สามารถเปิดกล้องได้ ❌")
else:
    print("เปิดกล้องสำเร็จ ✅")

cap.release()
