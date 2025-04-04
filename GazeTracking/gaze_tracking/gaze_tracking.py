from __future__ import division
import os
import cv2
import dlib
from .eye import Eye
from .calibration import Calibration

class GazeTracking(object):
    def __init__(self):
        self.frame = None
        self.eye_left = None
        self.eye_right = None
        self.eye_closed = False
        self.calibration = Calibration()

        # ค่า default สำหรับการตรวจจับการมอง
        self.right_threshold = 0.53 
        self.left_threshold = 0.73  

        self._face_detector = dlib.get_frontal_face_detector()
        cwd = os.path.abspath(os.path.dirname(__file__))
        model_path = os.path.abspath(os.path.join(cwd, "trained_models/shape_predictor_68_face_landmarks.dat"))

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")

        self._predictor = dlib.shape_predictor(model_path)

    def set_thresholds(self, right, left):
        """อัปเดตค่า threshold สำหรับมองขวาและซ้าย"""
        self.right_threshold = right
        self.left_threshold = left

    def is_right(self):
        """คืนค่า True ถ้าผู้ใช้มองไปทางขวา"""
        return self.pupils_located and not self.eye_closed and self.horizontal_ratio() <= self.right_threshold

    def is_left(self):
        """คืนค่า True ถ้าผู้ใช้มองไปทางซ้าย"""
        return self.pupils_located and not self.eye_closed and self.horizontal_ratio() >= self.left_threshold

    def is_center(self):
        """คืนค่า True ถ้าผู้ใช้มองตรงกลาง"""
        if self.pupils_located and not self.eye_closed:
            horizontal = self.horizontal_ratio()
            return self.right_threshold < horizontal < self.left_threshold
        return False

    @property
    def pupils_located(self):
        """ตรวจสอบว่าตำแหน่งของรูม่านตาถูกตรวจจับได้"""
        try:
            return all([
                int(self.eye_left.pupil.x),
                int(self.eye_left.pupil.y),
                int(self.eye_right.pupil.x),
                int(self.eye_right.pupil.y)
            ])
        except Exception:
            return False

    def _analyze(self):
        """ตรวจจับใบหน้าและสร้างอ็อบเจ็กต์ Eye"""
        frame = cv2.cvtColor(self.frame, cv2.COLOR_BGR2GRAY)
        faces = self._face_detector(frame)

        try:
            landmarks = self._predictor(frame, faces[0])
            self.eye_left = Eye(frame, landmarks, 0, self.calibration)
            self.eye_right = Eye(frame, landmarks, 1, self.calibration)
        except IndexError:
            self.eye_left = None
            self.eye_right = None

    def refresh(self, frame):
        """อัปเดตเฟรมและวิเคราะห์ข้อมูล"""
        self.frame = frame
        self._analyze()

        if self.eye_left and self.eye_right:
            blinking_left = self.eye_left.blinking or 0.0
            blinking_right = self.eye_right.blinking or 0.0
            blinking_ratio = (blinking_left + blinking_right) / 2

            self.eye_closed = blinking_ratio > 5.5

    def pupil_left_coords(self):
        """คืนค่าตำแหน่งของรูม่านตาซ้าย"""
        if self.pupils_located:
            return (
                self.eye_left.origin[0] + self.eye_left.pupil.x,
                self.eye_left.origin[1] + self.eye_left.pupil.y
            )

    def pupil_right_coords(self):
        """คืนค่าตำแหน่งของรูม่านตาขวา"""
        if self.pupils_located:
            return (
                self.eye_right.origin[0] + self.eye_right.pupil.x,
                self.eye_right.origin[1] + self.eye_right.pupil.y
            )

    def horizontal_ratio(self):
        """คำนวณค่าการมองทางแนวนอน"""
        if self.pupils_located:
            left_center = self.eye_left.center[0] * 2 - 10
            right_center = self.eye_right.center[0] * 2 - 10

            if left_center == 0 or right_center == 0:
                return 0.5  # ป้องกันหารด้วยศูนย์

            pupil_left = self.eye_left.pupil.x / left_center
            pupil_right = self.eye_right.pupil.x / right_center
            return (pupil_left + pupil_right) / 2
        return 0.5

    def vertical_ratio(self):
        """คำนวณค่าการมองทางแนวตั้ง"""
        if self.pupils_located:
            left_center = self.eye_left.center[1] * 2 - 10
            right_center = self.eye_right.center[1] * 2 - 10

            if left_center == 0 or right_center == 0:
                return 0.5  # ป้องกันหารด้วยศูนย์

            pupil_left = self.eye_left.pupil.y / left_center
            pupil_right = self.eye_right.pupil.y / right_center
            return (pupil_left + pupil_right) / 2
        return 0.5

    def is_blinking(self):
        """คืนค่า True ถ้าผู้ใช้กระพริบตา"""
        return self.eye_closed

    def annotated_frame(self):
        """คืนค่าเฟรมที่มีการไฮไลต์ตำแหน่งรูม่านตา"""
        frame = self.frame.copy()

        if self.pupils_located:
            color = (0, 255, 0)
            x_left, y_left = self.pupil_left_coords()
            x_right, y_right = self.pupil_right_coords()

            cv2.drawMarker(frame, (x_left, y_left), color, cv2.MARKER_CROSS, 10, 2)
            cv2.drawMarker(frame, (x_right, y_right), color, cv2.MARKER_CROSS, 10, 2)

        return frame
